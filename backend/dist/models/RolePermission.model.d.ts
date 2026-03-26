import mongoose, { Document, Types } from 'mongoose';
export interface IRolePermission extends Document {
    _id: Types.ObjectId;
    roleId: Types.ObjectId;
    permissionId: Types.ObjectId;
    grantedBy: Types.ObjectId;
    createdAt: Date;
}
export declare const RolePermission: mongoose.Model<IRolePermission, {}, {}, {}, mongoose.Document<unknown, {}, IRolePermission, {}, {}> & IRolePermission & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=RolePermission.model.d.ts.map