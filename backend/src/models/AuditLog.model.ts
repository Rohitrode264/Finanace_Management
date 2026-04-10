import mongoose, { Document, Schema, Types } from 'mongoose';

export type AuditAction =
    | 'USER_LOGIN'
    | 'USER_LOGOUT'
    | 'USER_CREATED'
    | 'USER_ACTIVATED'
    | 'USER_DEACTIVATED'
    | 'PAYMENT_CREATED'
    | 'PAYMENT_CANCELLED'
    | 'PAYMENT_HARD_DELETED'
    | 'CONCESSION_APPLIED'
    | 'ENROLLMENT_CREATED'
    | 'ENROLLMENT_STATUS_CHANGED'
    | 'ENROLLMENT_TRANSFERRED'
    | 'STUDENT_CREATED'
    | 'STUDENT_UPDATED'
    | 'CLASS_CREATED'
    | 'CLASS_UPDATED'
    | 'RECEIPT_PRINTED'
    | 'RECEIPT_REPRINT_AUTHORIZED'
    | 'ROLE_CREATED'
    | 'PERMISSION_GRANTED'
    | 'PERMISSION_REVOKED'
    | 'REPORT_GENERATED'
    | 'ADJUSTMENT_APPLIED'
    | 'ADMIN_SETUP'
    | 'FINGERPRINT_REGISTERED'
    | 'SETTING_UPDATED';

export interface IAuditLog extends Document {
    _id: Types.ObjectId;
    actorId: Types.ObjectId;
    action: AuditAction;
    entityType: string;
    entityId: Types.ObjectId | string;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
    {
        actorId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        action: {
            type: String,
            required: true,
            enum: [
                'USER_LOGIN', 'USER_LOGOUT',
                'USER_CREATED', 'USER_ACTIVATED', 'USER_DEACTIVATED',
                'PAYMENT_CREATED', 'PAYMENT_CANCELLED', 'PAYMENT_HARD_DELETED',
                'CONCESSION_APPLIED',
                'ENROLLMENT_CREATED', 'ENROLLMENT_STATUS_CHANGED', 'ENROLLMENT_TRANSFERRED',
                'STUDENT_CREATED', 'STUDENT_UPDATED',
                'CLASS_CREATED', 'CLASS_UPDATED',
                'RECEIPT_PRINTED', 'RECEIPT_REPRINT_AUTHORIZED',
                'ROLE_CREATED', 'PERMISSION_GRANTED', 'PERMISSION_REVOKED',
                'REPORT_GENERATED', 'ADJUSTMENT_APPLIED',
                'ADMIN_SETUP', 'FINGERPRINT_REGISTERED', 'SETTING_UPDATED',
            ] satisfies AuditAction[],
        },
        entityType: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
            // e.g. 'PAYMENT', 'ENROLLMENT', 'STUDENT'
        },
        entityId: {
            type: Schema.Types.Mixed,
            required: true,
        },
        before: {
            type: Schema.Types.Mixed,
            default: null,
            // Snapshot of entity state BEFORE the action
        },
        after: {
            type: Schema.Types.Mixed,
            default: null,
            // Snapshot of entity state AFTER the action
        },
        ipAddress: {
            type: String,
            required: true,
            trim: true,
        },
        userAgent: {
            type: String,
            trim: true,
            default: '',
        },
        timestamp: {
            type: Date,
            required: true,
            default: () => new Date(),
            index: true,
        },
    },
    {
        // No timestamps option — we manage our own 'timestamp' field for precision
        strict: true,
        collection: 'auditlogs',
    }
);

// ABSOLUTE IMMUTABILITY — AuditLog must NEVER be mutated or deleted
AuditLogSchema.pre('save', function (next) {
    if (!this.isNew) {
        next(new Error('COMPLIANCE VIOLATION: AuditLog is immutable. Existing entries cannot be modified.'));
    } else {
        next();
    }
});

AuditLogSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
    next(new Error('COMPLIANCE VIOLATION: AuditLog updates are strictly forbidden.'));
});

AuditLogSchema.pre(['findOneAndDelete', 'deleteOne', 'deleteMany'], function (next) {
    next(new Error('COMPLIANCE VIOLATION: AuditLog deletion is strictly forbidden.'));
});

// Query by actor for user activity reports
AuditLogSchema.index({ actorId: 1, timestamp: -1 });
// Query by entity for an entity's full audit trail
AuditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
// Query by action type
AuditLogSchema.index({ action: 1, timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
