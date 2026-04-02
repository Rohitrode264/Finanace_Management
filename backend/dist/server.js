"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./config/db");
const env_1 = require("./config/env"); // System Config
const seeder_1 = require("./utils/seeder");
const app_1 = __importDefault(require("./app"));
const dailyReport_job_1 = require("./jobs/dailyReport.job");
const node_dns_1 = __importDefault(require("node:dns"));
// Force Node.js to prefer IPv4 for DNS lookups. 
// This fixes querySrv ECONNREFUSED on some networks (like Jio/Reliance) 
// where SRV over IPv6 is flaky.
node_dns_1.default.setDefaultResultOrder('ipv4first');
async function main() {
    // 1. Connect to MongoDB (with retry logic in db.ts)
    await (0, db_1.connectDB)();
    // 2. Seed permissions and default roles
    await (0, seeder_1.seedPermissions)();
    // 3. Start background jobs
    // NOTE: Daily report requires Redis. If Redis is not available,
    // report scheduling will log a warning but not crash the server.
    try {
        await (0, dailyReport_job_1.scheduleDailyReport)();
    }
    catch (err) {
        console.warn('⚠️  Could not start daily report job (Redis may be unavailable):', err);
    }
    // 3. Start HTTP server
    const port = parseInt(env_1.env.PORT, 10);
    app_1.default.listen(port, () => {
        console.log(`\n Finance Management API running on port ${port}`);
        console.log(`   Environment : ${env_1.env.NODE_ENV}`);
        console.log(`   Health check: http://localhost:${port}/health\n`);
    });
    // 4. Graceful shutdown handlers
    const shutdown = async (signal) => {
        console.log(`\n📴 Received ${signal}. Shutting down gracefully...`);
        process.exit(0);
    };
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
    // 5. Unhandled rejection guard — log but don't crash for non-financial errors
    process.on('unhandledRejection', (reason) => {
        console.error('Unhandled Promise Rejection:', reason);
        // For financial systems, unexpected rejections warrant examination
        // In production, integrate with error monitoring (e.g. Sentry)
    });
}
main().catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map