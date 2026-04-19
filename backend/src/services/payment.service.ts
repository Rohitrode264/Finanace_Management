import mongoose, { Types } from 'mongoose';
import { EnrollmentRepository } from '../repositories/enrollment.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { ReceiptRepository } from '../repositories/receipt.repository';
import { LedgerService } from './ledger.service';
import { auditService } from './audit.service';
import { generateReceiptNumber } from '../utils/receiptNumber';
import { IPayment, PaymentMode, IPaymentAllocation } from '../models/Payment.model';
import { IReceipt } from '../models/Receipt.model';
import { LedgerEntry, ILedgerEntry } from '../models/LedgerEntry.model';
import { LedgerRepository } from '../repositories/ledger.repository';
import { AcademicClass } from '../models/AcademicClass.model';

const enrollmentRepo = new EnrollmentRepository();
const paymentRepo = new PaymentRepository();
const receiptRepo = new ReceiptRepository();
const ledgerRepo = new LedgerRepository();
const ledgerSvc = new LedgerService();

export interface ProcessPaymentInput {
    enrollmentId: string;
    amount: number;
    paymentMode: PaymentMode;
    receivedBy: string;
    ipAddress: string;
    userAgent: string;
    transactionRef?: string;
    bankName?: string;
    chequeNumber?: string;
    chequeDate?: Date;
    fingerprintVerified?: boolean;
}

export interface ProcessPaymentResult {
    payment: IPayment;
    receipt: IReceipt;
    receiptNumber: string;
    allocation: IPaymentAllocation[];
}

