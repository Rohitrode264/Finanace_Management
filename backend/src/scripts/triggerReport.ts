import { connectDB } from '../config/db';
import { processDailyReport } from '../jobs/dailyReport.job';

/**
 * Manually trigger the daily report job locally.
 * Usage: npx ts-node src/scripts/triggerReport.ts
 */
async function run() {
    console.log('Manually triggering Daily Report Job...');
    try {
        await connectDB();

        // Use current date or pass a specific one
        const date = new Date().toISOString();
        await processDailyReport(date, 'manual-trigger');

        console.log('Daily report processing complete!');
        process.exit(0);
    } catch (err) {
        console.error('Trigger failed:', err);
        process.exit(1);
    }
}

run();
