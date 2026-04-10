import { EnrollmentRepository } from '../repositories/enrollment.repository';
import { AcademicClass } from '../models/AcademicClass.model';
import { Student } from '../models/Student.model';
import { auditService } from './audit.service';
import { Types } from 'mongoose';
import { Enrollment, IEnrollment } from '../models/Enrollment.model';
import { LedgerService } from './ledger.service';
import { LedgerRepository } from '../repositories/ledger.repository';
import mongoose from 'mongoose';

const enrollmentRepo = new EnrollmentRepository();

export class EnrollmentService {
    async createEnrollment(params: {
        studentId: string;
        academicClassId: string;
        createdBy: string;
        ipAddress: string;
        userAgent: string;
    }): Promise<IEnrollment> {
        // Validate student exists and is ACTIVE
        const student = await Student.findById(params.studentId);
        if (!student) throw new Error('Student not found');
        if (student.status !== 'ACTIVE') throw new Error('Only ACTIVE students can be enrolled');

        // Validate academic class exists and is active
        const academicClass = await AcademicClass.findById(params.academicClassId);
        if (!academicClass) throw new Error('AcademicClass not found');
        if (!academicClass.isActive) throw new Error('Cannot enroll in an inactive class');

        // Check for duplicate enrollment
        const existing = await enrollmentRepo.findByStudentAndYear(
            params.studentId,
            academicClass.academicYear
        );
        if (existing) {
            throw new Error(
                `Student is already enrolled for academic year ${academicClass.academicYear}`
            );
        }

        // Create enrollment — totalFee is snapshot from class (immutable)
        const enrollment = await enrollmentRepo.create({
            studentId: new Types.ObjectId(params.studentId),
            academicClassId: new Types.ObjectId(params.academicClassId),
            academicYear: academicClass.academicYear,
            totalFee: academicClass.totalFee,
            concessionType: 'NONE',
            concessionValue: 0,
            netFee: academicClass.totalFee,
            status: 'ONGOING',
            createdBy: new Types.ObjectId(params.createdBy),
        });

        auditService.logAsync({
            actorId: params.createdBy,
            action: 'ENROLLMENT_CREATED',
            entityType: 'ENROLLMENT',
            entityId: enrollment._id.toString(),
            before: null,
            after: {
                studentId: params.studentId,
                academicClassId: params.academicClassId,
                academicYear: academicClass.academicYear,
                netFee: academicClass.totalFee,
            },
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
        });

        return enrollment;
    }

    async findById(id: string): Promise<IEnrollment | null> {
        return enrollmentRepo.findById(id);
    }

    async findByStudentAndYear(studentId: string, academicYear: string): Promise<IEnrollment | null> {
        return enrollmentRepo.findByStudentAndYear(studentId, academicYear);
    }

    async findByStudentId(studentId: string): Promise<IEnrollment[]> {
        return enrollmentRepo.findMany({ studentId: new Types.ObjectId(studentId) });
    }

    async getAll(limit: number = 50, skip: number = 0, program?: string, classId?: string): Promise<IEnrollment[]> {
        const query: any = {};
        if (program) {
            const students = await Student.find({ program }).select('_id');
            query.studentId = { $in: students.map(s => s._id) };
        }
        if (classId) {
            query.academicClassId = new Types.ObjectId(classId);
        }
        return Enrollment.find(query).populate('studentId').populate({ path: 'academicClassId', populate: { path: 'templateId' } }).sort({ createdAt: -1 }).skip(skip).limit(limit) as unknown as Promise<IEnrollment[]>;
    }

    async completeEnrollment(enrollmentId: string, updatedBy: string, ipAddress: string): Promise<void> {
        await enrollmentRepo.updateStatus(enrollmentId, 'COMPLETED');
        auditService.logAsync({
            actorId: updatedBy,
            action: 'ENROLLMENT_STATUS_CHANGED',
            entityType: 'ENROLLMENT',
            entityId: enrollmentId,
            before: { status: 'ONGOING' },
            after: { status: 'COMPLETED' },
            ipAddress,
        });
    }

    async countTotal(): Promise<number> {
        return Enrollment.countDocuments();
    }

