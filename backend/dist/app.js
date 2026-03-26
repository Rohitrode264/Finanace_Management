"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
// Route imports
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const student_routes_1 = __importDefault(require("./routes/student.routes"));
const class_routes_1 = __importDefault(require("./routes/class.routes"));
const enrollment_routes_1 = __importDefault(require("./routes/enrollment.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const receipt_routes_1 = __importDefault(require("./routes/receipt.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const rbac_routes_1 = __importDefault(require("./routes/rbac.routes"));
const audit_routes_1 = __importDefault(require("./routes/audit.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const app = (0, express_1.default)();
// ── Security headers (Step 11) ──────────────────────────────────────────────
app.use((0, helmet_1.default)());
// ── CORS — whitelist only (Step 11) ─────────────────────────────────────────
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        const allowedOrigins = env_1.env.CORS_ORIGIN.split(',').map((o) => o.trim());
        if (!origin || allowedOrigins.includes(origin) || env_1.env.CORS_ORIGIN === '*') {
            callback(null, true);
        }
        else {
            callback(new Error(`CORS: Origin ${origin} not allowed`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: false }));
// ── Health check (no auth required) ─────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: env_1.env.NODE_ENV });
});
// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', auth_routes_1.default);
app.use('/api/students', student_routes_1.default);
app.use('/api/classes', class_routes_1.default);
app.use('/api/enrollments', enrollment_routes_1.default);
app.use('/api/payments', payment_routes_1.default);
app.use('/api/receipts', receipt_routes_1.default);
app.use('/api/reports', report_routes_1.default);
app.use('/api/rbac', rbac_routes_1.default);
app.use('/api/audit-logs', audit_routes_1.default);
app.use('/api/categories', category_routes_1.default);
app.use('/api/settings', settings_routes_1.default);
// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});
// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
});
exports.default = app;
//# sourceMappingURL=app.js.map