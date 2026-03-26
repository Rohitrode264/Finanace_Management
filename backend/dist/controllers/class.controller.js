"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classController = exports.ClassController = void 0;
const class_service_1 = require("../services/class.service");
const audit_service_1 = require("../services/audit.service");
const apiResponse_1 = require("../utils/apiResponse");
const zod_1 = require("zod");
const createTemplateSchema = zod_1.z.object({
    grade: zod_1.z.string().min(1).max(10),
    stream: zod_1.z.string().max(20).nullable().optional(),
    board: zod_1.z.enum(['CBSE', 'ICSE', 'STATE', 'IB', 'OTHER']),
});
const installmentSchema = zod_1.z.object({
    installmentNo: zod_1.z.number().int().positive(),
    dueDate: zod_1.z.string().transform((s) => new Date(s)),
    amount: zod_1.z.number().positive(),
});
const createClassSchema = zod_1.z.object({
    templateId: zod_1.z.string().length(24),
    academicYear: zod_1.z.string().regex(/^\d{4}-\d{2,4}$/, 'Format: YYYY-YY or YYYY-YYYY'),
    section: zod_1.z.string().min(1).max(5),
    totalFee: zod_1.z.number().positive(),
    installmentPlan: zod_1.z.array(installmentSchema).min(1),
});
class ClassController {
    async listTemplates(_req, res) {
        try {
            const templates = await class_service_1.classService.listTemplates();
            (0, apiResponse_1.sendSuccess)(res, templates);
        }
        catch {
            (0, apiResponse_1.sendError)(res, 'Failed to fetch templates', 500);
        }
    }
    async createTemplate(req, res) {
        const parsed = createTemplateSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, apiResponse_1.sendError)(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }
        try {
            const template = await class_service_1.classService.createTemplate({ ...parsed.data, createdBy: req.user.userId });
            (0, apiResponse_1.sendSuccess)(res, template, 201);
        }
        catch (err) {
            (0, apiResponse_1.sendError)(res, err instanceof Error ? err.message : 'Failed', 400);
        }
    }
    async createClass(req, res) {
        const parsed = createClassSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, apiResponse_1.sendError)(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }
        try {
            const meta = audit_service_1.auditService.extractRequestMeta(req);
            const cls = await class_service_1.classService.createAcademicClass({ ...parsed.data, createdBy: req.user.userId, ...meta });
            (0, apiResponse_1.sendSuccess)(res, cls, 201);
        }
        catch (err) {
            (0, apiResponse_1.sendError)(res, err instanceof Error ? err.message : 'Failed', 400);
        }
    }
    async getClassesByYear(req, res) {
        const { year } = req.query;
        if (!year) {
            (0, apiResponse_1.sendError)(res, 'academicYear query param required', 400);
            return;
        }
        try {
            const classes = await class_service_1.classService.findClassesByYear(year);
            (0, apiResponse_1.sendSuccess)(res, classes);
        }
        catch {
            (0, apiResponse_1.sendError)(res, 'Failed to fetch classes', 500);
        }
    }
    async getClass(req, res) {
        try {
            const cls = await class_service_1.classService.findById(req.params['id']);
            if (!cls) {
                (0, apiResponse_1.sendError)(res, 'Class not found', 404);
                return;
            }
            (0, apiResponse_1.sendSuccess)(res, cls);
        }
        catch {
            (0, apiResponse_1.sendError)(res, 'Failed to fetch class', 500);
        }
    }
}
exports.ClassController = ClassController;
exports.classController = new ClassController();
//# sourceMappingURL=class.controller.js.map