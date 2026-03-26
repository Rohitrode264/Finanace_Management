import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.model';
import { env } from '../config/env';
import { JwtPayload } from '../middlewares/auth.middleware';

const BCRYPT_ROUNDS = 12;

export class AuthService {
    /**
     * Hashes a plaintext password. Always use this before storing user passwords.
     */
    async hashPassword(plaintext: string): Promise<string> {
        return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
    }

    /**
     * Verifies a plaintext password against a stored bcrypt hash.
     */
    async verifyPassword(plaintext: string, hash: string): Promise<boolean> {
        return bcrypt.compare(plaintext, hash);
    }

    /**
     * Generates a signed JWT access token for an authenticated user.
     */
    generateAccessToken(user: Pick<IUser, '_id' | 'email' | 'roleId'>): string {
        // Handle case where roleId is populated
        const roleIdObj = user.roleId as any;
        const roleIdStr = roleIdObj._id ? roleIdObj._id.toString() : roleIdObj.toString();

        const payload: JwtPayload = {
            userId: user._id.toString(),
            roleId: roleIdStr,
            email: user.email,
        };
        return jwt.sign(payload, env.JWT_SECRET, {
            expiresIn: env.JWT_EXPIRES_IN,
            issuer: 'finance-management-api',
            audience: 'finance-management-client',
        } as jwt.SignOptions);
    }

    /**
     * Generates a signed refresh token.
     */
    generateRefreshToken(userId: string): string {
        return jwt.sign({ userId } as object, env.JWT_REFRESH_SECRET, {
            expiresIn: env.JWT_REFRESH_EXPIRES_IN,
            issuer: 'finance-management-api',
        } as jwt.SignOptions);
    }

    /**
     * Authenticates a user with email + password.
     * Returns the user if valid, throws descriptive errors otherwise.
     * Never reveals whether the email or password was wrong (prevents enumeration).
     */
    async login(email: string, password: string): Promise<{
        user: IUser;
        accessToken: string;
        refreshToken: string;
    }> {
        // Note: passwordHash is excluded from select by default
        // We must explicitly request it here
        const user = await User.findOne({ email: email.toLowerCase().trim(), isActive: true })
            .select('+passwordHash')
            .populate('roleId', 'name');

        if (!user) {
            throw new Error('Invalid credentials');
        }

        const valid = await this.verifyPassword(password, user.passwordHash);
        if (!valid) {
            throw new Error('Invalid credentials');
        }

        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user._id.toString());

        return { user, accessToken, refreshToken };
    }

    /**
     * Creates a new user. Called only by admin-level operations.
     */
    async createUser(params: {
        name: string;
        email: string;
        password: string;
        roleId: string;
        createdBy: string;
    }): Promise<IUser> {
        const existing = await User.findOne({ email: params.email.toLowerCase() });
        if (existing) {
            throw new Error('A user with this email already exists');
        }

        const passwordHash = await this.hashPassword(params.password);
        const user = await User.create({
            name: params.name,
            email: params.email.toLowerCase().trim(),
            passwordHash,
            roleId: params.roleId,
            isActive: true,
        });

        return user;
    }

    /**
     * Special route for initial admin setup.
     * Only works if NO users exist in the system.
     */
    async signupAdmin(params: {
        name: string;
        email: string;
        password: string;
    }): Promise<IUser> {
        const userCount = await User.countDocuments();
        if (userCount > 0) {
            throw new Error('Admin user already exists. Setup route is disabled.');
        }

        // Get or create ADMIN role
        const { Role } = await import('../models/Role.model');
        let adminRole = await Role.findOne({ name: 'ADMIN' });

        if (!adminRole) {
            adminRole = await Role.create({
                name: 'ADMIN',
                description: 'Full system administrator with all permissions',
                isSystemRole: true,
            });
        }

        const passwordHash = await this.hashPassword(params.password);
        const user = await User.create({
            name: params.name,
            email: params.email.toLowerCase().trim(),
            passwordHash,
            roleId: adminRole._id,
            isActive: true,
        });

        return user;
    }

    /**
     * Registers a fingerprint template for a user.
     * For Mantra MFS100, this will be the base64 template extracted from PID data.
     */
    async registerFingerprint(params: {
        userId: string;
        fingerprintKey: string;
        registeredBy: string;
    }): Promise<void> {
        const user = await User.findById(params.userId);
        if (!user) throw new Error('User not found');

        user.fingerprintKey = params.fingerprintKey;
        await user.save();
    }

    async generateResetOTP(email: string): Promise<string> {
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) throw new Error('User not found');

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        await user.save();
        return otp;
    }

    async resetPasswordWithOTP(params: { email: string; otp: string; newPassword: string }): Promise<void> {
        const user = await User.findOne({
            email: params.email.toLowerCase().trim(),
            resetPasswordOTP: params.otp,
            resetPasswordOTPExpires: { $gt: new Date() }
        }).select('+resetPasswordOTP +resetPasswordOTPExpires');

        if (!user) throw new Error('Invalid or expired OTP');

        user.passwordHash = await this.hashPassword(params.newPassword);
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpires = undefined;
        await user.save();
    }

    async updatePassword(userId: string, oldPass: string, newPass: string): Promise<void> {
        const user = await User.findById(userId).select('+passwordHash');
        if (!user) throw new Error('User not found');

        const valid = await this.verifyPassword(oldPass, user.passwordHash);
        if (!valid) throw new Error('Incorrect old password');

        user.passwordHash = await this.hashPassword(newPass);
        await user.save();
    }
}

export const authService = new AuthService();
