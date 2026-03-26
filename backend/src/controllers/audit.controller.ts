import { Request, Response } from 'express';
import { auditService } from '../services/audit.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class AuditController {
    async listLogs(req: Request, res: Response): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 100;
            const logs = await auditService.listAll(limit);
            sendSuccess(res, logs);
        } catch (err) {
            sendError(res, 'Failed to fetch audit logs', 500);
        }
    }
}

export const auditController = new AuditController();
