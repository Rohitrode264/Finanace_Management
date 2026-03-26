"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentController = exports.StudentController = void 0;
const student_service_1 = require("../services/student.service");
const audit_service_1 = require("../services/audit.service");
const apiResponse_1 = require("../utils/apiResponse");
const zod_1 = require("zod");
const createStudentSchema = zod_1.z.object({
    admissionNumber: zod_1.z.string().min(3).max(20),
    firstName: zod_1.z.string().min(1).max(100),
    lastName: zod_1.z.string().min(1).max(100),
    phone: zod_1.z.string().regex(/^[0-9]{10}$/, '10-digit phone required'),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    fatherName: zod_1.z.string().min(1).max(100),
    motherName: zod_1.z.string().min(1).max(100),
    schoolName: zod_1.z.string().max(200).optional().or(zod_1.z.literal('')),
    program: zod_1.z.string().max(100).optional().or(zod_1.z.literal('')),
    bloodGroup: zod_1.z.string().optional().or(zod_1.z.literal('')),
    address: zod_1.z.object({
        street: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        state: zod_1.z.string().optional(),
        zipCode: zod_1.z.string().optional(),
    }).optional(),
});
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['ACTIVE', 'DROPPED', 'PASSED_OUT']),
});
class StudentController {
    async createStudent(req, res) {
        const parsed = createStudentSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, apiResponse_1.sendError)(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }
        try {
            const meta = audit_service_1.auditService.extractRequestMeta(req);
            const student = await student_service_1.studentService.createStudent({
                ...parsed.data,
                createdBy: req.user.userId,
                ...meta,
            });
            (0, apiResponse_1.sendSuccess)(res, student, 201, 'Student created successfully');
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create student';
            (0, apiResponse_1.sendError)(res, message, 400);
        }
    }
    async getStudent(req, res) {
        try {
            const student = await student_service_1.studentService.findById(req.params['id']);
            if (!student) {
                (0, apiResponse_1.sendError)(res, 'Student not found', 404);
                return;
            }
            (0, apiResponse_1.sendSuccess)(res, student);
        }
        catch {
            (0, apiResponse_1.sendError)(res, 'Failed to fetch student', 500);
        }
    }
    async generateAdmissionId(req, res) {
        try {
            const admissionId = await student_service_1.studentService.generateAdmissionNumber();
            (0, apiResponse_1.sendSuccess)(res, { admissionId }, 200, 'Generated successfully');
        }
        catch {
            (0, apiResponse_1.sendError)(res, 'Failed to generate admission ID', 500);
        }
    }
    async getCount(req, res) {
        try {
            const count = await student_service_1.studentService.countTotal();
            (0, apiResponse_1.sendSuccess)(res, { total: count });
        }
        catch {
            (0, apiResponse_1.sendError)(res, 'Failed to fetch total count', 500);
        }
    }
    async listStudents(req, res) {
        try {
            const { q, status, program, limit = '50', skip = '0' } = req.query;
            let students;
            if (q) {
                students = await student_service_1.studentService.search(q, parseInt(limit), program);
            }
            else {
                students = await student_service_1.studentService.listAll(status, program, parseInt(limit), parseInt(skip));
            }
            (0, apiResponse_1.sendSuccess)(res, students);
        }
        catch {
            (0, apiResponse_1.sendError)(res, 'Failed to list students', 500);
        }
    }
    async updateStatus(req, res) {
        const parsed = updateStatusSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, apiResponse_1.sendError)(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }
        try {
            const meta = audit_service_1.auditService.extractRequestMeta(req);
            const student = await student_service_1.studentService.updateStudentStatus({
                studentId: req.params['id'],
                status: parsed.data.status,
                updatedBy: req.user.userId,
                ...meta,
            });
            (0, apiResponse_1.sendSuccess)(res, student, 200, 'Status updated');
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update status';
            (0, apiResponse_1.sendError)(res, message, 400);
        }
    }
}
exports.StudentController = StudentController;
exports.studentController = new StudentController();
//# sourceMappingURL=student.controller.js.map