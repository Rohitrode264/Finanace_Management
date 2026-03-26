import mongoose, { Document, Schema, Types } from 'mongoose';

export type LedgerEntryType = 'CREDIT' | 'DEBIT';
export type LedgerReferenceType = 'PAYMENT' | 'CONCESSION' | 'ADJUSTMENT' | 'CANCELLATION';

export interface ILedgerEntry extends Document {
    _id: Types.ObjectId;
    enrollmentId: Types.ObjectId;
    type: LedgerEntryType;
    amount: number;
    referenceType: LedgerReferenceType;
    referenceId: Types.ObjectId;
    description: string;
    createdBy: Types.ObjectId;
    createdAt: Date;
}

const LedgerEntrySchema = new Schema<ILedgerEntry>(
    {
        enrollmentId: {
            type: Schema.Types.ObjectId,
            ref: 'Enrollment',
            required: true,
        },
        type: {
            type: String,
            enum: ['CREDIT', 'DEBIT'] satisfies LedgerEntryType[],
            required: true,
            // CREDIT = money received / fee reduced. DEBIT = balance owed / reversal.
        },
        amount: {
            type: Number,
            required: true,
            min: [0.01, 'Ledger amount must be positive'],
        },
        referenceType: {
            type: String,
            enum: ['PAYMENT', 'CONCESSION', 'ADJUSTMENT', 'CANCELLATION'] satisfies LedgerReferenceType[],
            required: true,
        },
        referenceId: {
            type: Schema.Types.ObjectId,
            required: true,
            // References Payment._id, or internal adjustment doc
        },
        description: {
            type: String,
            trim: true,
            default: '',
            maxlength: 500,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        // FINANCIAL RULE: LedgerEntry is append-only.
        // No update or delete path exists. Period.
    }
);

// PRIMARY: reconstruct balance for an enrollment (most critical query)
LedgerEntrySchema.index({ enrollmentId: 1, createdAt: 1 });
// For daily report aggregation by date range
LedgerEntrySchema.index({ createdAt: 1 });
// For cancellation flow: find ledger entries for a specific payment
LedgerEntrySchema.index({ referenceId: 1, referenceType: 1 });

// ──────────────────────────────────────────────────────────────────────────────
// IMMUTABILITY ENFORCEMENT
// Pre-save hook ensures we never accidentally call .save() on an existing entry.
// ──────────────────────────────────────────────────────────────────────────────
LedgerEntrySchema.pre('save', function (next) {
    if (!this.isNew) {
        next(new Error('FINANCIAL VIOLATION: LedgerEntry is immutable. Cannot update an existing ledger record.'));
    } else {
        next();
    }
});

// Block findOneAndUpdate and updateOne at the model level
LedgerEntrySchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
    next(new Error('FINANCIAL VIOLATION: LedgerEntry updates are forbidden.'));
});

// Block findOneAndDelete and deleteOne at the model level
LedgerEntrySchema.pre(['findOneAndDelete', 'deleteOne', 'deleteMany'], function (next) {
    next(new Error('FINANCIAL VIOLATION: LedgerEntry deletion is forbidden.'));
});

export const LedgerEntry = mongoose.model<ILedgerEntry>('LedgerEntry', LedgerEntrySchema);
