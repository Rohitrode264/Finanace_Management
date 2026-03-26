import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// ── Load .env from multiple possible locations ───────────────────────────────
const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../../../../.env'), // Root of New Career Point
    path.resolve(__dirname, '../../../.env'),    // Root of Finance Management System
    path.resolve(__dirname, '../../.env'),         // Root of backend
];

envPaths.forEach((p) => dotenv.config({ path: p }));

// ── Environment Schema ───────────────────────────────────────────────────────
const envSchema = z.object({
    PORT: z.string().default('3000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required and must not be empty'),

    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    JWT_EXPIRES_IN: z.string().default('1d'),
    JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    CORS_ORIGIN: z.string().default('*'),

    LOGIN_RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
    LOGIN_RATE_LIMIT_MAX: z.string().default('5'),

    REDIS_HOST: z.string().default(''), // Empty means Redis is disabled / Bull optional
    REDIS_PORT: z.string().default('6379'),

    SMTP_HOST: z.string().default('smtp.gmail.com'),
    SMTP_PORT: z.string().default('587'),
    SMTP_USER: z.string().default(''),
    SMTP_PASS: z.string().default(''),
    SMTP_FROM: z.string().default('Finance System <no-reply@school.com>'),
    REPORT_EMAIL_TO: z.string().default('owner@school.com'),

    RBAC_CACHE_TTL_SECONDS: z.string().default('300'),
});


const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Environment validation failed:', JSON.stringify(parsed.error.format(), null, 2));
    throw new Error('Invalid environment variables');
}

export type Env = z.infer<typeof envSchema>;
export const env: Env = parsed.data;
