import { IUser } from '../models/User.model';
export declare class AuthService {
    /**
     * Hashes a plaintext password. Always use this before storing user passwords.
     */
    hashPassword(plaintext: string): Promise<string>;
    /**
     * Verifies a plaintext password against a stored bcrypt hash.
     */
    verifyPassword(plaintext: string, hash: string): Promise<boolean>;
    /**
     * Generates a signed JWT access token for an authenticated user.
     */
    generateAccessToken(user: Pick<IUser, '_id' | 'email' | 'roleId'>): string;
    /**
     * Generates a signed refresh token.
     */
    generateRefreshToken(userId: string): string;
    /**
     * Authenticates a user with email + password.
     * Returns the user if valid, throws descriptive errors otherwise.
     * Never reveals whether the email or password was wrong (prevents enumeration).
     */
    login(email: string, password: string): Promise<{
        user: IUser;
        accessToken: string;
        refreshToken: string;
    }>;
    /**
     * Creates a new user. Called only by admin-level operations.
     */
    createUser(params: {
        name: string;
        email: string;
        password: string;
        roleId: string;
        createdBy: string;
    }): Promise<IUser>;
    /**
     * Special route for initial admin setup.
     * Only works if NO users exist in the system.
     */
    signupAdmin(params: {
        name: string;
        email: string;
        password: string;
    }): Promise<IUser>;
    /**
     * Registers a fingerprint template for a user.
     * For Mantra MFS100, this will be the base64 template extracted from PID data.
     */
    registerFingerprint(params: {
        userId: string;
        fingerprintKey: string;
        registeredBy: string;
    }): Promise<void>;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map