import { Request, Response, NextFunction } from 'express';
import { PermissionAction, PermissionResource } from '../models/Permission.model';
/**
 * Invalidate cached permissions for a role.
 * Must be called whenever role permissions are changed (grant/revoke).
 */
export declare function invalidateRoleCache(roleId: string): void;
/**
 * Middleware factory — use in routes:
 * router.post('/payments', authMiddleware, permissionMiddleware('CREATE_PAYMENT', 'PAYMENT'), ...)
 */
export declare function permissionMiddleware(actions: PermissionAction | PermissionAction[], resource: PermissionResource): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=permission.middleware.d.ts.map