import { EnrollmentRepository } from '../repositories/enrollment.repository';
import { AcademicClass } from '../models/AcademicClass.model';
import { Student } from '../models/Student.model';
import { auditService } from './audit.service';
import { Types } from 'mongoose';
import { Enrollment, IEnrollment } from '../models/Enrollment.model';

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
}

export const enrollmentService = new EnrollmentService();
