import mongoose, { Document, Types } from 'mongoose';
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
export declare const LedgerEntry: mongoose.Model<ILedgerEntry, {}, {}, {}, mongoose.Document<unknown, {}, ILedgerEntry, {}, {}> & ILedgerEntry & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=LedgerEntry.model.d.ts.map