export class PaymentService {
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
    async processPayment(input: ProcessPaymentInput): Promise<ProcessPaymentResult> {
        const session = await mongoose.startSession();
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
            const paidPerInstallment = new Map<number, number>();

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
            const academicClass = await AcademicClass.findById(enrollment.academicClassId).lean();
            const installmentPlan = (academicClass?.installmentPlan ?? []) as Array<{
                installmentNo: number;
                dueDate: Date;
                amount: number;
            }>;

            const allocation = this.allocateWithConcession(
                installmentPlan,
                paidPerInstallment,
                totalConcession,
                input.amount
            );

            if (allocation.length === 0 && input.amount > 0) {
                throw new Error('No outstanding balance to allocate payment against');
            }

            const totalAllocated = allocation.reduce((sum, a) => sum + a.amount, 0);
            if (totalAllocated < input.amount) {
                throw new Error(`Payment rejected: Collected amount (${input.amount}) is greater than outstanding balance (${totalAllocated}).`);
            }

            // ── STEP 6: Insert Payment document ─────────────────────────────────────
            const payment = await paymentRepo.create(
                {
                    enrollmentId: enrollment._id,
                    amount: input.amount,
                    paymentMode: input.paymentMode,
                    allocation,
                    receivedBy: new Types.ObjectId(input.receivedBy),
                    fingerprintVerified: input.fingerprintVerified ?? false,
                    isCancelled: false,
                    receiptId: null,
                    transactionRef: input.transactionRef ?? null,
                    bankName: input.bankName ?? null,
                    chequeNumber: input.chequeNumber ?? null,
                    chequeDate: input.chequeDate ?? null,
                },
                session
            );

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
            const receiptNumber = await generateReceiptNumber(session);

            // ── STEP 9: Insert Receipt document ─────────────────────────────────────
            const receipt = await receiptRepo.create(
                {
                    receiptNumber,
                    paymentId: payment._id,
                    enrollmentId: enrollment._id,
                    printedBy: new Types.ObjectId(input.receivedBy),
                    printedAt: new Date(),
                    reprintCount: 0,
                    isCancelled: false,
                    locked: true,
                },
                session
            );

            // Link receipt ID back to payment (controlled atomic set)
            await paymentRepo.setReceiptId(payment._id, receipt._id, session);

            // ── STEP 10: Commit transaction ────────────────────────────────────────
            await session.commitTransaction();

            // Post-commit: fire-and-forget audit log (never blocks the response)
            auditService.logAsync({
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

            await (payment as any).populate('receivedBy', 'name firstName lastName');
            return { payment, receipt, receiptNumber, allocation };
        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    }

    /**
     * Private: Allocates incoming payment amount to installments in due-date order.
     * Crucially accounts for concessions which reduce the overall debt.
     */
    private allocateWithConcession(
        installmentPlan: Array<{ installmentNo: number; dueDate: Date; amount: number }>,
        paidPerInstallment: Map<number, number>,
        totalConcession: number,
        incomingAmount: number
    ): IPaymentAllocation[] {
        const allocation: IPaymentAllocation[] = [];
        let remainingConcession = totalConcession;
        let remainingPayment = incomingAmount;

        // Sort installments by dueDate ascending (oldest due first)
        const sorted = [...installmentPlan].sort(
            (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );

        for (const installment of sorted) {
            const installmentAmount = installment.amount;
            const cashPaid = paidPerInstallment.get(installment.installmentNo) ?? 0;

            // How much of this installment is covered by concessions?
            // Concessions fill the "oldest" debt first.
            const concessionCover = Math.min(installmentAmount - cashPaid, remainingConcession);
            remainingConcession -= concessionCover;

            const coveredSoFar = cashPaid + concessionCover;
            const outstanding = installmentAmount - coveredSoFar;

            if (outstanding <= 0) continue;

            if (remainingPayment <= 0) continue;

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
    async cancelPayment(params: {
        paymentId: string;
        cancelledBy: string;
        reason: string;
        ipAddress: string;
        userAgent: string;
    }): Promise<{ success: boolean; message: string }> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Fetch original payment
            const payment = await paymentRepo.findById(params.paymentId);
            if (!payment) throw new Error('Payment not found');
            if (payment.isCancelled) throw new Error('Payment has already been cancelled');

            // Snapshot before-state for audit log
            const beforeState = {
                isCancelled: false,
                amount: payment.amount,
                enrollmentId: payment.enrollmentId.toString(),
            };

            // Atomically mark payment as cancelled (with guard: isCancelled:false)
            const cancelled = await paymentRepo.cancelPayment(
                params.paymentId,
                params.cancelledBy,
                params.reason,
                session
            );
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
            auditService.logAsync({
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
        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    }

    /**
     * ──────────────────────────────────────────────────────────────────────────
     * ADMIN-ONLY: HARD DELETE PAYMENT
     * ──────────────────────────────────────────────────────────────────────────
     * - Atomically deletes Payment, LedgerEntry, and Receipt documents.
     * - Bypasses Ledger immutability hooks using native collection methods.
     * - Logs action in Audit Log.
     */
    async hardDeletePayment(params: {
        paymentId: string;
        adminId: string;
        ipAddress: string;
        userAgent: string;
    }): Promise<{ success: boolean; message: string }> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Fetch original payment details
            const payment = await paymentRepo.findById(params.paymentId);
            if (!payment) throw new Error('Payment not found');

            // 2. Hard delete associated Ledger entries (bypassing middleware)
            await ledgerRepo.hardDeleteByReference(payment._id, 'PAYMENT', session);

            // 3. Hard delete associated Receipts
            await receiptRepo.hardDeleteByPaymentId(payment._id, session);

            // 4. Hard delete the Payment itself
            await paymentRepo.hardDelete(payment._id, session);

            // 4.5. Propagate payment deletion to any transferred enrollments
            let currentEnrollmentId = payment.enrollmentId;
            let currentReduction = payment.amount;

            while (currentReduction > 0) {
                const adjEntry = await mongoose.model<ILedgerEntry>('LedgerEntry').findOne({
                    referenceId: currentEnrollmentId,
                    referenceType: 'ADJUSTMENT' // This identifies a transfer carry-over
                }).session(session);

                if (!adjEntry) {
                    break;
                }

                const newAmount = Math.max(0, adjEntry.amount - currentReduction);
                const actualReduction = adjEntry.amount - newAmount;

                if (newAmount <= 0) {
                    await LedgerEntry.collection.deleteOne({ _id: adjEntry._id }, { session });
                } else {
                    await LedgerEntry.collection.updateOne(
                        { _id: adjEntry._id },
                        { $set: { amount: newAmount } },
                        { session }
                    );
                }

                currentEnrollmentId = adjEntry.enrollmentId;
                currentReduction = actualReduction;
            }

            await session.commitTransaction();

            // 5. Audit Logging (Non-blocking)
            auditService.logAsync({
                actorId: params.adminId,
                action: 'PAYMENT_HARD_DELETED',
                entityType: 'PAYMENT',
                entityId: params.paymentId,
                before: {
                    paymentId: payment._id,
                    amount: payment.amount,
                    enrollmentId: payment.enrollmentId,
                    receiptId: payment.receiptId,
                },
                after: null, // Hard delete = nothing left
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            });

            return { success: true, message: 'Payment and all associated financial records have been permanently deleted.' };
        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    }
}

export const paymentService = new PaymentService();
