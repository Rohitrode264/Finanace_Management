import { Request, Response, NextFunction } from 'express';
import { RolePermission } from '../models/RolePermission.model';
import { Permission, PermissionAction, PermissionResource } from '../models/Permission.model';
import { env } from '../config/env';

// ──────────────────────────────────────────────────────────────────────────────
// In-memory permission cache keyed by roleId
// Avoids DB round-trip on every request for the same role
// TTL is configurable via RBAC_CACHE_TTL_SECONDS env variable
// ──────────────────────────────────────────────────────────────────────────────
interface CacheEntry {
    permissions: Set<string>; // "ACTION:RESOURCE" strings
    expiresAt: number;
}

const permissionCache = new Map<string, CacheEntry>();

import mongoose from 'mongoose';

async function getRolePermissions(roleId: string): Promise<Set<string>> {
    const now = Date.now();
    const cached = permissionCache.get(roleId);

    if (cached && cached.expiresAt > now) {
        return cached.permissions;
    }

    // Protect against malformed roleIds from old tokens
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
        return new Set();
    }

    // Fetch all rolePermission docs for this role and populate permission details
    const rolePerm = await RolePermission.find({ roleId })
        .populate<{ permissionId: { action: PermissionAction; resource: PermissionResource } }>(
            'permissionId',
            'action resource'
        )
        .lean();

    const permissions = new Set<string>(
        rolePerm.map((rp) => {
            const perm = rp.permissionId as { action: string; resource: string };
            return `${perm.action}:${perm.resource}`;
        })
    );

    const ttlMs = parseInt(env.RBAC_CACHE_TTL_SECONDS, 10) * 1000;
    permissionCache.set(roleId, { permissions, expiresAt: now + ttlMs });

    return permissions;
}

/**
 * Invalidate cached permissions for a role.
 * Must be called whenever role permissions are changed (grant/revoke).
 */
export function invalidateRoleCache(roleId: string): void {
    permissionCache.delete(roleId);
}

/**
 * Middleware factory — use in routes:
 * router.post('/payments', authMiddleware, permissionMiddleware('CREATE_PAYMENT', 'PAYMENT'), ...)
 */
export function permissionMiddleware(action: PermissionAction, resource: PermissionResource) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authenticated.' });
            return;
        }

        try {
            const permissions = await getRolePermissions(req.user.roleId);
            const required = `${action}:${resource}`;

            if (!permissions.has(required)) {
                res.status(403).json({
                    success: false,
                    error: `Access denied. Missing permission: ${required}`,
                });
                return;
            }

            next();
        } catch (err) {
            console.error('Permission check failed:', err);
            res.status(500).json({ success: false, error: 'Permission verification error.' });
        }
    };
}
