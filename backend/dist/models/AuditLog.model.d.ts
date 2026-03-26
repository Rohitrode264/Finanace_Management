import mongoose, { Document, Types } from 'mongoose';
export type AuditAction = 'USER_LOGIN' | 'USER_LOGOUT' | 'USER_CREATED' | 'USER_ACTIVATED' | 'USER_DEACTIVATED' | 'PAYMENT_CREATED' | 'PAYMENT_CANCELLED' | 'CONCESSION_APPLIED' | 'ENROLLMENT_CREATED' | 'ENROLLMENT_STATUS_CHANGED' | 'STUDENT_CREATED' | 'STUDENT_UPDATED' | 'CLASS_CREATED' | 'CLASS_UPDATED' | 'RECEIPT_PRINTED' | 'RECEIPT_REPRINT_AUTHORIZED' | 'ROLE_CREATED' | 'PERMISSION_GRANTED' | 'PERMISSION_REVOKED' | 'REPORT_GENERATED' | 'ADJUSTMENT_APPLIED' | 'ADMIN_SETUP' | 'FINGERPRINT_REGISTERED' | 'SETTING_UPDATED';
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
export declare const AuditLog: mongoose.Model<IAuditLog, {}, {}, {}, mongoose.Document<unknown, {}, IAuditLog, {}, {}> & IAuditLog & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=AuditLog.model.d.ts.map