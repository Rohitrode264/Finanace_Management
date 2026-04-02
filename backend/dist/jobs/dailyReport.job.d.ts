import Bull from 'bull';
import nodemailer from 'nodemailer';
export declare const reportQueue: Bull.Queue<any> | null;
export declare const transporter: nodemailer.Transporter<import("nodemailer/lib/smtp-transport").SentMessageInfo, import("nodemailer/lib/smtp-transport").Options>;
/**
 * Core business logic for generating and sending the daily report.
 * Can be called by Bull worker OR directly by Lambda.
 */
export declare function processDailyReport(date: string, triggeredBy: string): Promise<void>;
/**
 * Schedule the daily report job.
 * Prioritizes Bull (Redis) for production consistency,
 * but falls back to node-cron for simple EC2/local dev setups.
 */
export declare function scheduleDailyReport(): Promise<void>;
//# sourceMappingURL=dailyReport.job.d.ts.map