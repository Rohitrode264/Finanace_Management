"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
// ── Load .env from multiple possible locations ───────────────────────────────
const envPaths = [
    path_1.default.resolve(process.cwd(), '.env'),
    path_1.default.resolve(__dirname, '../../../../.env'), // Root of New Career Point
    path_1.default.resolve(__dirname, '../../../.env'), // Root of Finance Management System
    path_1.default.resolve(__dirname, '../../.env'), // Root of backend
];
envPaths.forEach((p) => dotenv_1.default.config({ path: p }));
// ── Environment Schema ───────────────────────────────────────────────────────
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('3000'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    MONGODB_URI: zod_1.z.string().min(1, 'MONGODB_URI is required and must not be empty'),
    JWT_SECRET: zod_1.z.string().min(1, 'JWT_SECRET is required'),
    JWT_EXPIRES_IN: zod_1.z.string().default('1d'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(1, 'JWT_REFRESH_SECRET is required'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    CORS_ORIGIN: zod_1.z.string().default('*'),
    LOGIN_RATE_LIMIT_WINDOW_MS: zod_1.z.string().default('900000'),
    LOGIN_RATE_LIMIT_MAX: zod_1.z.string().default('5'),
    REDIS_HOST: zod_1.z.string().default(''), // Empty means Redis is disabled / Bull optional
    REDIS_PORT: zod_1.z.string().default('6379'),
    SMTP_HOST: zod_1.z.string().default('smtp.gmail.com'),
    SMTP_PORT: zod_1.z.string().default('587'),
    SMTP_USER: zod_1.z.string().default(''),
    SMTP_PASS: zod_1.z.string().default(''),
    SMTP_FROM: zod_1.z.string().default('Finance System <no-reply@school.com>'),
    REPORT_EMAIL_TO: zod_1.z.string().default('owner@school.com'),
    RBAC_CACHE_TTL_SECONDS: zod_1.z.string().default('300'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Environment validation failed:', JSON.stringify(parsed.error.format(), null, 2));
    throw new Error('Invalid environment variables');
}
exports.env = parsed.data;
//# sourceMappingURL=env.js.map