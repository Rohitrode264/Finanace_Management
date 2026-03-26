import { connectDB } from './config/db';
import { env } from './config/env'; // System Config
import { seedPermissions } from './utils/seeder';
import app from './app';
import { scheduleDailyReport } from './jobs/dailyReport.job';

async function main(): Promise<void> {
    // 1. Connect to MongoDB (with retry logic in db.ts)
    await connectDB();

    // 2. Seed permissions and default roles
    await seedPermissions();

    // 3. Start background jobs
    // NOTE: Daily report requires Redis. If Redis is not available,
    // report scheduling will log a warning but not crash the server.
    try {
        await scheduleDailyReport();
    } catch (err) {
        console.warn('⚠️  Could not start daily report job (Redis may be unavailable):', err);
    }

    // 3. Start HTTP server
    const port = parseInt(env.PORT, 10);
    app.listen(port, () => {
        console.log(`\n Finance Management API running on port ${port}`);
        console.log(`   Environment : ${env.NODE_ENV}`);
        console.log(`   Health check: http://localhost:${port}/health\n`);
    });

    // 4. Graceful shutdown handlers
    const shutdown = async (signal: string): Promise<void> => {
        console.log(`\n📴 Received ${signal}. Shutting down gracefully...`);
        process.exit(0);
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));

    // 5. Unhandled rejection guard — log but don't crash for non-financial errors
    process.on('unhandledRejection', (reason: unknown) => {
        console.error('Unhandled Promise Rejection:', reason);
        // For financial systems, unexpected rejections warrant examination
        // In production, integrate with error monitoring (e.g. Sentry)
    });
}

main().catch((err: unknown) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
});
