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
exports.paymentService = exports.PaymentService = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enrollment_repository_1 = require("../repositories/enrollment.repository");
const payment_repository_1 = require("../repositories/payment.repository");
const receipt_repository_1 = require("../repositories/receipt.repository");
const ledger_service_1 = require("./ledger.service");
const audit_service_1 = require("./audit.service");
const receiptNumber_1 = require("../utils/receiptNumber");
const ledger_repository_1 = require("../repositories/ledger.repository");
const AcademicClass_model_1 = require("../models/AcademicClass.model");
const enrollmentRepo = new enrollment_repository_1.EnrollmentRepository();
const paymentRepo = new payment_repository_1.PaymentRepository();
const receiptRepo = new receipt_repository_1.ReceiptRepository();
const ledgerRepo = new ledger_repository_1.LedgerRepository();
const ledgerSvc = new ledger_service_1.LedgerService();
class PaymentService {
    /**
     * ──────────────────────────────────────────────────────────────────────────
     * PAYMENT ENGINE — All 10 steps run inside a single MongoDB transaction.
     * If ANY step fails, the entire transaction is rolled back automatically.
     * ──────────────────────────────────────────────────────────────────────────
     *
     * Step 1: Start MongoDB session + transaction
     * Step 2: Validate enrollment exists and is ONGOING
     * Step 3: Validate payment amount is positive
     * Step 4: Fetch existing ledger to compute allocation (oldest installment first)
     * Step 5: Build installment allocation array
     * Step 6: Insert Payment document
     * Step 7: Insert LedgerEntry { type: CREDIT, referenceType: PAYMENT }
     * Step 8: Generate receipt number (atomic counter)
     * Step 9: Insert Receipt document
     * Step 10: Commit transaction → write audit log async → return result
     */
    async processPayment(input) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            // ── STEP 1: Already started above ──────────────────────────────────────
            // ── STEP 2: Validate enrollment ────────────────────────────────────────
            const enrollment = await enrollmentRepo.findById(input.enrollmentId, session);
            if (!enrollment) {
                throw new Error('Enrollment not found');
            }
            if (enrollment.status !== 'ONGOING') {
                throw new Error(`Payment rejected: Enrollment status is ${enrollment.status}`);
            }
            // ── STEP 3: Validate payment amount ────────────────────────────────────
            if (input.amount <= 0) {
                throw new Error('Payment amount must be greater than zero');
            }
            // ── STEP 4: Compute remaining per installment from ledger ───────────────
            // Fetch all existing CREDIT entries for this enrollment to understand
            // how much has already been paid per installment
            const existingPayments = await paymentRepo.findByEnrollment(enrollment._id);
            const paidPerInstallment = new Map();
            for (const p of existingPayments) {
                if (!p.isCancelled) {
                    for (const alloc of p.allocation) {
                        const current = paidPerInstallment.get(alloc.installmentNo) ?? 0;
                        paidPerInstallment.set(alloc.installmentNo, current + alloc.amount);
                    }
                }
            }
            // ── STEP 5: Allocate payment to installments (oldest due first) ─────────
            // We must consider BOTH existing payments AND concessions when deciding
            // what is "outstanding" in an installment.
            const totalConcession = enrollment.totalFee - enrollment.netFee;
            // Note: paidPerInstallment currently only contains actual cash payments.
            const academicClass = await AcademicClass_model_1.AcademicClass.findById(enrollment.academicClassId).lean();
            const installmentPlan = (academicClass?.installmentPlan ?? []);
            const allocation = this.allocateWithConcession(installmentPlan, paidPerInstallment, totalConcession, input.amount);
            if (allocation.length === 0 && input.amount > 0) {
                throw new Error('No outstanding installments to allocate payment against');
            }
            // ── STEP 6: Insert Payment document ─────────────────────────────────────
            const payment = await paymentRepo.create({
                enrollmentId: enrollment._id,
                amount: input.amount,
                paymentMode: input.paymentMode,
                allocation,
                receivedBy: new mongoose_1.Types.ObjectId(input.receivedBy),
                fingerprintVerified: input.fingerprintVerified ?? false,
                isCancelled: false,
                receiptId: null,
                transactionRef: input.transactionRef ?? null,
                bankName: input.bankName ?? null,
                chequeNumber: input.chequeNumber ?? null,
                chequeDate: input.chequeDate ?? null,
            }, session);
            // ── STEP 7: Insert Ledger CREDIT entry ──────────────────────────────────
            await ledgerSvc.recordCredit({
                enrollmentId: enrollment._id,
                amount: input.amount,
                referenceType: 'PAYMENT',
                referenceId: payment._id,
                description: `Payment via ${input.paymentMode}${input.transactionRef ? ` [Ref: ${input.transactionRef}]` : ''}`,
                createdBy: input.receivedBy,
                session,
            });
            // ── STEP 8: Generate atomic receipt number ──────────────────────────────
            const receiptNumber = await (0, receiptNumber_1.generateReceiptNumber)(session);
            // ── STEP 9: Insert Receipt document ─────────────────────────────────────
            const receipt = await receiptRepo.create({
                receiptNumber,
                paymentId: payment._id,
                enrollmentId: enrollment._id,
                printedBy: new mongoose_1.Types.ObjectId(input.receivedBy),
                printedAt: new Date(),
                reprintCount: 0,
                isCancelled: false,
                locked: true,
            }, session);
            // Link receipt ID back to payment (controlled atomic set)
            await paymentRepo.setReceiptId(payment._id, receipt._id, session);
            // ── STEP 10: Commit transaction ────────────────────────────────────────
            await session.commitTransaction();
            // Post-commit: fire-and-forget audit log (never blocks the response)
            audit_service_1.auditService.logAsync({
                actorId: input.receivedBy,
                action: 'PAYMENT_CREATED',
                entityType: 'PAYMENT',
                entityId: payment._id.toString(),
                before: null,
                after: {
                    paymentId: payment._id.toString(),
                    amount: payment.amount,
                    paymentMode: payment.paymentMode,
                    receiptNumber,
                    enrollmentId: input.enrollmentId,
                },
                ipAddress: input.ipAddress,
                userAgent: input.userAgent,
            });
            await payment.populate('receivedBy', 'name firstName lastName');
            return { payment, receipt, receiptNumber, allocation };
        }
        catch (err) {
            await session.abortTransaction();
            throw err;
        }
        finally {
            session.endSession();
        }
    }
    /**
     * Private: Allocates incoming payment amount to installments in due-date order.
     * Crucially accounts for concessions which reduce the overall debt.
     */
    allocateWithConcession(installmentPlan, paidPerInstallment, totalConcession, incomingAmount) {
        const allocation = [];
        let remainingConcession = totalConcession;
        let remainingPayment = incomingAmount;
        // Sort installments by dueDate ascending (oldest due first)
        const sorted = [...installmentPlan].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        for (const installment of sorted) {
            const installmentAmount = installment.amount;
            const cashPaid = paidPerInstallment.get(installment.installmentNo) ?? 0;
            // How much of this installment is covered by concessions?
            // Concessions fill the "oldest" debt first.
            const concessionCover = Math.min(installmentAmount - cashPaid, remainingConcession);
            remainingConcession -= concessionCover;
            const coveredSoFar = cashPaid + concessionCover;
            const outstanding = installmentAmount - coveredSoFar;
            if (outstanding <= 0)
                continue;
            if (remainingPayment <= 0)
                continue;
            const toAllocate = Math.min(outstanding, remainingPayment);
            allocation.push({ installmentNo: installment.installmentNo, amount: toAllocate });
            remainingPayment -= toAllocate;
        }
        return allocation;
    }
    /**
     * ──────────────────────────────────────────────────────────────────────────
     * PAYMENT CANCELLATION FLOW
     * ──────────────────────────────────────────────────────────────────────────
     * - Does NOT delete the Payment document
     * - Atomically marks isCancelled = true on Payment
     * - Inserts reverse LedgerEntry (DEBIT, referenceType: CANCELLATION)
     * - Marks Receipt as cancelled
     * - Writes audit log
     */
    async cancelPayment(params) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            // Fetch original payment
            const payment = await paymentRepo.findById(params.paymentId);
            if (!payment)
                throw new Error('Payment not found');
            if (payment.isCancelled)
                throw new Error('Payment has already been cancelled');
            // Snapshot before-state for audit log
            const beforeState = {
                isCancelled: false,
                amount: payment.amount,
                enrollmentId: payment.enrollmentId.toString(),
            };
            // Atomically mark payment as cancelled (with guard: isCancelled:false)
            const cancelled = await paymentRepo.cancelPayment(params.paymentId, params.cancelledBy, params.reason, session);
            if (!cancelled) {
                throw new Error('Payment cancellation failed — concurrent modification detected');
            }
            // Insert reverse ledger entry (DEBIT = money clawed back)
            await ledgerSvc.recordDebit({
                enrollmentId: payment.enrollmentId,
                amount: payment.amount,
                referenceType: 'CANCELLATION',
                referenceId: payment._id,
                description: `Cancellation of payment ${params.paymentId}. Reason: ${params.reason}`,
                createdBy: params.cancelledBy,
                session,
            });
            // Mark associated receipt as cancelled
            if (payment.receiptId) {
                await receiptRepo.markCancelled(payment.receiptId, session);
            }
            await session.commitTransaction();
            // Fire-and-forget audit log
            audit_service_1.auditService.logAsync({
                actorId: params.cancelledBy,
                action: 'PAYMENT_CANCELLED',
                entityType: 'PAYMENT',
                entityId: params.paymentId,
                before: beforeState,
                after: {
                    isCancelled: true,
                    reason: params.reason,
                    cancelledBy: params.cancelledBy,
                },
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            });
            return { success: true, message: 'Payment cancelled successfully. Reverse ledger entry created.' };
        }
        catch (err) {
            await session.abortTransaction();
            throw err;
        }
        finally {
            session.endSession();
        }
    }
}
exports.PaymentService = PaymentService;
exports.paymentService = new PaymentService();
//# sourceMappingURL=payment.service.js.map