import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { auditService } from '../services/audit.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { z } from 'zod';
import { PaymentRepository } from '../repositories/payment.repository';

const paymentRepo = new PaymentRepository();

const createPaymentSchema = z.object({
    enrollmentId: z.string().length(24, 'Invalid enrollmentId'),
    amount: z.number().positive('Amount must be positive'),
    paymentMode: z.enum(['CASH', 'UPI', 'CARD', 'CHEQUE', 'BANK_TRANSFER']),
    transactionRef: z.string().optional(),
    fingerprintVerified: z.boolean().optional(),
});

const cancelPaymentSchema = z.object({
    reason: z.string().min(10, 'Cancellation reason must be at least 10 characters'),
});

export class PaymentController {
    async createPayment(req: Request, res: Response): Promise<void> {
        const parsed = createPaymentSchema.safeParse(req.body);
        if (!parsed.success) {
            sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }

        try {
            const meta = auditService.extractRequestMeta(req);
            const result = await paymentService.processPayment({
                ...parsed.data,
                receivedBy: req.user!.userId,
                ...meta,
            });

            sendSuccess(res, result, 201, `Payment processed. Receipt: ${result.receiptNumber}`);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Payment processing failed';
            sendError(res, message, 400, 'PAYMENT_FAILED');
        }
    }

    async getPayment(req: Request, res: Response): Promise<void> {
        try {
            const payment = await paymentRepo.findById(req.params['id']!);
            if (!payment) {
                sendError(res, 'Payment not found', 404);
                return;
            }
            sendSuccess(res, payment);
        } catch {
            sendError(res, 'Failed to fetch payment', 500);
        }
    }

    async cancelPayment(req: Request, res: Response): Promise<void> {
        const parsed = cancelPaymentSchema.safeParse(req.body);
        if (!parsed.success) {
            sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }

        try {
            const meta = auditService.extractRequestMeta(req);
            const result = await paymentService.cancelPayment({
                paymentId: req.params['id']!,
                cancelledBy: req.user!.userId,
                reason: parsed.data.reason,
                ...meta,
            });

            sendSuccess(res, result, 200, result.message);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Cancellation failed';
            sendError(res, message, 400, 'CANCEL_FAILED');
        }
    }

    async hardDeletePayment(req: Request, res: Response): Promise<void> {
        try {
            const meta = auditService.extractRequestMeta(req);
            const result = await paymentService.hardDeletePayment({
                paymentId: req.params['id']!,
                adminId: req.user!.userId,
                ...meta,
            });

            sendSuccess(res, result, 200, result.message);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Hard delete failed';
            sendError(res, message, 500, 'DELETE_FAILED');
        }
    }
}

export const paymentController = new PaymentController();
