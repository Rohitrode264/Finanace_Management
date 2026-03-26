"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rbacService = exports.RBACService = void 0;
const Role_model_1 = require("../models/Role.model");
const Permission_model_1 = require("../models/Permission.model");
const RolePermission_model_1 = require("../models/RolePermission.model");
const permission_middleware_1 = require("../middlewares/permission.middleware");
const audit_service_1 = require("./audit.service");
const mongoose_1 = require("mongoose");
class RBACService {
    async createRole(params) {
        const role = await Role_model_1.Role.create({
            name: params.name.toUpperCase().trim(),
            description: params.description,
            isSystemRole: params.isSystemRole ?? false,
        });
        audit_service_1.auditService.logAsync({
            actorId: params.createdBy,
            action: 'ROLE_CREATED',
            entityType: 'ROLE',
            entityId: role._id.toString(),
            before: null,
            after: { name: role.name, isSystemRole: role.isSystemRole },
            ipAddress: params.ipAddress,
        });
        return role;
    }
    async grantPermission(params) {
        const [role, permission] = await Promise.all([
            Role_model_1.Role.findById(params.roleId),
            Permission_model_1.Permission.findById(params.permissionId),
        ]);
        if (!role)
            throw new Error('Role not found');
        if (!permission)
            throw new Error('Permission not found');
        await RolePermission_model_1.RolePermission.create({
            roleId: new mongoose_1.Types.ObjectId(params.roleId),
            permissionId: new mongoose_1.Types.ObjectId(params.permissionId),
            grantedBy: new mongoose_1.Types.ObjectId(params.grantedBy),
        });
        (0, permission_middleware_1.invalidateRoleCache)(params.roleId);
        audit_service_1.auditService.logAsync({
            actorId: params.grantedBy,
            action: 'PERMISSION_GRANTED',
            entityType: 'ROLE',
            entityId: params.roleId,
            before: null,
            after: { permission: `${permission.action}:${permission.resource}` },
            ipAddress: params.ipAddress,
        });
    }
    async revokePermission(params) {
        const permission = await Permission_model_1.Permission.findById(params.permissionId);
        if (!permission)
            throw new Error('Permission not found');
        await RolePermission_model_1.RolePermission.findOneAndDelete({
            roleId: params.roleId,
            permissionId: params.permissionId,
        });
        (0, permission_middleware_1.invalidateRoleCache)(params.roleId);
        audit_service_1.auditService.logAsync({
            actorId: params.revokedBy,
            action: 'PERMISSION_REVOKED',
            entityType: 'ROLE',
            entityId: params.roleId,
            before: { permission: `${permission.action}:${permission.resource}` },
            after: null,
            ipAddress: params.ipAddress,
        });
    }
    async listRoles() {
        return Role_model_1.Role.find().sort({ name: 1 });
    }
    async listPermissions() {
        return Permission_model_1.Permission.find().sort({ resource: 1, action: 1 });
    }
    async getRolePermissions(roleId) {
        const rolePerm = await RolePermission_model_1.RolePermission.find({ roleId })
            .populate('permissionId');
        return rolePerm.map((rp) => rp.permissionId);
    }
}
exports.RBACService = RBACService;
exports.rbacService = new RBACService();
//# sourceMappingURL=rbac.service.js.map