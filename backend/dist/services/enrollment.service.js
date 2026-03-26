"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollmentService = exports.EnrollmentService = void 0;
const enrollment_repository_1 = require("../repositories/enrollment.repository");
const AcademicClass_model_1 = require("../models/AcademicClass.model");
const Student_model_1 = require("../models/Student.model");
const audit_service_1 = require("./audit.service");
const mongoose_1 = require("mongoose");
const Enrollment_model_1 = require("../models/Enrollment.model");
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
}
exports.EnrollmentService = EnrollmentService;
exports.enrollmentService = new EnrollmentService();
//# sourceMappingURL=enrollment.service.js.map