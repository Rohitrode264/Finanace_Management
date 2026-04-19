"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentController = exports.PaymentController = void 0;
const payment_service_1 = require("../services/payment.service");
const audit_service_1 = require("../services/audit.service");
const apiResponse_1 = require("../utils/apiResponse");
const zod_1 = require("zod");
const payment_repository_1 = require("../repositories/payment.repository");
const paymentRepo = new payment_repository_1.PaymentRepository();
const createPaymentSchema = zod_1.z.object({
    enrollmentId: zod_1.z.string().length(24, 'Invalid enrollmentId'),
    amount: zod_1.z.number().positive('Amount must be positive'),
    paymentMode: zod_1.z.enum(['CASH', 'UPI', 'CARD', 'CHEQUE', 'BANK_TRANSFER']),
    transactionRef: zod_1.z.string().optional(),
    fingerprintVerified: zod_1.z.boolean().optional(),
});
const cancelPaymentSchema = zod_1.z.object({
    reason: zod_1.z.string().min(10, 'Cancellation reason must be at least 10 characters'),
});
class PaymentController {
    async createPayment(req, res) {
        const parsed = createPaymentSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, apiResponse_1.sendError)(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }
        try {
            const meta = audit_service_1.auditService.extractRequestMeta(req);
            const result = await payment_service_1.paymentService.processPayment({
                ...parsed.data,
                receivedBy: req.user.userId,
                ...meta,
            });
            (0, apiResponse_1.sendSuccess)(res, result, 201, `Payment processed. Receipt: ${result.receiptNumber}`);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Payment processing failed';
            (0, apiResponse_1.sendError)(res, message, 400, 'PAYMENT_FAILED');
        }
    }
    async getPayment(req, res) {
        try {
            const payment = await paymentRepo.findById(req.params['id']);
            if (!payment) {
                (0, apiResponse_1.sendError)(res, 'Payment not found', 404);
                return;
            }
            (0, apiResponse_1.sendSuccess)(res, payment);
        }
        catch {
            (0, apiResponse_1.sendError)(res, 'Failed to fetch payment', 500);
        }
    }
    async cancelPayment(req, res) {
        const parsed = cancelPaymentSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, apiResponse_1.sendError)(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }
        try {
            const meta = audit_service_1.auditService.extractRequestMeta(req);
            const result = await payment_service_1.paymentService.cancelPayment({
                paymentId: req.params['id'],
                cancelledBy: req.user.userId,
                reason: parsed.data.reason,
                ...meta,
            });
            (0, apiResponse_1.sendSuccess)(res, result, 200, result.message);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Cancellation failed';
            (0, apiResponse_1.sendError)(res, message, 400, 'CANCEL_FAILED');
        }
    }
    async hardDeletePayment(req, res) {
        try {
            const meta = audit_service_1.auditService.extractRequestMeta(req);
            const result = await payment_service_1.paymentService.hardDeletePayment({
                paymentId: req.params['id'],
                adminId: req.user.userId,
                ...meta,
            });
            (0, apiResponse_1.sendSuccess)(res, result, 200, result.message);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Hard delete failed';
            (0, apiResponse_1.sendError)(res, message, 500, 'DELETE_FAILED');
        }
    }
}
exports.PaymentController = PaymentController;
exports.paymentController = new PaymentController();
//# sourceMappingURL=payment.controller.js.map