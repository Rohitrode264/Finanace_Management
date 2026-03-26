"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const audit_service_1 = require("../services/audit.service");
const apiResponse_1 = require("../utils/apiResponse");
const zod_1 = require("zod");
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
const signupAdminSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
const registerFingerprintSchema = zod_1.z.object({
    userId: zod_1.z.string().length(24),
    fingerprintKey: zod_1.z.string().min(50), // Mantra templates are usually long base64 strings
});
class AuthController {
    async login(req, res) {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, apiResponse_1.sendError)(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }
        try {
            const { user, accessToken, refreshToken } = await auth_service_1.authService.login(parsed.data.email, parsed.data.password);
            // Fetch permissions for the user's role
            // user.roleId could be an ObjectId or populated object from authService
            const roleIdObj = user.roleId;
            const roleIdStr = roleIdObj._id ? roleIdObj._id.toString() : roleIdObj.toString();
            const { rbacService } = await Promise.resolve().then(() => __importStar(require('../services/rbac.service')));
            const permissionEntities = await rbacService.getRolePermissions(roleIdStr);
            const permissions = permissionEntities.map(p => p.action);
            const meta = audit_service_1.auditService.extractRequestMeta(req);
            audit_service_1.auditService.logAsync({
                actorId: user._id.toString(),
                action: 'USER_LOGIN',
                entityType: 'USER',
                entityId: user._id.toString(),
                before: null,
                after: { email: user.email },
                ...meta,
            });
            (0, apiResponse_1.sendSuccess)(res, { accessToken, refreshToken, user, permissions }, 200, 'Login successful');
        }
        catch (err) {
            // Intentionally vague error to prevent user enumeration
            (0, apiResponse_1.sendError)(res, 'Invalid credentials', 401, 'AUTH_FAILED');
        }
    }
    async signupAdmin(req, res) {
        const parsed = signupAdminSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, apiResponse_1.sendError)(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }
        try {
            const user = await auth_service_1.authService.signupAdmin(parsed.data);
            const meta = audit_service_1.auditService.extractRequestMeta(req);
            audit_service_1.auditService.logAsync({
                actorId: user._id.toString(),
                action: 'ADMIN_SETUP',
                entityType: 'USER',
                entityId: user._id.toString(),
                before: null,
                after: { email: user.email, name: user.name },
                ...meta,
            });
            (0, apiResponse_1.sendSuccess)(res, user, 201, 'Admin account created successfully');
        }
        catch (err) {
            (0, apiResponse_1.sendError)(res, err instanceof Error ? err.message : 'Registration failed', 400);
        }
    }
    async registerFingerprint(req, res) {
        const parsed = registerFingerprintSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, apiResponse_1.sendError)(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }
        try {
            await auth_service_1.authService.registerFingerprint({
                ...parsed.data,
                registeredBy: req.user.userId,
            });
            const meta = audit_service_1.auditService.extractRequestMeta(req);
            audit_service_1.auditService.logAsync({
                actorId: req.user.userId,
                action: 'FINGERPRINT_REGISTERED',
                entityType: 'USER',
                entityId: parsed.data.userId,
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
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map