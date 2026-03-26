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

    async listAll(limit = 100): Promise<IAuditLog[]> {
        return AuditLog.find({})
            .sort({ timestamp: -1 })
            .limit(limit)
            .populate('actorId', 'name email role') as unknown as Promise<IAuditLog[]>;
    }
}

export const auditService = new AuditService();
