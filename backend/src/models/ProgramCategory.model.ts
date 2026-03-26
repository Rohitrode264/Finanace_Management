import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProgramCategory extends Document {
    _id: Types.ObjectId;
    name: string;
    description: string;
    isActive: boolean;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ProgramCategorySchema = new Schema<IProgramCategory>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

export const ProgramCategory = mongoose.model<IProgramCategory>('ProgramCategory', ProgramCategorySchema);
