"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateRoleCache = invalidateRoleCache;
exports.permissionMiddleware = permissionMiddleware;
const RolePermission_model_1 = require("../models/RolePermission.model");
const env_1 = require("../config/env");
const permissionCache = new Map();
const mongoose_1 = __importDefault(require("mongoose"));
async function getRolePermissions(roleId) {
    const now = Date.now();
    const cached = permissionCache.get(roleId);
    if (cached && cached.expiresAt > now) {
        return cached.permissions;
    }
    // Protect against malformed roleIds from old tokens
    if (!mongoose_1.default.Types.ObjectId.isValid(roleId)) {
        return new Set();
    }
    // Fetch all rolePermission docs for this role and populate permission details
    const rolePerm = await RolePermission_model_1.RolePermission.find({ roleId })
        .populate('permissionId', 'action resource')
        .lean();
    const permissions = new Set(rolePerm.map((rp) => {
        const perm = rp.permissionId;
        return `${perm.action}:${perm.resource}`;
    }));
    const ttlMs = parseInt(env_1.env.RBAC_CACHE_TTL_SECONDS, 10) * 1000;
    permissionCache.set(roleId, { permissions, expiresAt: now + ttlMs });
    return permissions;
}
/**
 * Invalidate cached permissions for a role.
 * Must be called whenever role permissions are changed (grant/revoke).
 */
function invalidateRoleCache(roleId) {
    permissionCache.delete(roleId);
}
/**
 * Middleware factory — use in routes:
 * router.post('/payments', authMiddleware, permissionMiddleware('CREATE_PAYMENT', 'PAYMENT'), ...)
 */
function permissionMiddleware(actions, resource) {
    return async (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authenticated.' });
            return;
        }
        try {
            const permissions = await getRolePermissions(req.user.roleId);
            const actionList = Array.isArray(actions) ? actions : [actions];
            const hasPermission = actionList.some(action => permissions.has(`${action}:${resource}`));
            if (!hasPermission) {
                res.status(403).json({
                    success: false,
                    error: `Access denied. Missing permission: ${actionList.join(' or ')} for ${resource}`,
                });
                return;
            }
            next();
        }
        catch (err) {
            console.error('Permission check failed:', err);
            res.status(500).json({ success: false, error: 'Permission verification error.' });
        }
    };
}
//# sourceMappingURL=permission.middleware.js.map