import { IPayment, PaymentMode, IPaymentAllocation } from '../models/Payment.model';
import { IReceipt } from '../models/Receipt.model';
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
export declare class PaymentService {
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
    processPayment(input: ProcessPaymentInput): Promise<ProcessPaymentResult>;
    /**
     * Private: Allocates incoming payment amount to installments in due-date order.
     * Crucially accounts for concessions which reduce the overall debt.
     */
    private allocateWithConcession;
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
    cancelPayment(params: {
        paymentId: string;
        cancelledBy: string;
        reason: string;
        ipAddress: string;
        userAgent: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
export declare const paymentService: PaymentService;
//# sourceMappingURL=payment.service.d.ts.map