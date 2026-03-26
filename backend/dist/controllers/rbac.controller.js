"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rbacController = exports.RBACController = void 0;
const rbac_service_1 = require("../services/rbac.service");
const auth_service_1 = require("../services/auth.service");
const audit_service_1 = require("../services/audit.service");
const User_model_1 = require("../models/User.model");
const apiResponse_1 = require("../utils/apiResponse");
const zod_1 = require("zod");
const createRoleSchema = zod_1.z.object({ name: zod_1.z.string().min(2), description: zod_1.z.string().min(5) });
const grantPermSchema = zod_1.z.object({ permissionId: zod_1.z.string().length(24) });
const createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    roleId: zod_1.z.string().length(24),
});
const updateStatusSchema = zod_1.z.object({ isActive: zod_1.z.boolean() });
class RBACController {
    // ── User Management ───────────────────────────────────────────────────────
    async listUsers(_req, res) {
        try {
            const users = await User_model_1.User.find()
                .populate('roleId', 'name description')
                .sort({ createdAt: -1 })
                .select('-passwordHash');
            (0, apiResponse_1.sendSuccess)(res, users);
        }
        catch {
            (0, apiResponse_1.sendError)(res, 'Failed to fetch users', 500);
        }
    }
    async createUser(req, res) {
        const parsed = createUserSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, apiResponse_1.sendError)(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }
        try {
            const user = await auth_service_1.authService.createUser({ ...parsed.data, createdBy: req.user.userId });
            const meta = audit_service_1.auditService.extractRequestMeta(req);
            audit_service_1.auditService.logAsync({
                actorId: req.user.userId,
                action: 'USER_CREATED',
                entityType: 'USER',
                entityId: user._id.toString(),
                before: null,
                after: { email: user.email, roleId: parsed.data.roleId },
                ...meta,
            });
            (0, apiResponse_1.sendSuccess)(res, user, 201, 'User created successfully');
        }
        catch (err) {
            (0, apiResponse_1.sendError)(res, err instanceof Error ? err.message : 'Failed to create user', 400);
        }
    }
    async updateUserStatus(req, res) {
        const parsed = updateStatusSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, apiResponse_1.sendError)(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }
        try {
            const user = await User_model_1.User.findByIdAndUpdate(req.params['id'], { $set: { isActive: parsed.data.isActive } }, { new: true });
            if (!user) {
                (0, apiResponse_1.sendError)(res, 'User not found', 404);
                return;
            }
            const meta = audit_service_1.auditService.extractRequestMeta(req);
            audit_service_1.auditService.logAsync({
                actorId: req.user.userId,
                action: parsed.data.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
                entityType: 'USER',
                entityId: user._id.toString(),
                before: { isActive: !parsed.data.isActive },
                after: { isActive: parsed.data.isActive },
                ...meta,
            });
            (0, apiResponse_1.sendSuccess)(res, user, 200, `User ${parsed.data.isActive ? 'activated' : 'deactivated'} successfully`);
        }
        catch {
            (0, apiResponse_1.sendError)(res, 'Failed to update user status', 500);
        }
    }
    async updateUserFingerprint(req, res) {
        const schema = zod_1.z.object({ fingerprintKey: zod_1.z.string().min(10) });
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            (0, apiResponse_1.sendError)(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }
        try {
            await auth_service_1.authService.registerFingerprint({
                userId: req.params['id'],
                fingerprintKey: parsed.data.fingerprintKey,
                registeredBy: req.user.userId,
            });
            const meta = audit_service_1.auditService.extractRequestMeta(req);
            audit_service_1.auditService.logAsync({
                actorId: req.user.userId,
                action: 'FINGERPRINT_REGISTERED',
                entityType: 'USER',
                entityId: req.params['id'],
                before: null,
                after: { status: 'COMPLETE' },
                ...meta,
            });
            (0, apiResponse_1.sendSuccess)(res, null, 200, 'Fingerprint registered successfully');
        }
        catch (err) {
            (0, apiResponse_1.sendError)(res, err instanceof Error ? err.message : 'Failed to register fingerprint', 400);
        }
    }
    // ── Role Management ───────────────────────────────────────────────────────
    async listRoles(_req, res) {
        try {
            (0, apiResponse_1.sendSuccess)(res, await rbac_service_1.rbacService.listRoles());
        }
        catch {
            (0, apiResponse_1.sendError)(res, 'Failed to fetch roles', 500);
        }
    }
    async createRole(req, res) {
        const parsed = createRoleSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, apiResponse_1.sendError)(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }
        try {
            const meta = audit_service_1.auditService.extractRequestMeta(req);
            const role = await rbac_service_1.rbacService.createRole({ ...parsed.data, createdBy: req.user.userId, ...meta });
            (0, apiResponse_1.sendSuccess)(res, role, 201);
        }
        catch (err) {
            (0, apiResponse_1.sendError)(res, err instanceof Error ? err.message : 'Failed', 400);
        }
    }
    async listPermissions(_req, res) {
        try {
            (0, apiResponse_1.sendSuccess)(res, await rbac_service_1.rbacService.listPermissions());
        }
        catch {
            (0, apiResponse_1.sendError)(res, 'Failed to fetch permissions', 500);
        }
    }
    async grantPermission(req, res) {
        const parsed = grantPermSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, apiResponse_1.sendError)(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }
        try {
            const meta = audit_service_1.auditService.extractRequestMeta(req);
            await rbac_service_1.rbacService.grantPermission({ roleId: req.params['id'], ...parsed.data, grantedBy: req.user.userId, ...meta });
            (0, apiResponse_1.sendSuccess)(res, null, 200, 'Permission granted');
        }
        catch (err) {
            (0, apiResponse_1.sendError)(res, err instanceof Error ? err.message : 'Failed', 400);
        }
    }
    async getRolePermissions(req, res) {
        try {
            (0, apiResponse_1.sendSuccess)(res, await rbac_service_1.rbacService.getRolePermissions(req.params['id']));
        }
        catch {
            (0, apiResponse_1.sendError)(res, 'Failed to fetch role permissions', 500);
        }
    }
}
exports.RBACController = RBACController;
exports.rbacController = new RBACController();
//# sourceMappingURL=rbac.controller.js.map