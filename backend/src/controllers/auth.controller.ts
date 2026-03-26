import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { auditService } from '../services/audit.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { z } from 'zod';
import { transporter } from '../jobs/dailyReport.job';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

const signupAdminSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
});

const registerFingerprintSchema = z.object({
    userId: z.string().length(24),
    fingerprintKey: z.string().min(50), // Mantra templates are usually long base64 strings
});

const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

const resetPasswordSchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6),
    newPassword: z.string().min(6),
});

const changePasswordSchema = z.object({
    oldPassword: z.string().min(6),
    newPassword: z.string().min(6),
});

export class AuthController {
    async login(req: Request, res: Response): Promise<void> {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }

        try {
            const { user, accessToken, refreshToken } = await authService.login(
                parsed.data.email,
                parsed.data.password
            );

            // Fetch permissions for the user's role
            // user.roleId could be an ObjectId or populated object from authService
            const roleIdObj = user.roleId as any;
            const roleIdStr = roleIdObj._id ? roleIdObj._id.toString() : roleIdObj.toString();
            const { rbacService } = await import('../services/rbac.service');
            const permissionEntities = await rbacService.getRolePermissions(roleIdStr);
            const permissions = permissionEntities.map(p => p.action);

            const meta = auditService.extractRequestMeta(req);
            auditService.logAsync({
                actorId: user._id.toString(),
                action: 'USER_LOGIN',
                entityType: 'USER',
                entityId: user._id.toString(),
                before: null,
                after: { email: user.email },
                ...meta,
            });

            sendSuccess(res, { accessToken, refreshToken, user, permissions }, 200, 'Login successful');
        } catch (err) {
            // Intentionally vague error to prevent user enumeration
            sendError(res, 'Invalid credentials', 401, 'AUTH_FAILED');
        }
    }

    async signupAdmin(req: Request, res: Response): Promise<void> {
        const parsed = signupAdminSchema.safeParse(req.body);
        if (!parsed.success) {
            sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }

        try {
            const user = await authService.signupAdmin(parsed.data);

            const meta = auditService.extractRequestMeta(req);
            auditService.logAsync({
                actorId: user._id.toString(),
                action: 'ADMIN_SETUP',
                entityType: 'USER',
                entityId: user._id.toString(),
                before: null,
                after: { email: user.email, name: user.name },
                ...meta,
            });

            sendSuccess(res, user, 201, 'Admin account created successfully');
        } catch (err) {
            sendError(res, err instanceof Error ? err.message : 'Registration failed', 400);
        }
    }

    async registerFingerprint(req: Request, res: Response): Promise<void> {
        // ... (existing code)
    }

    async forgotPassword(req: Request, res: Response): Promise<void> {
        const parsed = forgotPasswordSchema.safeParse(req.body);
        if (!parsed.success) { sendError(res, 'Invalid email', 422); return; }
        try {
            const otp = await authService.generateResetOTP(parsed.data.email);
            const mailOptions: import('nodemailer/lib/mailer').Options = {
                from: process.env.SMTP_FROM,
                to: req.body.email,
                subject: `Reset Password OTP`,
                html: `<h1>Your OTP is: ${otp}</h1>`,
            };
            await transporter.sendMail(mailOptions);
            sendSuccess(res, { message: 'OTP sent to your email' }, 200);
        } catch (err) {
            sendError(res, err instanceof Error ? err.message : 'Feature unavailable', 400);
        }
    }

    async resetPassword(req: Request, res: Response): Promise<void> {
        const parsed = resetPasswordSchema.safeParse(req.body);
        if (!parsed.success) { sendError(res, 'Validation failed', 422); return; }
        try {
            await authService.resetPasswordWithOTP(parsed.data);
            sendSuccess(res, null, 200, 'Password reset successful. Please login.');
        } catch (err) {
            sendError(res, err instanceof Error ? err.message : 'Reset failed', 400);
        }
    }

    async changePassword(req: Request, res: Response): Promise<void> {
        const parsed = changePasswordSchema.safeParse(req.body);
        if (!parsed.success) { sendError(res, 'Validation failed', 422); return; }
        try {
            await authService.updatePassword(req.user!.userId, parsed.data.oldPassword, parsed.data.newPassword);
            sendSuccess(res, null, 200, 'Password updated successfully');
        } catch (err) {
            sendError(res, err instanceof Error ? err.message : 'Update failed', 400);
        }
    }
}

export const authController = new AuthController();
