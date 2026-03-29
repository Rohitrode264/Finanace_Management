import mongoose, { Document, Schema, Types } from 'mongoose';

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

const PaymentAllocationSchema = new Schema<IPaymentAllocation>(
    {
        installmentNo: { type: Number, required: true, min: 1 },
        amount: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const PaymentSchema = new Schema<IPayment>(
    {
        enrollmentId: {
            type: Schema.Types.ObjectId,
            ref: 'Enrollment',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: [0.01, 'Payment amount must be positive'],
        },
        paymentMode: {
            type: String,
            enum: ['CASH', 'UPI', 'CARD', 'CHEQUE', 'BANK_TRANSFER'] satisfies PaymentMode[],
            required: true,
        },
        allocation: {
            type: [PaymentAllocationSchema],
            required: true,
            validate: {
                validator: function (alloc: IPaymentAllocation[]) {
                    return alloc.length > 0;
                },
                message: 'Payment must be allocated to at least one installment',
            },
        },
        receiptId: {
            type: Schema.Types.ObjectId,
            ref: 'Receipt',
            default: null,
        },
        receivedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        fingerprintVerified: {
            type: Boolean,
            default: false,
        },
        isCancelled: {
            type: Boolean,
            default: false,
            index: true,
        },
        cancellationReason: {
            type: String,
            default: null,
            trim: true,
            maxlength: 500,
        },
        cancelledBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        cancelledAt: {
            type: Date,
            default: null,
        },
        transactionRef: {
            type: String,
            default: null,
            trim: true,
            // UPI ref, cheque number, transaction ID etc.
        },
        bankName: {
            type: String,
            default: null,
            trim: true,
        },
        chequeNumber: {
            type: String,
            default: null,
            trim: true,
        },
        chequeDate: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        // FINANCIAL RULE: Payment documents are created once and never updated
        // EXCEPTION: isCancelled, cancellationReason, cancelledBy, cancelledAt
        // can be set ONCE via atomic $set on cancellation (never via .save())
    }
);

// Fast lookup of all payments for a given enrollment
PaymentSchema.index({ enrollmentId: 1, createdAt: 1 });
// Find active (non-cancelled) payments for an enrollment
PaymentSchema.index({ enrollmentId: 1, isCancelled: 1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
