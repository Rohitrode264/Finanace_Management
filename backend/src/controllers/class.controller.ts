import { Request, Response } from 'express';
import { classService } from '../services/class.service';
import { auditService } from '../services/audit.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { z } from 'zod';

const createTemplateSchema = z.object({
    grade: z.string().min(1).max(10),
    stream: z.string().max(20).nullable().optional(),
    board: z.enum(['CBSE', 'ICSE', 'STATE', 'IB', 'OTHER']),
});

const installmentSchema = z.object({
    installmentNo: z.number().int().positive(),
    dueDate: z.string().transform((s) => new Date(s)),
    amount: z.number().positive(),
});

const createClassSchema = z.object({
    templateId: z.string().length(24),
    academicYear: z.string().regex(/^\d{4}-\d{2,4}$/, 'Format: YYYY-YY or YYYY-YYYY'),
    section: z.string().min(1).max(5),
    totalFee: z.number().positive(),
    installmentPlan: z.array(installmentSchema).min(1),
});

export class ClassController {
    async listTemplates(_req: Request, res: Response): Promise<void> {
        try {
            const templates = await classService.listTemplates();
            sendSuccess(res, templates);
        } catch { sendError(res, 'Failed to fetch templates', 500); }
    }

    async createTemplate(req: Request, res: Response): Promise<void> {
        const parsed = createTemplateSchema.safeParse(req.body);
        if (!parsed.success) { sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format()); return; }
        try {
            const template = await classService.createTemplate({ ...parsed.data, createdBy: req.user!.userId });
            sendSuccess(res, template, 201);
        } catch (err) {
            sendError(res, err instanceof Error ? err.message : 'Failed', 400);
        }
    }

    async createClass(req: Request, res: Response): Promise<void> {
        const parsed = createClassSchema.safeParse(req.body);
        if (!parsed.success) { sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format()); return; }
        try {
            const meta = auditService.extractRequestMeta(req);
            const cls = await classService.createAcademicClass({ ...parsed.data, createdBy: req.user!.userId, ...meta });
            sendSuccess(res, cls, 201);
        } catch (err) {
            sendError(res, err instanceof Error ? err.message : 'Failed', 400);
        }
    }

    async getClassesByYear(req: Request, res: Response): Promise<void> {
        const { year } = req.query as { year?: string };
        if (!year) { sendError(res, 'academicYear query param required', 400); return; }
        try {
            const classes = await classService.findClassesByYear(year);
            sendSuccess(res, classes);
        } catch { sendError(res, 'Failed to fetch classes', 500); }
    }

    async getClass(req: Request, res: Response): Promise<void> {
        try {
            const cls = await classService.findById(req.params['id']!);
            if (!cls) { sendError(res, 'Class not found', 404); return; }
            sendSuccess(res, cls);
        } catch { sendError(res, 'Failed to fetch class', 500); }
    }
}

export const classController = new ClassController();
