import mongoose, { Document, Types } from 'mongoose';
export interface IProgramCategory extends Document {
    _id: Types.ObjectId;
    name: string;
    description: string;
    isActive: boolean;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ProgramCategory: mongoose.Model<IProgramCategory, {}, {}, {}, mongoose.Document<unknown, {}, IProgramCategory, {}, {}> & IProgramCategory & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=ProgramCategory.model.d.ts.map