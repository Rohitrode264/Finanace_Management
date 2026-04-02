"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportController = exports.ReportController = void 0;
const report_service_1 = require("../services/report.service");
const audit_service_1 = require("../services/audit.service");
const apiResponse_1 = require("../utils/apiResponse");
const dailyReport_job_1 = require("../jobs/dailyReport.job");
class ReportController {
    async getDailyReport(req, res) {
        const { date, endDate } = req.query;
        const reportDate = date ? new Date(date) : new Date();
        const reportEndDate = endDate ? new Date(endDate) : undefined;
        if (isNaN(reportDate.getTime()) || (reportEndDate && isNaN(reportEndDate.getTime()))) {
            (0, apiResponse_1.sendError)(res, 'Invalid date format. Use YYYY-MM-DD', 400);
            return;
        }
        try {
            const summary = await report_service_1.reportService.getDailyReport(reportDate, reportEndDate);
            audit_service_1.auditService.logAsync({
                actorId: req.user.userId,
                action: 'REPORT_GENERATED',
                entityType: 'REPORT',
                entityId: summary.date,
                before: null,
                after: summary,
                ...audit_service_1.auditService.extractRequestMeta(req),
            });
            (0, apiResponse_1.sendSuccess)(res, summary);
        }
        catch {
            (0, apiResponse_1.sendError)(res, 'Failed to generate report', 500);
        }
    }
    // like where we got the payments and then we should be able select a range 
    async getEnrollmentLedgerReport(req, res) {
        try {
            const ledger = await report_service_1.reportService.getEnrollmentLedger(req.params['enrollmentId']);
            (0, apiResponse_1.sendSuccess)(res, { ledger });
        }
        catch {
            (0, apiResponse_1.sendError)(res, 'Failed to fetch ledger report', 500);
        }
    }
    async getDashboardStats(req, res) {
        try {
            const today = new Date();
            const overview = await report_service_1.reportService.getDashboardOverview(today);
            (0, apiResponse_1.sendSuccess)(res, overview);
        }
        catch (err) {
            (0, apiResponse_1.sendError)(res, 'Failed to fetch dashboard stats', 500);
        }
    }
    async getPaymentDates(req, res) {
        try {
            const { year, month } = req.query;
            const y = year ? parseInt(year, 10) : new Date().getFullYear();
            const m = month ? parseInt(month, 10) : new Date().getMonth() + 1;
            if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
                (0, apiResponse_1.sendError)(res, 'Invalid year or month', 400);
                return;
            }
            const dates = await report_service_1.reportService.getPaymentDates(y, m);
            (0, apiResponse_1.sendSuccess)(res, { dates });
        }
        catch {
            (0, apiResponse_1.sendError)(res, 'Failed to fetch payment dates', 500);
        }
    }
    async sendNow(req, res) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const triggeredBy = req.user.userId;
            await (0, dailyReport_job_1.processDailyReport)(today, triggeredBy);
            (0, apiResponse_1.sendSuccess)(res, { sent: true, date: today }, 200, 'Daily report sent successfully');
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to send report';
            (0, apiResponse_1.sendError)(res, message, 500);
        }
    }
    async getEagleEye(req, res) {
        try {
            const report = await report_service_1.reportService.getEagleEye();
            (0, apiResponse_1.sendSuccess)(res, report);
        }
        catch (err) {
            (0, apiResponse_1.sendError)(res, 'Failed to generate Eagle-Eye report', 500);
        }
    }
}
exports.ReportController = ReportController;
exports.reportController = new ReportController();
//# sourceMappingURL=report.controller.js.map