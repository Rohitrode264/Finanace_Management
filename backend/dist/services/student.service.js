"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentService = exports.StudentService = void 0;
const Student_model_1 = require("../models/Student.model");
const audit_service_1 = require("./audit.service");
const mongoose_1 = require("mongoose");
class StudentService {
    async createStudent(params) {
        const existing = await Student_model_1.Student.findOne({ admissionNumber: params.admissionNumber.toUpperCase() });
        if (existing)
            throw new Error(`Admission number ${params.admissionNumber} already exists`);
        const student = await Student_model_1.Student.create({
            admissionNumber: params.admissionNumber.toUpperCase().trim(),
            firstName: params.firstName.trim(),
            lastName: params.lastName.trim(),
            phone: params.phone.trim(),
            fatherName: params.fatherName.trim(),
            motherName: params.motherName.trim(),
            schoolName: params.schoolName?.trim(),
            program: params.program?.trim(),
            email: params.email?.trim(),
            bloodGroup: params.bloodGroup?.trim(),
            address: params.address,
            status: 'ACTIVE',
            createdBy: new mongoose_1.Types.ObjectId(params.createdBy),
        });
        audit_service_1.auditService.logAsync({
            actorId: params.createdBy,
            action: 'STUDENT_CREATED',
            entityType: 'STUDENT',
            entityId: student._id.toString(),
            before: null,
            after: { admissionNumber: student.admissionNumber, name: `${student.firstName} ${student.lastName}` },
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
        });
        return student;
    }
    async countTotal() {
        return Student_model_1.Student.countDocuments();
    }
    async generateAdmissionNumber() {
        const year = new Date().getFullYear();
        const prefix = `ADM-${year}-`;
        const lastStudent = await Student_model_1.Student.findOne({ admissionNumber: new RegExp(`^${prefix}`) })
            .sort({ admissionNumber: -1 });
        if (!lastStudent || !lastStudent.admissionNumber) {
            return `${prefix}0001`;
        }
        const lastSequence = parseInt(lastStudent.admissionNumber.replace(prefix, ''), 10);
        const nextSequence = isNaN(lastSequence) ? 1 : lastSequence + 1;
        return `${prefix}${nextSequence.toString().padStart(4, '0')}`;
    }
    async updateStudentStatus(params) {
        const student = await Student_model_1.Student.findById(params.studentId);
        if (!student)
            throw new Error('Student not found');
        const before = { status: student.status };
        student.status = params.status;
        await student.save();
        audit_service_1.auditService.logAsync({
            actorId: params.updatedBy,
            action: 'STUDENT_UPDATED',
            entityType: 'STUDENT',
            entityId: params.studentId,
            before,
            after: { status: params.status },
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
        });
        return student;
    }
    async findById(id) {
        return Student_model_1.Student.findById(id);
    }
    async search(query, limit = 20, program) {
        if (query.trim().length < 2)
            return [];
        const filter = { $text: { $search: query } };
        if (program)
            filter.program = program;
        return Student_model_1.Student.find(filter, { score: { $meta: 'textScore' } })
            .sort({ score: { $meta: 'textScore' } })
            .limit(limit);
    }
    async listAll(status, program, limit = 50, skip = 0) {
        const filter = {};
        if (status)
            filter.status = status;
        if (program)
            filter.program = program;
        return Student_model_1.Student.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
    }
}
exports.StudentService = StudentService;
exports.studentService = new StudentService();
//# sourceMappingURL=student.service.js.map