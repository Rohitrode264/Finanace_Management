import mongoose, { Document, Schema, Types } from 'mongoose';

// Strict permission action and resource enums prevent typo-based privilege escalation
export const PERMISSION_ACTIONS = [
    'CREATE_PAYMENT',
    'CANCEL_PAYMENT',
    'VIEW_PAYMENT',
    'CREATE_STUDENT',
    'UPDATE_STUDENT',
    'VIEW_STUDENT',
    'CREATE_ENROLLMENT',
    'VIEW_ENROLLMENT',
    'APPLY_CONCESSION',
    'APPROVE_CONCESSION',
    'CREATE_CLASS',
    'UPDATE_CLASS',
    'VIEW_CLASS',
    'VIEW_RECEIPT',
    'AUTHORIZE_RECEIPT_PRINT',
    'VIEW_REPORT',
    'GENERATE_REPORT',
    'MANAGE_ROLES',
    'MANAGE_PERMISSIONS',
    'MANAGE_USERS',
    'VIEW_AUDIT_LOG',
    'UPDATE_SETTING',
] as const;

export const PERMISSION_RESOURCES = [
    'PAYMENT',
    'STUDENT',
    'ENROLLMENT',
    'CLASS',
    'RECEIPT',
    'REPORT',
    'AUDIT_LOG',
    'ROLE',
    'PERMISSION',
    'CONCESSION',
    'USER',
    'SETTING',
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];
export type PermissionResource = (typeof PERMISSION_RESOURCES)[number];

export interface IPermission extends Document {
    _id: Types.ObjectId;
    action: PermissionAction;
    resource: PermissionResource;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}

const PermissionSchema = new Schema<IPermission>(
    {
        action: {
            type: String,
            enum: PERMISSION_ACTIONS,
            required: true,
        },
        resource: {
            type: String,
            enum: PERMISSION_RESOURCES,
            required: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
    },
    { timestamps: true }
);

// Compound unique — can't have duplicate action+resource combinations
PermissionSchema.index({ action: 1, resource: 1 }, { unique: true });

export const Permission = mongoose.model<IPermission>('Permission', PermissionSchema);
