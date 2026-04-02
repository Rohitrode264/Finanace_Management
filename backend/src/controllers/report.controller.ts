import { Request, Response } from 'express';
import { reportService } from '../services/report.service';
import { auditService } from '../services/audit.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { processDailyReport } from '../jobs/dailyReport.job';

export class ReportController {
    async getDailyReport(req: Request, res: Response): Promise<void> {
        const { date, endDate } = req.query as { date?: string, endDate?: string };
        const reportDate = date ? new Date(date) : new Date();
        const reportEndDate = endDate ? new Date(endDate) : undefined;

        if (isNaN(reportDate.getTime()) || (reportEndDate && isNaN(reportEndDate.getTime()))) {
            sendError(res, 'Invalid date format. Use YYYY-MM-DD', 400);
            return;
        }

        try {
            const summary = await reportService.getDailyReport(reportDate, reportEndDate);
            auditService.logAsync({
                actorId: req.user!.userId,
                action: 'REPORT_GENERATED',
                entityType: 'REPORT',
                entityId: summary.date,
                before: null,
                after: summary as unknown as Record<string, unknown>,
                ...auditService.extractRequestMeta(req),
            });
            sendSuccess(res, summary);
        } catch { sendError(res, 'Failed to generate report', 500); }
    }
    // like where we got the payments and then we should be able select a range 
    async getEnrollmentLedgerReport(req: Request, res: Response): Promise<void> {
        try {
            const ledger = await reportService.getEnrollmentLedger(req.params['enrollmentId']!);
            sendSuccess(res, { ledger });
        } catch { sendError(res, 'Failed to fetch ledger report', 500); }
    }

    async getDashboardStats(req: Request, res: Response): Promise<void> {
        try {
            const today = new Date();
            const overview = await reportService.getDashboardOverview(today);
            sendSuccess(res, overview);
        } catch (err) {
            sendError(res, 'Failed to fetch dashboard stats', 500);
        }
    }

    async getPaymentDates(req: Request, res: Response): Promise<void> {
        try {
            const { year, month } = req.query as { year?: string; month?: string };
            const y = year ? parseInt(year, 10) : new Date().getFullYear();
            const m = month ? parseInt(month, 10) : new Date().getMonth() + 1;
            if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
                sendError(res, 'Invalid year or month', 400);
                return;
            }
            const dates = await reportService.getPaymentDates(y, m);
            sendSuccess(res, { dates });
        } catch {
            sendError(res, 'Failed to fetch payment dates', 500);
        }
    }

    async sendNow(req: Request, res: Response): Promise<void> {
        try {
            const today = new Date().toISOString().split('T')[0]!;
            const triggeredBy = req.user!.userId;
            await processDailyReport(today, triggeredBy);
            sendSuccess(res, { sent: true, date: today }, 200, 'Daily report sent successfully');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to send report';
            sendError(res, message, 500);
        }
    }

    async getEagleEye(req: Request, res: Response): Promise<void> {
        try {
            const report = await reportService.getEagleEye();
            sendSuccess(res, report);
        } catch (err) {
            sendError(res, 'Failed to generate Eagle-Eye report', 500);
        }
    }
}

export const reportController = new ReportController();
