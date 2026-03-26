import Bull from 'bull';
export declare const reportQueue: Bull.Queue<any> | null;
/**
 * Core business logic for generating and sending the daily report.
 * Can be called by Bull worker OR directly by Lambda.
 */
export declare function processDailyReport(date: string, triggeredBy: string): Promise<void>;
/**
 * Schedule the daily report job (Bull only).
 */
export declare function scheduleDailyReport(): Promise<void>;
//# sourceMappingURL=dailyReport.job.d.ts.map