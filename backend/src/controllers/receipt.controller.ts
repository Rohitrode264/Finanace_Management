import { Request, Response } from 'express';
import { reportService } from '../services/report.service';
import { auditService } from '../services/audit.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { z } from 'zod';

const authorizePrintSchema = z.object({
    receiptId: z.string().length(24),
    fingerprintToken: z.string().min(8),
});

export class ReceiptController {
    async getReceipt(req: Request, res: Response): Promise<void> {
        try {
            const { ReceiptRepository } = await import('../repositories/receipt.repository');
            const { ledgerService } = await import('../services/ledger.service');
            const repo = new ReceiptRepository();
            const receipt = await repo.findById(req.params['id']!);
            if (!receipt) { sendError(res, 'Receipt not found', 404); return; }

            // Attach balance to enrollment
            const enrollment = receipt.enrollmentId as any;
            if (enrollment && enrollment._id) {
                enrollment.outstandingBalance = await ledgerService.getBalance(enrollment._id);
            }

            sendSuccess(res, receipt);
        } catch (err) { sendError(res, 'Failed to fetch receipt', 500); }
    }

    async getByPayment(req: Request, res: Response): Promise<void> {
        try {
            const { ReceiptRepository } = await import('../repositories/receipt.repository');
            const { ledgerService } = await import('../services/ledger.service');
            const repo = new ReceiptRepository();
            const receipt = await repo.findByPaymentId(req.params['paymentId']!);
            if (!receipt) { sendError(res, 'Receipt not found for this payment', 404); return; }

            // Attach balance
            const enrollment = receipt.enrollmentId as any;
            if (enrollment && enrollment._id) {
                enrollment.outstandingBalance = await ledgerService.getBalance(enrollment._id);
            }

            sendSuccess(res, receipt);
        } catch { sendError(res, 'Failed to fetch receipt by payment', 500); }
    }

    async authorizePrint(req: Request, res: Response): Promise<void> {
        const parsed = authorizePrintSchema.safeParse(req.body);
        if (!parsed.success) { sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format()); return; }
        try {
            const meta = auditService.extractRequestMeta(req);
            const result = await reportService.authorizeReceiptPrint({
                ...parsed.data,
                authorizedBy: req.user!.userId,
                ...meta,
            });
            sendSuccess(res, result, 200, 'Receipt print authorized');
        } catch (err) {
            sendError(res, err instanceof Error ? err.message : 'Authorization failed', 403, 'FINGERPRINT_FAILED');
        }
    }
}

export const receiptController = new ReceiptController();
