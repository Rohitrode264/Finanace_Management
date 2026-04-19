"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollmentService = exports.EnrollmentService = void 0;
const enrollment_repository_1 = require("../repositories/enrollment.repository");
const AcademicClass_model_1 = require("../models/AcademicClass.model");
const Student_model_1 = require("../models/Student.model");
const audit_service_1 = require("./audit.service");
const mongoose_1 = require("mongoose");
const Enrollment_model_1 = require("../models/Enrollment.model");
const ledger_service_1 = require("./ledger.service");
const mongoose_2 = __importDefault(require("mongoose"));
const enrollmentRepo = new enrollment_repository_1.EnrollmentRepository();
class EnrollmentService {
    async createEnrollment(params) {
        // Validate student exists and is ACTIVE
        const student = await Student_model_1.Student.findById(params.studentId);
        if (!student)
            throw new Error('Student not found');
        if (student.status !== 'ACTIVE')
            throw new Error('Only ACTIVE students can be enrolled');
        // Validate academic class exists and is active
        const academicClass = await AcademicClass_model_1.AcademicClass.findById(params.academicClassId);
        if (!academicClass)
            throw new Error('AcademicClass not found');
        if (!academicClass.isActive)
            throw new Error('Cannot enroll in an inactive class');
        // Check for duplicate enrollment
        const existing = await enrollmentRepo.findByStudentAndYear(params.studentId, academicClass.academicYear);
        if (existing) {
            throw new Error(`Student is already enrolled for academic year ${academicClass.academicYear}`);
        }
        // Create enrollment — totalFee is snapshot from class (immutable)
        const enrollment = await enrollmentRepo.create({
            studentId: new mongoose_1.Types.ObjectId(params.studentId),
            academicClassId: new mongoose_1.Types.ObjectId(params.academicClassId),
            academicYear: academicClass.academicYear,
            totalFee: academicClass.totalFee,
            concessionType: 'NONE',
            concessionValue: 0,
            netFee: academicClass.totalFee,
            status: 'ONGOING',
            createdBy: new mongoose_1.Types.ObjectId(params.createdBy),
        });
        audit_service_1.auditService.logAsync({
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
    async findById(id) {
        return enrollmentRepo.findById(id);
    }
    async findByStudentAndYear(studentId, academicYear) {
        return enrollmentRepo.findByStudentAndYear(studentId, academicYear);
    }
    async findByStudentId(studentId) {
        return enrollmentRepo.findMany({ studentId: new mongoose_1.Types.ObjectId(studentId) });
    }
    async getAll(limit = 50, skip = 0, program, classId) {
        const query = {};
        if (program) {
            const students = await Student_model_1.Student.find({ program }).select('_id');
            query.studentId = { $in: students.map(s => s._id) };
        }
        if (classId) {
            query.academicClassId = new mongoose_1.Types.ObjectId(classId);
        }
        return Enrollment_model_1.Enrollment.find(query).populate('studentId').populate({ path: 'academicClassId', populate: { path: 'templateId' } }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    }
    async completeEnrollment(enrollmentId, updatedBy, ipAddress) {
        await enrollmentRepo.updateStatus(enrollmentId, 'COMPLETED');
        audit_service_1.auditService.logAsync({
            actorId: updatedBy,
            action: 'ENROLLMENT_STATUS_CHANGED',
            entityType: 'ENROLLMENT',
            entityId: enrollmentId,
            before: { status: 'ONGOING' },
            after: { status: 'COMPLETED' },
            ipAddress,
        });
    }
    async countTotal() {
        return Enrollment_model_1.Enrollment.countDocuments();
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
    async transferEnrollment(params) {
        // ── Fetch source enrollment ──────────────────────────────────────────
        const sourceEnrollment = await enrollmentRepo.findById(params.sourceEnrollmentId);
        if (!sourceEnrollment)
            throw new Error('Source enrollment not found');
        if (sourceEnrollment.status !== 'ONGOING') {
            throw new Error(`Cannot transfer: source enrollment status is ${sourceEnrollment.status}`);
        }
        // ── Fetch target class ───────────────────────────────────────────────
        const targetClass = await AcademicClass_model_1.AcademicClass.findById(params.targetClassId);
        if (!targetClass)
            throw new Error('Target class not found');
        if (!targetClass.isActive)
            throw new Error('Target class is not active');
        // ── Check student not already in target class ────────────────────────
        const existing = await Enrollment_model_1.Enrollment.findOne({
            studentId: sourceEnrollment.studentId,
            academicClassId: new mongoose_1.Types.ObjectId(params.targetClassId),
            status: 'ONGOING',
        });
        if (existing)
            throw new Error('Student is already enrolled in the target class');
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
            if (resolvedConcessionValue < 0 || resolvedConcessionValue > 100)
                throw new Error('Percentage concession must be 0–100');
            concessionAmount = Math.round((targetClass.totalFee * resolvedConcessionValue) / 100 * 100) / 100;
        }
        else if (resolvedConcessionType === 'FLAT') {
            if (resolvedConcessionValue > targetClass.totalFee)
                throw new Error('Flat concession cannot exceed class fee');
            concessionAmount = resolvedConcessionValue;
        }
        const newNetFee = targetClass.totalFee - concessionAmount;
        // ── Compute CASH paid so far on source enrollment ────────────────────
        // getBalance = totalFee + (debits - credits)   [all ledger entries]
        // netFee - balance eliminates concession credits => gives pure cash paid
        const ledgerSvc = new ledger_service_1.LedgerService();
        const sourceBalance = await ledgerSvc.getBalance(params.sourceEnrollmentId);
        const cashPaid = sourceEnrollment.netFee - sourceBalance;
        const amountCarriedOver = Math.max(0, cashPaid);
        const session = await mongoose_2.default.startSession();
        session.startTransaction();
        try {
            // a. Cancel source enrollment
            await Enrollment_model_1.Enrollment.findByIdAndUpdate(params.sourceEnrollmentId, { $set: { status: 'CANCELLED' } }, { session });
            // b. Create new enrollment in target class (with resolved concession)
            const newEnrollment = await enrollmentRepo.create({
                studentId: sourceEnrollment.studentId,
                academicClassId: new mongoose_1.Types.ObjectId(params.targetClassId),
                academicYear: targetClass.academicYear,
                totalFee: targetClass.totalFee,
                concessionType: resolvedConcessionType,
                concessionValue: resolvedConcessionValue,
                netFee: newNetFee,
                status: 'ONGOING',
                createdBy: new mongoose_1.Types.ObjectId(params.transferredBy),
            }, session);
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
            const updatedSource = (await enrollmentRepo.findById(params.sourceEnrollmentId));
            audit_service_1.auditService.logAsync({
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
        }
        catch (err) {
            await session.abortTransaction();
            throw err;
        }
        finally {
            session.endSession();
        }
    }
}
exports.EnrollmentService = EnrollmentService;
exports.enrollmentService = new EnrollmentService();
//# sourceMappingURL=enrollment.service.js.map