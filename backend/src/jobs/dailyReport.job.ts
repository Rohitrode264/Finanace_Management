// ──────────────────────────────────────────────────────────────────────────────
// Daily Report Background Job (Step 9)
// Core logic extracted for both Bull (Local) and EventBridge (Lambda) execution.
// ──────────────────────────────────────────────────────────────────────────────

import Bull from 'bull';
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import { chromium } from 'playwright';
import { env } from '../config/env';
import { reportService } from '../services/report.service';
import { auditService } from '../services/audit.service';

// ── Queue setup (Only for local dev/Bull) ──
export const reportQueue = env.REDIS_HOST ? new Bull('daily-report', {
    redis: {
        host: env.REDIS_HOST,
        port: parseInt(env.REDIS_PORT, 10),
    },
    defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 3,
        backoff: { type: 'exponential', delay: 60000 },
    },
}) : null;

// ── Email transporter ──
export const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT, 10),
    secure: false,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

import { SystemSetting } from '../models/SystemSetting.model';

/**
 * Core business logic for generating and sending the daily report.
 * Can be called by Bull worker OR directly by Lambda.
 */
export async function processDailyReport(date: string, triggeredBy: string): Promise<void> {
    try {
        // If system-triggered (automated), always use current date.
        // If manually triggered (API), use the provided date.
        const reportDate = triggeredBy === 'system' ? new Date() : new Date(date);

        // Check if auto-send is enabled (ONLY IF TRIGGERED BY SYSTEM)
        if (triggeredBy === 'system') {
            const autoSendSetting = await SystemSetting.findOne({ key: 'DAILY_REPORT_AUTO_SEND' });
            const isAutoSendEnabled = autoSendSetting?.value === 'true' || autoSendSetting?.value === true;
            if (!isAutoSendEnabled) {
                console.log('ℹ️  Skipping automated daily report: DAILY_REPORT_AUTO_SEND is disabled.');
                return;
            }
        }

        const summary = await reportService.getDailyReport(reportDate);

        // Fetch target email from system settings
        const emailSetting = await SystemSetting.findOne({ key: 'DAILY_REPORT_EMAIL' });
        const targetEmail = emailSetting?.value || env.REPORT_EMAIL_TO;

        const newAdmissionsHtml = summary.newAdmissions.students.length > 0
            ? `
                <h3>New Admissions Today (${summary.newAdmissions.total})</h3>
                <table border="1" cellpadding="8" style="border-collapse:collapse; width:100%">
                    <tr style="background:#f4f4f4"><th>Student Name</th><th>Adm No</th><th>Deposited (₹)</th></tr>
                    ${summary.newAdmissions.students.map(s => `
                        <tr>
                            <td>${s.name}</td>
                            <td>${s.admissionNumber}</td>
                            <td>${s.deposited.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </table>
            `
            : '<p style="color: #666; font-style: italic;">No new admissions today.</p>';

        const existingStudentsHtml = summary.existingStudentsActivity.length > 0
            ? `
                <h3 style="margin-top: 24px; color: #4b5563;">Existing Students Activity Today (${summary.existingStudentsActivity.length})</h3>
                <table border="1" cellpadding="8" style="border-collapse:collapse; width:100%; border: 1px solid #e5e7eb;">
                    <tr style="background:#f9fafb">
                        <th align="left">Student Name</th>
                        <th align="left">Adm No</th>
                        <th align="right">Paid Today (₹)</th>
                        <th align="right">Total Paid (₹)</th>
                        <th align="right">Balance Left (₹)</th>
                    </tr>
                    ${summary.existingStudentsActivity.map(s => `
                        <tr>
                            <td>${s.name}</td>
                            <td>${s.admissionNumber}</td>
                            <td align="right">${s.deposited.toFixed(2)}</td>
                            <td align="right" style="color: #10b981;">${s.totalPaid.toFixed(2)}</td>
                            <td align="right" style="color: #ef4444;">${s.left.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </table>
            `
            : '<p style="color: #666; font-style: italic;">No payments from existing students today.</p>';

        const html = `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #f3f4f6; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #6366f1; margin-bottom: 4px;">Financial Daily Summary</h1>
              <p style="color: #6b7280; font-size: 1.1rem; margin: 0;">${summary.date}</p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
              <h3 style="margin-top: 0; color: #334155;">Executive Summary</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                  <div style="padding: 16px; background: white; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                      <div style="color: #64748b; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Net Receipts Today</div>
                      <div style="font-size: 1.5rem; font-weight: 700; color: #6366f1;">₹${summary.netReceipts.toFixed(2)}</div>
                  </div>
                  <div style="padding: 16px; background: white; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                      <div style="color: #64748b; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Total Collected</div>
                      <div style="font-size: 1.5rem; font-weight: 700; color: #10b981;">₹${summary.totalCollected.toFixed(2)}</div>
                  </div>
              </div>
          </div>

          <h3 style="color: #4b5563;">New Admissions Detail</h3>
          ${newAdmissionsHtml}

          ${existingStudentsHtml}

          <div style="margin-top: 40px; border-top: 2px solid #f3f4f6; padding-top: 24px;">
              <h3 style="color: #4b5563;">Overall Portfolio Health</h3>
              <table border="0" cellpadding="8" style="width:100%; border-collapse: collapse;">
                <tr>
                    <td style="color: #6b7280;">Aggregate Fees Paid (Ongoing)</td>
                    <td align="right" style="font-weight: 600; font-size: 1.1rem;">₹${summary.overallFinances.paid.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="color: #6b7280;">Total Outstanding Receivables</td>
                    <td align="right" style="font-weight: 600; font-size: 1.1rem; color: #ef4444;">₹${summary.overallFinances.left.toFixed(2)}</td>
                </tr>
              </table>
          </div>

          <div style="text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #f3f4f6;">
              <p style="font-size: 12px; color: #9ca3af;">
                  This is an automated report generated by the Finance Management System.<br/>
                  Generated at ${new Date().toLocaleString()} (System Time)
              </p>
          </div>
      </div>
    `;

        // Generate PDF using playwright
        let pdfBuffer: Buffer | null = null;
        try {
            const browser = await chromium.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-dev-shm-usage']
            });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle' });
            
            const pdfData = await page.pdf({ format: 'A4', margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' } });
            pdfBuffer = Buffer.from(pdfData);
            await browser.close();
        } catch (pdfErr) {
            console.error('Failed to generate PDF attachment:', pdfErr);
        }

        const mailOptions: import('nodemailer/lib/mailer').Options = {
            from: env.SMTP_FROM,
            to: targetEmail,
            subject: `Daily Financial Report — ${summary.date}`,
            html,
        };

        if (pdfBuffer) {
            mailOptions.attachments = [
                {
                    filename: `Report_${summary.date}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                }
            ];
        }

        await transporter.sendMail(mailOptions);

        // Audit: log report generation
        auditService.logAsync({
            actorId: triggeredBy,
            action: 'REPORT_GENERATED',
            entityType: 'REPORT',
            entityId: summary.date,
            before: null,
            after: summary as unknown as Record<string, unknown>,
            ipAddress: 'system',
        });

        console.log(`✅ Daily report sent to ${targetEmail} for ${summary.date}`);
    } catch (err) {
        console.error(`❌ Daily report processing failed for ${date}:`, err);
        throw err;
    }
}

// ── Job processor (Bull only) ──
if (reportQueue) {
    reportQueue.process('daily-report', async (job) => {
        const { date, triggeredBy } = job.data as { date: string; triggeredBy: string };
        await processDailyReport(date, triggeredBy);
    });
}

/**
 * Schedule the daily report job.
 * Prioritizes Bull (Redis) for production consistency, 
 * but falls back to node-cron for simple EC2/local dev setups.
 */
export async function scheduleDailyReport(): Promise<void> {
    const cronSchedule = '0 19 * * *'; // 7 PM daily

    if (reportQueue) {
        // --- Option A: Bull (Redis is available) ---
        const existing = await reportQueue.getRepeatableJobs();
        for (const job of existing) {
            if (job.name === 'daily-report') {
                await reportQueue.removeRepeatableByKey(job.key);
            }
        }

        await reportQueue.add(
            'daily-report',
            { date: 'scheduled', triggeredBy: 'system' },
            { repeat: { cron: cronSchedule } }
        );

        console.log(`📅 Daily report JOB scheduled (7 PM via Bull queue)`);
    } else {
        // --- Option B: node-cron (Fallback for EC2/No Redis) ---
        cron.schedule(cronSchedule, async () => {
            console.log('[NODE-CRON] Starting scheduled daily report...');
            // The processDailyReport function will calculate 'today' internally because triggeredBy='system'
            await processDailyReport('today', 'system');
        });

        console.log(`📅 Daily report CRON scheduled (7 PM via node-cron)`);
    }
}
