import { Request, Response } from 'express';
import { rbacService } from '../services/rbac.service';
import { authService } from '../services/auth.service';
import { auditService } from '../services/audit.service';
import { User } from '../models/User.model';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { z } from 'zod';

const createRoleSchema = z.object({ name: z.string().min(2), description: z.string().min(5) });
const grantPermSchema = z.object({ permissionId: z.string().length(24) });

const createUserSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(6),
    roleId: z.string().length(24),
});
const updateStatusSchema = z.object({ isActive: z.boolean() });

export class RBACController {
    // ── User Management ───────────────────────────────────────────────────────

    async listUsers(_req: Request, res: Response): Promise<void> {
        try {
            const users = await User.find()
                .populate('roleId', 'name description')
                .sort({ createdAt: -1 })
                .select('-passwordHash');
            sendSuccess(res, users);
        } catch { sendError(res, 'Failed to fetch users', 500); }
    }

    async createUser(req: Request, res: Response): Promise<void> {
        const parsed = createUserSchema.safeParse(req.body);
        if (!parsed.success) { sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format()); return; }
        try {
            const user = await authService.createUser({ ...parsed.data, createdBy: req.user!.userId });
            const meta = auditService.extractRequestMeta(req);
            auditService.logAsync({
                actorId: req.user!.userId,
                action: 'USER_CREATED',
                entityType: 'USER',
                entityId: user._id.toString(),
                before: null,
                after: { email: user.email, roleId: parsed.data.roleId },
                ...meta,
            });
            sendSuccess(res, user, 201, 'User created successfully');
        } catch (err) { sendError(res, err instanceof Error ? err.message : 'Failed to create user', 400); }
    }

    async updateUserStatus(req: Request, res: Response): Promise<void> {
        const parsed = updateStatusSchema.safeParse(req.body);
        if (!parsed.success) { sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format()); return; }
        try {
            const user = await User.findByIdAndUpdate(
                req.params['id'],
                { $set: { isActive: parsed.data.isActive } },
                { new: true }
            );
            if (!user) { sendError(res, 'User not found', 404); return; }
            const meta = auditService.extractRequestMeta(req);
            auditService.logAsync({
                actorId: req.user!.userId,
                action: parsed.data.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
                entityType: 'USER',
                entityId: user._id.toString(),
                before: { isActive: !parsed.data.isActive },
                after: { isActive: parsed.data.isActive },
                ...meta,
            });
            sendSuccess(res, user, 200, `User ${parsed.data.isActive ? 'activated' : 'deactivated'} successfully`);
        } catch { sendError(res, 'Failed to update user status', 500); }
    }

    async updateUserFingerprint(req: Request, res: Response): Promise<void> {
        const schema = z.object({ fingerprintKey: z.string().min(10) });
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) { sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format()); return; }
        try {
            await authService.registerFingerprint({
                userId: req.params['id']!,
                fingerprintKey: parsed.data.fingerprintKey,
                registeredBy: req.user!.userId,
            });
            const meta = auditService.extractRequestMeta(req);
            auditService.logAsync({
                actorId: req.user!.userId,
                action: 'FINGERPRINT_REGISTERED',
                entityType: 'USER',
                entityId: req.params['id']!,
                before: null,
                after: { status: 'COMPLETE' },
                ...meta,
            });
            sendSuccess(res, null, 200, 'Fingerprint registered successfully');
        } catch (err) { sendError(res, err instanceof Error ? err.message : 'Failed to register fingerprint', 400); }
    }

    // ── Role Management ───────────────────────────────────────────────────────

    async listRoles(_req: Request, res: Response): Promise<void> {
        try { sendSuccess(res, await rbacService.listRoles()); }
        catch { sendError(res, 'Failed to fetch roles', 500); }
    }

    async createRole(req: Request, res: Response): Promise<void> {
        const parsed = createRoleSchema.safeParse(req.body);
        if (!parsed.success) { sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format()); return; }
        try {
            const meta = auditService.extractRequestMeta(req);
            const role = await rbacService.createRole({ ...parsed.data, createdBy: req.user!.userId, ...meta });
            sendSuccess(res, role, 201);
        } catch (err) { sendError(res, err instanceof Error ? err.message : 'Failed', 400); }
    }

    async listPermissions(_req: Request, res: Response): Promise<void> {
        try { sendSuccess(res, await rbacService.listPermissions()); }
        catch { sendError(res, 'Failed to fetch permissions', 500); }
    }

    async grantPermission(req: Request, res: Response): Promise<void> {
        const parsed = grantPermSchema.safeParse(req.body);
        if (!parsed.success) { sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format()); return; }
        try {
            const meta = auditService.extractRequestMeta(req);
            await rbacService.grantPermission({ roleId: req.params['id']!, ...parsed.data, grantedBy: req.user!.userId, ...meta });
            sendSuccess(res, null, 200, 'Permission granted');
        } catch (err) { sendError(res, err instanceof Error ? err.message : 'Failed', 400); }
    }

    async getRolePermissions(req: Request, res: Response): Promise<void> {
        try { sendSuccess(res, await rbacService.getRolePermissions(req.params['id']!)); }
        catch { sendError(res, 'Failed to fetch role permissions', 500); }
    }
}

export const rbacController = new RBACController();
