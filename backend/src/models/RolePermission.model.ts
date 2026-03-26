import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRolePermission extends Document {
    _id: Types.ObjectId;
    roleId: Types.ObjectId;
    permissionId: Types.ObjectId;
    grantedBy: Types.ObjectId;
    createdAt: Date;
}

const RolePermissionSchema = new Schema<IRolePermission>(
    {
        roleId: {
            type: Schema.Types.ObjectId,
            ref: 'Role',
            required: true,
        },
        permissionId: {
            type: Schema.Types.ObjectId,
            ref: 'Permission',
            required: true,
        },
        grantedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            // Tracks who granted this permission — audit trail
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        // RolePermission records are immutable. Revoke by deleting; grant by inserting.
    }
);

// Compound unique — a role cannot have the same permission twice
RolePermissionSchema.index({ roleId: 1, permissionId: 1 }, { unique: true });
// Fast permission lookup for a given role (used in every authenticated request)
RolePermissionSchema.index({ roleId: 1 });

export const RolePermission = mongoose.model<IRolePermission>('RolePermission', RolePermissionSchema);
