import { IRole } from '../models/Role.model';
import { IPermission } from '../models/Permission.model';
export declare class RBACService {
    createRole(params: {
        name: string;
        description: string;
        isSystemRole?: boolean;
        createdBy: string;
        ipAddress: string;
    }): Promise<IRole>;
    grantPermission(params: {
        roleId: string;
        permissionId: string;
        grantedBy: string;
        ipAddress: string;
    }): Promise<void>;
    revokePermission(params: {
        roleId: string;
        permissionId: string;
        revokedBy: string;
        ipAddress: string;
    }): Promise<void>;
    listRoles(): Promise<IRole[]>;
    listPermissions(): Promise<IPermission[]>;
    getRolePermissions(roleId: string): Promise<IPermission[]>;
}
export declare const rbacService: RBACService;
//# sourceMappingURL=rbac.service.d.ts.map