    /**
     * ──────────────────────────────────────────────────────────────────────────
     * COURSE TRANSFER
     * ──────────────────────────────────────────────────────────────────────────
     * Transfers a student from one course (enrollment) to another.
     *
     * 1. Validates the source enrollment is ONGOING
     * 2. Validates the target class is active & student not already enrolled
     * 3. Inside a single transaction:
     *    a. Marks source enrollment CANCELLED
     *    b. Creates new enrollment in target class
     *    c. If student already paid anything, creates an ADJUSTMENT CREDIT
     *       on the new enrollment for the paid amount carried over
     * 4. Writes audit log
     */
    async transferEnrollment(params: {
        sourceEnrollmentId: string;
        targetClassId: string;
        transferredBy: string;
        reason?: string;
        /** If omitted, source enrollment's concession is carried over automatically */
        concessionType?: 'NONE' | 'PERCENTAGE' | 'FLAT';
        concessionValue?: number;
        ipAddress: string;
        userAgent: string;
    }): Promise<{ oldEnrollment: IEnrollment; newEnrollment: IEnrollment; amountCarriedOver: number; concessionAmount: number }> {
        // ── Fetch source enrollment ──────────────────────────────────────────
        const sourceEnrollment = await enrollmentRepo.findById(params.sourceEnrollmentId);
        if (!sourceEnrollment) throw new Error('Source enrollment not found');
        if (sourceEnrollment.status !== 'ONGOING') {
            throw new Error(`Cannot transfer: source enrollment status is ${sourceEnrollment.status}`);
        }

        // ── Fetch target class ───────────────────────────────────────────────
        const targetClass = await AcademicClass.findById(params.targetClassId);
        if (!targetClass) throw new Error('Target class not found');
        if (!targetClass.isActive) throw new Error('Target class is not active');

        // ── Check student not already in target class ────────────────────────
        const existing = await Enrollment.findOne({
            studentId: sourceEnrollment.studentId,
            academicClassId: new Types.ObjectId(params.targetClassId),
            status: 'ONGOING',
        });
        if (existing) throw new Error('Student is already enrolled in the target class');

        // ── Resolve concession to apply on new enrollment ────────────────────
        // If caller didn't explicitly pass concessionType, default to source's concession
        const resolvedConcessionType = params.concessionType !== undefined
            ? params.concessionType
            : sourceEnrollment.concessionType;
        const resolvedConcessionValue = params.concessionValue !== undefined
            ? params.concessionValue
            : sourceEnrollment.concessionValue;

        // Compute concession amount against the NEW class fee
        let concessionAmount = 0;
        if (resolvedConcessionType === 'PERCENTAGE') {
            if (resolvedConcessionValue < 0 || resolvedConcessionValue > 100) throw new Error('Percentage concession must be 0–100');
            concessionAmount = Math.round((targetClass.totalFee * resolvedConcessionValue) / 100 * 100) / 100;
        } else if (resolvedConcessionType === 'FLAT') {
            if (resolvedConcessionValue > targetClass.totalFee) throw new Error('Flat concession cannot exceed class fee');
            concessionAmount = resolvedConcessionValue;
        }
        const newNetFee = targetClass.totalFee - concessionAmount;

        // ── Compute CASH paid so far on source enrollment ────────────────────
        // getBalance = totalFee + (debits - credits)   [all ledger entries]
        // netFee - balance eliminates concession credits => gives pure cash paid
        const ledgerSvc = new LedgerService();
        const sourceBalance = await ledgerSvc.getBalance(params.sourceEnrollmentId);
        const cashPaid = sourceEnrollment.netFee - sourceBalance;
        const amountCarriedOver = Math.max(0, cashPaid);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // a. Cancel source enrollment
            await Enrollment.findByIdAndUpdate(
                params.sourceEnrollmentId,
                { $set: { status: 'CANCELLED' } },
                { session }
            );

            // b. Create new enrollment in target class (with resolved concession)
            const newEnrollment = await enrollmentRepo.create(
                {
                    studentId: sourceEnrollment.studentId,
                    academicClassId: new Types.ObjectId(params.targetClassId),
                    academicYear: targetClass.academicYear,
                    totalFee: targetClass.totalFee,
                    concessionType: resolvedConcessionType as any,
                    concessionValue: resolvedConcessionValue,
                    netFee: newNetFee,
                    status: 'ONGOING',
                    createdBy: new Types.ObjectId(params.transferredBy),
                },
                session
            );

            // c. If concession exists, write a CONCESSION ledger credit
            if (concessionAmount > 0) {
                await ledgerSvc.recordCredit({
                    enrollmentId: newEnrollment._id,
                    amount: concessionAmount,
                    referenceType: 'CONCESSION',
                    referenceId: newEnrollment._id,
                    description: `Concession transferred from enrollment ${params.sourceEnrollmentId}: ${resolvedConcessionType} of ${resolvedConcessionValue}${resolvedConcessionType === 'PERCENTAGE' ? '%' : '₹'}`,
                    createdBy: params.transferredBy,
                    session,
                });
            }

            // d. Carry over cash already paid as ADJUSTMENT credit
            if (amountCarriedOver > 0) {
                await ledgerSvc.recordCredit({
                    enrollmentId: newEnrollment._id,
                    amount: amountCarriedOver,
                    referenceType: 'ADJUSTMENT',
                    referenceId: sourceEnrollment._id,
                    description: `Cash payment transferred from enrollment ${params.sourceEnrollmentId}${params.reason ? `. Reason: ${params.reason}` : ''}`,
                    createdBy: params.transferredBy,
                    session,
                });
            }

            await session.commitTransaction();

            // Fetch updated source enrollment for response
            const updatedSource = (await enrollmentRepo.findById(params.sourceEnrollmentId))!;

            auditService.logAsync({
                actorId: params.transferredBy,
                action: 'ENROLLMENT_TRANSFERRED',
                entityType: 'ENROLLMENT',
                entityId: params.sourceEnrollmentId,
                before: {
                    enrollmentId: params.sourceEnrollmentId,
                    classId: sourceEnrollment.academicClassId.toString(),
                    concessionType: sourceEnrollment.concessionType,
                    concessionValue: sourceEnrollment.concessionValue,
                    status: 'ONGOING',
                },
                after: {
                    newEnrollmentId: newEnrollment._id.toString(),
                    newClassId: params.targetClassId,
                    concessionType: resolvedConcessionType,
                    concessionValue: resolvedConcessionValue,
                    concessionAmount,
                    amountCarriedOver,
                    reason: params.reason,
                },
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            });

            return { oldEnrollment: updatedSource, newEnrollment, amountCarriedOver, concessionAmount };
        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    }

}

export const enrollmentService = new EnrollmentService();
