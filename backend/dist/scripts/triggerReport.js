"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const dailyReport_job_1 = require("../jobs/dailyReport.job");
/**
 * Manually trigger the daily report job locally.
 * Usage: npx ts-node src/scripts/triggerReport.ts
 */
async function run() {
    console.log('Manually triggering Daily Report Job...');
    try {
        await (0, db_1.connectDB)();
        // Use current date or pass a specific one
        const date = new Date().toISOString();
        await (0, dailyReport_job_1.processDailyReport)(date, 'manual-trigger');
        console.log('Daily report processing complete!');
        process.exit(0);
    }
    catch (err) {
        console.error('Trigger failed:', err);
        process.exit(1);
    }
}
run();
//# sourceMappingURL=triggerReport.js.map