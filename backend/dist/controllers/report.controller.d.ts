import { Request, Response } from 'express';
export declare class ReportController {
    getDailyReport(req: Request, res: Response): Promise<void>;
    getEnrollmentLedgerReport(req: Request, res: Response): Promise<void>;
    getDashboardStats(req: Request, res: Response): Promise<void>;
    getPaymentDates(req: Request, res: Response): Promise<void>;
    sendNow(req: Request, res: Response): Promise<void>;
    getEagleEye(req: Request, res: Response): Promise<void>;
}
export declare const reportController: ReportController;
//# sourceMappingURL=report.controller.d.ts.map