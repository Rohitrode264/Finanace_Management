"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentService = exports.StudentService = void 0;
const Student_model_1 = require("../models/Student.model");
const Enrollment_model_1 = require("../models/Enrollment.model");
const Payment_model_1 = require("../models/Payment.model");
const audit_service_1 = require("./audit.service");
const mongoose_1 = __importStar(require("mongoose"));
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
            whatsappNumber: params.whatsappNumber?.trim(),
            cetBucket: params.cetBucket,
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
        student.set(updates);
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
        const terms = query.trim().split(/\s+/);
        const searchFilter = {
            $and: terms.map(term => ({
                $or: [
                    { firstName: new RegExp(term, 'i') },
                    { lastName: new RegExp(term, 'i') },
                    { admissionNumber: new RegExp(term, 'i') }
                ]
            }))
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
    async fullyDeleteStudentEverything(params) {
        const student = await Student_model_1.Student.findById(params.studentId);
        if (!student)
            throw new Error('Student not found');
        const enrollments = await Enrollment_model_1.Enrollment.find({ studentId: params.studentId });
        const enrollmentIds = enrollments.map((e) => e._id);
        const payments = await Payment_model_1.Payment.find({ enrollmentId: { $in: enrollmentIds } });
        const paymentIds = payments.map((p) => p._id);
        const db = mongoose_1.default.connection.db;
        if (!db)
            throw new Error('Database connection not established');
        // Delete receipts
        await db.collection('receipts').deleteMany({ paymentId: { $in: paymentIds } });
        // Delete payments
        await db.collection('payments').deleteMany({ enrollmentId: { $in: enrollmentIds } });
        // Delete ledger entries
        await db.collection('ledgerentries').deleteMany({ enrollmentId: { $in: enrollmentIds } });
        // Delete enrollments
        await Enrollment_model_1.Enrollment.deleteMany({ studentId: params.studentId });
        // Delete student
        await Student_model_1.Student.findByIdAndDelete(params.studentId);
        // Delete audit logs matching student _id
        await db.collection('auditlogs').deleteMany({
            $or: [
                { entityId: new mongoose_1.Types.ObjectId(params.studentId) },
                { entityId: params.studentId }
            ]
        });
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