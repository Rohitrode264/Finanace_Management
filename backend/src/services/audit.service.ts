import { AuditLog, AuditAction, IAuditLog } from '../models/AuditLog.model';
import { Request } from 'express';
import { Types } from 'mongoose';

export class AuditService {
    logAsync(params: {
        actorId: string | Types.ObjectId;
        action: AuditAction;
        entityType: string;
        entityId: string | Types.ObjectId;
        before?: Record<string, unknown> | null;
        after?: Record<string, unknown> | null;
        ipAddress: string;
        userAgent?: string;
    }): void {
        void AuditLog.create({
            actorId: new Types.ObjectId(params.actorId.toString()),
            action: params.action,
            entityType: params.entityType.toUpperCase(),
            entityId: params.entityId,
            before: params.before ?? null,
            after: params.after ?? null,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent ?? '',
            timestamp: new Date(),
        }).catch((err: unknown) => {
            console.error('⚠️  AuditLog write failed (non-critical):', err);
        });
    }

    extractRequestMeta(req: Request): { ipAddress: string; userAgent: string } {
        const ip =
            (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
            req.socket.remoteAddress ??
            'unknown';
        const userAgent = req.headers['user-agent'] ?? '';
        return { ipAddress: ip, userAgent };
    }

    async getAuditTrail(
        entityType: string,
        entityId: string,
        limit = 50
    ): Promise<IAuditLog[]> {
        return AuditLog.find({
            entityType: entityType.toUpperCase(),
            entityId,
        })
            .sort({ timestamp: -1 })
            .limit(limit) as unknown as Promise<IAuditLog[]>;
    }

    async getActorHistory(actorId: string, limit = 50): Promise<IAuditLog[]> {
        return AuditLog.find({ actorId: new Types.ObjectId(actorId) })
            .sort({ timestamp: -1 })
            .limit(limit) as unknown as Promise<IAuditLog[]>;
    }

    async listAll(params: {
        actorId?: string;
        action?: string;
        entityType?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }): Promise<{ logs: IAuditLog[]; total: number }> {
        const { actorId, action, entityType, startDate, endDate, page = 1, limit = 50 } = params;
        const query: any = {};

        if (actorId) query.actorId = new Types.ObjectId(actorId);
        if (action) query.action = action;
        if (entityType) query.entityType = entityType.toUpperCase();

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                query.timestamp.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.timestamp.$lte = end;
            }
        }

        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .populate('actorId', 'name email role')
                .lean(),
            AuditLog.countDocuments(query)
        ]);

        return { logs: logs as unknown as IAuditLog[], total };
    }
}

export const auditService = new AuditService();
