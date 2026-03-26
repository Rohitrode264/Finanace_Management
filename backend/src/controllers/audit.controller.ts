import { Request, Response } from 'express';
import { auditService } from '../services/audit.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class AuditController {
    async listLogs(req: Request, res: Response): Promise<void> {
        try {
            const {
                actorId,
                action,
                entityType,
                startDate,
                endDate,
                page,
                limit
            } = req.query;

            const logsData = await auditService.listAll({
                actorId: actorId as string,
                action: action as string,
                entityType: entityType as string,
                startDate: startDate as string,
                endDate: endDate as string,
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 50
            });

            sendSuccess(res, logsData);
        } catch (err) {
            sendError(res, 'Failed to fetch audit logs', 500);
        }
    }
}

export const auditController = new AuditController();
