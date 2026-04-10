import { Request, Response } from 'express';
import { enrollmentService } from '../services/enrollment.service';
import { concessionService } from '../services/concession.service';
import { ledgerService } from '../services/ledger.service';
import { auditService } from '../services/audit.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { z } from 'zod';

const createEnrollmentSchema = z.object({
    studentId: z.string().length(24),
    academicClassId: z.string().length(24),
});

const concessionSchema = z.object({
    concessionType: z.enum(['PERCENTAGE', 'FLAT']),
    concessionValue: z.number().positive(),
    reason: z.string().optional().default('No reason provided'),
});

const transferSchema = z.object({
    targetClassId: z.string().length(24, 'Invalid targetClassId'),
    reason: z.string().optional(),
    concessionType: z.enum(['NONE', 'PERCENTAGE', 'FLAT']).optional(),
    concessionValue: z.number().min(0).optional(),
});

export class EnrollmentController {
    async createEnrollment(req: Request, res: Response): Promise<void> {
        const parsed = createEnrollmentSchema.safeParse(req.body);
        if (!parsed.success) { sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format()); return; }
        try {
            const meta = auditService.extractRequestMeta(req);
            const enrollment = await enrollmentService.createEnrollment({ ...parsed.data, createdBy: req.user!.userId, ...meta });
            sendSuccess(res, enrollment, 201, 'Enrollment created');
        } catch (err) {
            sendError(res, err instanceof Error ? err.message : 'Failed to create enrollment', 400);
        }
    }

    async getEnrollment(req: Request, res: Response): Promise<void> {
        try {
            const enrollment = await enrollmentService.findById(req.params['id']!);
            if (!enrollment) { sendError(res, 'Enrollment not found', 404); return; }
            const balance = await ledgerService.getBalance(req.params['id']!);
            sendSuccess(res, { ...enrollment, outstandingBalance: balance });
        } catch { sendError(res, 'Failed to fetch enrollment', 500); }
    }

    async getEnrollmentsByStudent(req: Request, res: Response): Promise<void> {
        try {
            const enrollments = await enrollmentService.findByStudentId(req.params['studentId']!);

            const withBalances = await Promise.all(enrollments.map(async (e) => {
                const balance = await ledgerService.getBalance(e._id.toString());
                return { ...e.toJSON(), outstandingBalance: balance };
            }));

            sendSuccess(res, withBalances);
        } catch (err) {
            sendError(res, 'Failed to fetch student enrollments', 500);
        }
    }

    async getAllEnrollments(req: Request, res: Response): Promise<void> {
        try {
            const { limit = '50', skip = '0', program, classId } = req.query as Record<string, string>;
            const enrollments = await enrollmentService.getAll(
                parseInt(limit),
                parseInt(skip),
                program,
                classId
            );

            const withBalances = await Promise.all(enrollments.map(async (e: any) => {
                const balance = await ledgerService.getBalance(e._id.toString());
                return { ...e.toJSON(), outstandingBalance: balance };
            }));

            sendSuccess(res, withBalances);
        } catch (err) {
            sendError(res, 'Failed to fetch all enrollments', 500);
        }
    }

    async applyConcession(req: Request, res: Response): Promise<void> {
        const parsed = concessionSchema.safeParse(req.body);
        if (!parsed.success) { sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format()); return; }
        try {
            const meta = auditService.extractRequestMeta(req);
            const result = await concessionService.applyConcession({
                enrollmentId: req.params['id']!,
                ...parsed.data,
                approvedBy: req.user!.userId,
                ...meta,
            });
            sendSuccess(res, result, 200, `Concession of ₹${result.concessionAmount} applied`);
        } catch (err) {
            sendError(res, err instanceof Error ? err.message : 'Failed to apply concession', 400);
        }
    }

    async getEnrollmentLedger(req: Request, res: Response): Promise<void> {
        try {
            const ledger = await ledgerService.getLedger(req.params['id']!);
            const balance = await ledgerService.getBalance(req.params['id']!);
            sendSuccess(res, { ledger, outstandingBalance: balance });
        } catch { sendError(res, 'Failed to fetch ledger', 500); }
    }

    async transferEnrollment(req: Request, res: Response): Promise<void> {
        const parsed = transferSchema.safeParse(req.body);
        if (!parsed.success) { sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format()); return; }
        try {
            const meta = auditService.extractRequestMeta(req);
            const result = await enrollmentService.transferEnrollment({
                sourceEnrollmentId: req.params['id']!,
                targetClassId: parsed.data.targetClassId,
                reason: parsed.data.reason,
                concessionType: parsed.data.concessionType,
                concessionValue: parsed.data.concessionValue,
                transferredBy: req.user!.userId,
                ...meta,
            });
            const parts: string[] = [];
            if (result.concessionAmount > 0) parts.push(`₹${result.concessionAmount.toLocaleString('en-IN')} concession applied`);
            if (result.amountCarriedOver > 0) parts.push(`₹${result.amountCarriedOver.toLocaleString('en-IN')} cash carried over`);
            sendSuccess(res, result, 200, `Transfer successful. ${parts.join(', ') || 'No previous payments to carry over'}.`);
        } catch (err) {
            sendError(res, err instanceof Error ? err.message : 'Transfer failed', 400, 'TRANSFER_FAILED');
        }
    }
}

export const enrollmentController = new EnrollmentController();
