import mongoose, { Document, Types } from 'mongoose';
export declare const PERMISSION_ACTIONS: readonly ["CREATE_PAYMENT", "CANCEL_PAYMENT", "VIEW_PAYMENT", "CREATE_STUDENT", "UPDATE_STUDENT", "VIEW_STUDENT", "CREATE_ENROLLMENT", "VIEW_ENROLLMENT", "APPLY_CONCESSION", "APPROVE_CONCESSION", "CREATE_CLASS", "UPDATE_CLASS", "VIEW_CLASS", "VIEW_RECEIPT", "AUTHORIZE_RECEIPT_PRINT", "VIEW_REPORT", "GENERATE_REPORT", "MANAGE_ROLES", "MANAGE_PERMISSIONS", "MANAGE_USERS", "CREATE_USER", "VIEW_AUDIT_LOG", "UPDATE_SETTING"];
export declare const PERMISSION_RESOURCES: readonly ["PAYMENT", "STUDENT", "ENROLLMENT", "CLASS", "RECEIPT", "REPORT", "AUDIT_LOG", "ROLE", "PERMISSION", "CONCESSION", "USER", "SETTING"];
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
export declare const Permission: mongoose.Model<IPermission, {}, {}, {}, mongoose.Document<unknown, {}, IPermission, {}, {}> & IPermission & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Permission.model.d.ts.map