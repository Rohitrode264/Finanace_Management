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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = require("../models/User.model");
const env_1 = require("../config/env");
const BCRYPT_ROUNDS = 12;
class AuthService {
    /**
     * Hashes a plaintext password. Always use this before storing user passwords.
     */
    async hashPassword(plaintext) {
        return bcryptjs_1.default.hash(plaintext, BCRYPT_ROUNDS);
    }
    /**
     * Verifies a plaintext password against a stored bcrypt hash.
     */
    async verifyPassword(plaintext, hash) {
        return bcryptjs_1.default.compare(plaintext, hash);
    }
    /**
     * Generates a signed JWT access token for an authenticated user.
     */
    generateAccessToken(user) {
        // Handle case where roleId is populated
        const roleIdObj = user.roleId;
        const roleIdStr = roleIdObj._id ? roleIdObj._id.toString() : roleIdObj.toString();
        const payload = {
            userId: user._id.toString(),
            roleId: roleIdStr,
            email: user.email,
        };
        return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
            expiresIn: env_1.env.JWT_EXPIRES_IN,
            issuer: 'finance-management-api',
            audience: 'finance-management-client',
        });
    }
    /**
     * Generates a signed refresh token.
     */
    generateRefreshToken(userId) {
        return jsonwebtoken_1.default.sign({ userId }, env_1.env.JWT_REFRESH_SECRET, {
            expiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN,
            issuer: 'finance-management-api',
        });
    }
    /**
     * Authenticates a user with email + password.
     * Returns the user if valid, throws descriptive errors otherwise.
     * Never reveals whether the email or password was wrong (prevents enumeration).
     */
    async login(email, password) {
        // Note: passwordHash is excluded from select by default
        // We must explicitly request it here
        const user = await User_model_1.User.findOne({ email: email.toLowerCase().trim(), isActive: true })
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
    async createUser(params) {
        const existing = await User_model_1.User.findOne({ email: params.email.toLowerCase() });
        if (existing) {
            throw new Error('A user with this email already exists');
        }
        const passwordHash = await this.hashPassword(params.password);
        const user = await User_model_1.User.create({
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
    async signupAdmin(params) {
        const userCount = await User_model_1.User.countDocuments();
        if (userCount > 0) {
            throw new Error('Admin user already exists. Setup route is disabled.');
        }
        // Get or create ADMIN role
        const { Role } = await Promise.resolve().then(() => __importStar(require('../models/Role.model')));
        let adminRole = await Role.findOne({ name: 'ADMIN' });
        if (!adminRole) {
            adminRole = await Role.create({
                name: 'ADMIN',
                description: 'Full system administrator with all permissions',
                isSystemRole: true,
            });
        }
        const passwordHash = await this.hashPassword(params.password);
        const user = await User_model_1.User.create({
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
    async registerFingerprint(params) {
        const user = await User_model_1.User.findById(params.userId);
        if (!user)
            throw new Error('User not found');
        user.fingerprintKey = params.fingerprintKey;
        await user.save();
        // Audit log is typically handled by the controller to include request meta
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map