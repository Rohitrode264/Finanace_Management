"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentService = exports.StudentService = void 0;
const Student_model_1 = require("../models/Student.model");
const audit_service_1 = require("./audit.service");
const mongoose_1 = require("mongoose");
class StudentService {
    async createStudent(params) {
        let admissionNumber = params.admissionNumber?.trim().toUpperCase();
        // If no admission number provided, generate one automatically
        if (!admissionNumber) {
            admissionNumber = await this.generateAdmissionNumber();
        }
        const existing = await Student_model_1.Student.findOne({ admissionNumber });
        if (existing)
            throw new Error(`Admission number ${admissionNumber} already exists`);
        const student = await Student_model_1.Student.create({
            admissionNumber,
            firstName: params.firstName.trim(),
            lastName: params.lastName.trim(),
            phone: params.phone.trim(),
            dob: params.dob?.trim(),
            alternatePhone: params.alternatePhone?.trim(),
            motherPhone: params.motherPhone?.trim(),
            fatherName: params.fatherName.trim(),
            motherName: params.motherName?.trim(),
            schoolName: params.schoolName?.trim(),
            program: params.program?.trim(),
            email: params.email?.trim(),
            bloodGroup: params.bloodGroup?.trim(),
            address: params.address,
            history: params.history,
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
        const prefix = `CP${year}`;
        // Find the student with the highest admission number for the current year
        const lastStudent = await Student_model_1.Student.findOne({ admissionNumber: new RegExp(`^${prefix}`) })
            .sort({ admissionNumber: -1 });
        if (!lastStudent || !lastStudent.admissionNumber) {
            // First student of the year starts from a base + jump
            return `${prefix}1117`;
        }
        // Extract the numeric part (everything after CPXXXX)
        const lastPart = lastStudent.admissionNumber.replace(prefix, '');
        const lastVal = parseInt(lastPart, 10);
        // Increment sequentially from the base value
        const nextVal = isNaN(lastVal) ? 1117 : lastVal + 7;
        return `${prefix}${nextVal}`;
    }
    async updateStudent(params) {
        const student = await Student_model_1.Student.findById(params.studentId);
        if (!student)
            throw new Error('Student not found');
        const before = student.toObject();
        const updates = Object.fromEntries(Object.entries(params.data).filter(([_, v]) => v != null));
        Object.assign(student, updates);
        await student.save();
        audit_service_1.auditService.logAsync({
            actorId: params.updatedBy,
            action: 'STUDENT_UPDATED',
            entityType: 'STUDENT',
            entityId: params.studentId,
            before,
            after: updates,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
        });
        return student;
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
        return Student_model_1.Student.findById(id).populate('createdBy', 'name');
    }
    async search(query, limit = 20, skip = 0, program) {
        if (!query || query.trim().length === 0)
            return { students: [], total: 0 };
        const searchRegex = new RegExp(query.trim(), 'i');
        const searchFilter = {
            $or: [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { admissionNumber: searchRegex }
            ]
        };
        const filter = { ...searchFilter };
        if (program)
            filter.program = program;
        const [students, total] = await Promise.all([
            Student_model_1.Student.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            Student_model_1.Student.countDocuments(filter).exec()
        ]);
        return { students, total };
    }
    async listAll(status, program, limit = 50, skip = 0) {
        const filter = {};
        if (status)
            filter.status = status;
        if (program)
            filter.program = program;
        const [students, total] = await Promise.all([
            Student_model_1.Student.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            Student_model_1.Student.countDocuments(filter).exec()
        ]);
        return { students, total };
    }
    async getUniqueSchools() {
        const schools = await Student_model_1.Student.distinct('schoolName', { schoolName: { $ne: '', $exists: true } });
        return schools.filter((s) => !!s).sort();
    }
    async getUniqueCities() {
        const cities = await Student_model_1.Student.distinct('address.city', { 'address.city': { $ne: '', $exists: true } });
        return cities.filter((s) => !!s).sort();
    }
    async getUniqueStates() {
        const states = await Student_model_1.Student.distinct('address.state', { 'address.state': { $ne: '', $exists: true } });
        return states.filter((s) => !!s).sort();
    }
}
exports.StudentService = StudentService;
exports.studentService = new StudentService();
//# sourceMappingURL=student.service.js.map