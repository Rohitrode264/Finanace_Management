import { Role, IRole } from '../models/Role.model';
import { Permission, IPermission } from '../models/Permission.model';
import { RolePermission } from '../models/RolePermission.model';
import { invalidateRoleCache } from '../middlewares/permission.middleware';
import { auditService } from './audit.service';
import { Types } from 'mongoose';

export class RBACService {
    async createRole(params: {
        name: string;
        description: string;
        isSystemRole?: boolean;
        createdBy: string;
        ipAddress: string;
    }): Promise<IRole> {
        const role = await Role.create({
            name: params.name.toUpperCase().trim(),
            description: params.description,
            isSystemRole: params.isSystemRole ?? false,
        });

        auditService.logAsync({
            actorId: params.createdBy,
            action: 'ROLE_CREATED',
            entityType: 'ROLE',
            entityId: role._id.toString(),
            before: null,
            after: { name: role.name, isSystemRole: role.isSystemRole },
            ipAddress: params.ipAddress,
        });

        return role as IRole;
    }

    async grantPermission(params: {
        roleId: string;
        permissionId: string;
        grantedBy: string;
        ipAddress: string;
    }): Promise<void> {
        const [role, permission] = await Promise.all([
            Role.findById(params.roleId),
            Permission.findById(params.permissionId),
        ]);
        if (!role) throw new Error('Role not found');
        if (!permission) throw new Error('Permission not found');

        await RolePermission.create({
            roleId: new Types.ObjectId(params.roleId),
            permissionId: new Types.ObjectId(params.permissionId),
            grantedBy: new Types.ObjectId(params.grantedBy),
        });

        invalidateRoleCache(params.roleId);

        auditService.logAsync({
            actorId: params.grantedBy,
            action: 'PERMISSION_GRANTED',
            entityType: 'ROLE',
            entityId: params.roleId,
            before: null,
            after: { permission: `${permission.action}:${permission.resource}` },
            ipAddress: params.ipAddress,
        });
    }

    async revokePermission(params: {
        roleId: string;
        permissionId: string;
        revokedBy: string;
        ipAddress: string;
    }): Promise<void> {
        const permission = await Permission.findById(params.permissionId);
        if (!permission) throw new Error('Permission not found');

        await RolePermission.findOneAndDelete({
            roleId: params.roleId,
            permissionId: params.permissionId,
        });

        invalidateRoleCache(params.roleId);

        auditService.logAsync({
            actorId: params.revokedBy,
            action: 'PERMISSION_REVOKED',
            entityType: 'ROLE',
            entityId: params.roleId,
            before: { permission: `${permission.action}:${permission.resource}` },
            after: null,
            ipAddress: params.ipAddress,
        });
    }

    async listRoles(): Promise<IRole[]> {
        return Role.find().sort({ name: 1 }) as unknown as Promise<IRole[]>;
    }

    async listPermissions(): Promise<IPermission[]> {
        return Permission.find().sort({ resource: 1, action: 1 }) as unknown as Promise<IPermission[]>;
    }

    async getRolePermissions(roleId: string): Promise<IPermission[]> {
        const rolePerm = await RolePermission.find({ roleId })
            .populate<{ permissionId: IPermission }>('permissionId');
        return rolePerm.map((rp) => rp.permissionId as IPermission);
    }
}

export const rbacService = new RBACService();
