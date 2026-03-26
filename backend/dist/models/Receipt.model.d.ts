import mongoose, { Document, Types } from 'mongoose';
export interface IReceipt extends Document {
    _id: Types.ObjectId;
    receiptNumber: string;
    paymentId: Types.ObjectId;
    enrollmentId: Types.ObjectId;
    printedBy: Types.ObjectId;
    printedAt: Date;
    reprintCount: number;
    isCancelled: boolean;
    locked: boolean;
    createdAt: Date;
}
export declare const Receipt: mongoose.Model<IReceipt, {}, {}, {}, mongoose.Document<unknown, {}, IReceipt, {}, {}> & IReceipt & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Receipt.model.d.ts.map