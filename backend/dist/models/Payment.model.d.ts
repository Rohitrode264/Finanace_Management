import mongoose, { Document, Types } from 'mongoose';
export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'CHEQUE' | 'BANK_TRANSFER';
export interface IPaymentAllocation {
    installmentNo: number;
    amount: number;
}
export interface IPayment extends Document {
    _id: Types.ObjectId;
    enrollmentId: Types.ObjectId;
    amount: number;
    paymentMode: PaymentMode;
    allocation: IPaymentAllocation[];
    receiptId: Types.ObjectId | null;
    receivedBy: Types.ObjectId;
    fingerprintVerified: boolean;
    isCancelled: boolean;
    cancellationReason: string | null;
    cancelledBy: Types.ObjectId | null;
    cancelledAt: Date | null;
    transactionRef: string | null;
    bankName: string | null;
    chequeNumber: string | null;
    chequeDate: Date | null;
    createdAt: Date;
}
export declare const Payment: mongoose.Model<IPayment, {}, {}, {}, mongoose.Document<unknown, {}, IPayment, {}, {}> & IPayment & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Payment.model.d.ts.map