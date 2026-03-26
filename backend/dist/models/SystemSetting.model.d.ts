import mongoose, { Document } from 'mongoose';
export interface ISystemSetting extends Document {
    key: string;
    value: any;
    description?: string;
    updatedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const SystemSetting: mongoose.Model<ISystemSetting, {}, {}, {}, mongoose.Document<unknown, {}, ISystemSetting, {}, {}> & ISystemSetting & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=SystemSetting.model.d.ts.map