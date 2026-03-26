import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemSetting extends Document {
    key: string;
    value: any;
    description?: string;
    updatedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const SystemSettingSchema = new Schema<ISystemSetting>(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        value: {
            type: Schema.Types.Mixed,
            required: true,
        },
        description: {
            type: String,
            trim: true,
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

export const SystemSetting = mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
