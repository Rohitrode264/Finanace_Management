"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollmentController = exports.EnrollmentController = void 0;
const enrollment_service_1 = require("../services/enrollment.service");
const concession_service_1 = require("../services/concession.service");
const ledger_service_1 = require("../services/ledger.service");
const audit_service_1 = require("../services/audit.service");
const apiResponse_1 = require("../utils/apiResponse");
const zod_1 = require("zod");
const createEnrollmentSchema = zod_1.z.object({
    studentId: zod_1.z.string().length(24),
    academicClassId: zod_1.z.string().length(24),
});
const concessionSchema = zod_1.z.object({
    concessionType: zod_1.z.enum(['PERCENTAGE', 'FLAT']),
    concessionValue: zod_1.z.number().positive(),
    reason: zod_1.z.string().min(10, 'Reason must be at least 10 characters'),
});
class EnrollmentController {
    async createEnrollment(req, res) {
        const parsed = createEnrollmentSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, apiResponse_1.sendError)(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }
        try {
            const meta = audit_service_1.auditService.extractRequestMeta(req);
            const enrollment = await enrollment_service_1.enrollmentService.createEnrollment({ ...parsed.data, createdBy: req.user.userId, ...meta });
            (0, apiResponse_1.sendSuccess)(res, enrollment, 201, 'Enrollment created');
        }
        catch (err) {
            (0, apiResponse_1.sendError)(res, err instanceof Error ? err.message : 'Failed to create enrollment', 400);
        }
    }
    async getEnrollment(req, res) {
        try {
            const enrollment = await enrollment_service_1.enrollmentService.findById(req.params['id']);
            if (!enrollment) {
                (0, apiResponse_1.sendError)(res, 'Enrollment not found', 404);
                return;
            }
            const balance = await ledger_service_1.ledgerService.getBalance(req.params['id']);
            (0, apiResponse_1.sendSuccess)(res, { ...enrollment, outstandingBalance: balance });
        }
        catch {
            (0, apiResponse_1.sendError)(res, 'Failed to fetch enrollment', 500);
        }
    }
    async getEnrollmentsByStudent(req, res) {
        try {
            const enrollments = await enrollment_service_1.enrollmentService.findByStudentId(req.params['studentId']);
            const withBalances = await Promise.all(enrollments.map(async (e) => {
                const balance = await ledger_service_1.ledgerService.getBalance(e._id.toString());
                return { ...e.toJSON(), outstandingBalance: balance };
            }));
            (0, apiResponse_1.sendSuccess)(res, withBalances);
        }
        catch (err) {
            (0, apiResponse_1.sendError)(res, 'Failed to fetch student enrollments', 500);
        }
    }
    async getAllEnrollments(req, res) {
        try {
            const { limit = '50', skip = '0', program, classId } = req.query;
            const enrollments = await enrollment_service_1.enrollmentService.getAll(parseInt(limit), parseInt(skip), program, classId);
            const withBalances = await Promise.all(enrollments.map(async (e) => {
                const balance = await ledger_service_1.ledgerService.getBalance(e._id.toString());
                return { ...e.toJSON(), outstandingBalance: balance };
            }));
            (0, apiResponse_1.sendSuccess)(res, withBalances);
        }
        catch (err) {
            (0, apiResponse_1.sendError)(res, 'Failed to fetch all enrollments', 500);
        }
    }
    async applyConcession(req, res) {
        const parsed = concessionSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, apiResponse_1.sendError)(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }
        try {
            const meta = audit_service_1.auditService.extractRequestMeta(req);
            const result = await concession_service_1.concessionService.applyConcession({
                enrollmentId: req.params['id'],
                ...parsed.data,
                approvedBy: req.user.userId,
                ...meta,
            });
            (0, apiResponse_1.sendSuccess)(res, result, 200, `Concession of ₹${result.concessionAmount} applied`);
        }
        catch (err) {
            (0, apiResponse_1.sendError)(res, err instanceof Error ? err.message : 'Failed to apply concession', 400);
        }
    }
    async getEnrollmentLedger(req, res) {
        try {
            const ledger = await ledger_service_1.ledgerService.getLedger(req.params['id']);
            const balance = await ledger_service_1.ledgerService.getBalance(req.params['id']);
            (0, apiResponse_1.sendSuccess)(res, { ledger, outstandingBalance: balance });
        }
        catch {
            (0, apiResponse_1.sendError)(res, 'Failed to fetch ledger', 500);
        }
    }
}
exports.EnrollmentController = EnrollmentController;
exports.enrollmentController = new EnrollmentController();
//# sourceMappingURL=enrollment.controller.js.map