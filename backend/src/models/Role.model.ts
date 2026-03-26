import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRole extends Document {
    _id: Types.ObjectId;
    name: string;
    description: string;
    isSystemRole: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            // e.g. ADMIN, ACCOUNTANT, PRINCIPAL, RECEPTIONIST
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        isSystemRole: {
            type: Boolean,
            default: false,
            // System roles (ADMIN) cannot be deleted
        },
    },
    { timestamps: true }
);

export const Role = mongoose.model<IRole>('Role', RoleSchema);
