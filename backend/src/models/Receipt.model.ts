import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReceipt extends Document {
    _id: Types.ObjectId;
    receiptNumber: string;   // Unique auto-generated e.g. RCP-2024-000001
    paymentId: Types.ObjectId;
    enrollmentId: Types.ObjectId;
    printedBy: Types.ObjectId;
    printedAt: Date;
    reprintCount: number;
    isCancelled: boolean;
    locked: boolean;         // Always true — receipt is immutable
    createdAt: Date;
}

const ReceiptSchema = new Schema<IReceipt>(
    {
        receiptNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },
        paymentId: {
            type: Schema.Types.ObjectId,
            ref: 'Payment',
            required: true,
            unique: true, // One receipt per payment
        },
        enrollmentId: {
            type: Schema.Types.ObjectId,
            ref: 'Enrollment',
            required: true,
        },
        printedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        printedAt: {
            type: Date,
            required: true,
            default: () => new Date(),
        },
        reprintCount: {
            type: Number,
            default: 0,
            min: 0,
            // Only incremented via atomic $inc in authorize-print flow
        },
        isCancelled: {
            type: Boolean,
            default: false,
            // Set to true when corresponding payment is cancelled
        },
        locked: {
            type: Boolean,
            default: true,
            // Always true. Enforced in pre-save hook.
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Enforce locked = true always
ReceiptSchema.pre('save', function (next) {
    if (!this.isNew) {
        next(new Error('FINANCIAL VIOLATION: Receipt is immutable. Cannot update an existing receipt via .save().'));
    }
    this.locked = true;
    next();
});

// Allow ONLY atomic updates to reprintCount and isCancelled — block all else
ReceiptSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
    const update = this.getUpdate() as Record<string, unknown> | null;
    const allowedKeys = ['$inc', '$set'];
    const updateKeys = Object.keys(update ?? {});

    const hasDisallowedKeys = updateKeys.some((k) => !allowedKeys.includes(k));
    if (hasDisallowedKeys) {
        return next(new Error('FINANCIAL VIOLATION: Only atomic $inc/$set allowed on Receipt.'));
    }

    const setFields = (update?.['$set'] as Record<string, unknown>) ?? {};
    const incFields = (update?.['$inc'] as Record<string, unknown>) ?? {};
    const allowedSetFields = ['isCancelled'];
    const allowedIncFields = ['reprintCount'];

    const invalidSet = Object.keys(setFields).some((f) => !allowedSetFields.includes(f));
    const invalidInc = Object.keys(incFields).some((f) => !allowedIncFields.includes(f));

    if (invalidSet || invalidInc) {
        return next(new Error('FINANCIAL VIOLATION: Only isCancelled ($set) and reprintCount ($inc) can be updated on Receipt.'));
    }

    next();
});

ReceiptSchema.pre(['findOneAndDelete', 'deleteOne', 'deleteMany'], function (next) {
    next(new Error('FINANCIAL VIOLATION: Receipt deletion is forbidden.'));
});

// Fast lookup of receipts for a given enrollment
ReceiptSchema.index({ enrollmentId: 1 });

export const Receipt = mongoose.model<IReceipt>('Receipt', ReceiptSchema);
