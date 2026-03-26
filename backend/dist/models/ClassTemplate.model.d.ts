import mongoose, { Document, Types } from 'mongoose';
export type Board = 'CBSE' | 'ICSE' | 'STATE' | 'IB' | 'OTHER';
export interface IClassTemplate extends Document {
    _id: Types.ObjectId;
    grade: string;
    stream: string | null;
    board: Board;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ClassTemplate: mongoose.Model<IClassTemplate, {}, {}, {}, mongoose.Document<unknown, {}, IClassTemplate, {}, {}> & IClassTemplate & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=ClassTemplate.model.d.ts.map