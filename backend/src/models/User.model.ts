import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUser extends Document {
    _id: Types.ObjectId;
    name: string;
    email: string;
    passwordHash: string;
    roleId: Types.ObjectId;
    fingerprintKey: string | null;
    resetPasswordOTP?: string;
    resetPasswordOTPExpires?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
        },
        passwordHash: {
            type: String,
            required: true,
            // Never expose this field in API responses
            select: false,
        },
        roleId: {
            type: Schema.Types.ObjectId,
            ref: 'Role',
            required: true,
            index: true,
        },
        fingerprintKey: {
            type: String,
            default: null,
            // Encrypted fingerprint reference key, NOT raw biometric data
        },
        resetPasswordOTP: {
            type: String,
            select: false,
        },
        resetPasswordOTPExpires: {
            type: Date,
            select: false,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        timestamps: true,
        // Never expose passwordHash in toJSON
        toJSON: {
            transform(_doc, ret: Record<string, any>) {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                delete ret.passwordHash;

                // Flatten role if populated
                if (ret.roleId && typeof ret.roleId === 'object' && ret.roleId.name) {
                    ret.role = ret.roleId.name;
                    ret.roleId = ret.roleId._id.toString();
                }

                return ret;
            },
        },
    }
);

// Compound index: active users by role — common query for permission resolution
UserSchema.index({ roleId: 1, isActive: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
