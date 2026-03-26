import mongoose, { Document, Types } from 'mongoose';
export interface IRole extends Document {
    _id: Types.ObjectId;
    name: string;
    description: string;
    isSystemRole: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Role: mongoose.Model<IRole, {}, {}, {}, mongoose.Document<unknown, {}, IRole, {}, {}> & IRole & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Role.model.d.ts.map