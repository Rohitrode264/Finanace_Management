import { AuditAction, IAuditLog } from '../models/AuditLog.model';
import { Request } from 'express';
import { Types } from 'mongoose';
export declare class AuditService {
    logAsync(params: {
        actorId: string | Types.ObjectId;
        action: AuditAction;
        entityType: string;
        entityId: string | Types.ObjectId;
        before?: Record<string, unknown> | null;
        after?: Record<string, unknown> | null;
        ipAddress: string;
        userAgent?: string;
    }): void;
    extractRequestMeta(req: Request): {
        ipAddress: string;
        userAgent: string;
    };
    getAuditTrail(entityType: string, entityId: string, limit?: number): Promise<IAuditLog[]>;
    getActorHistory(actorId: string, limit?: number): Promise<IAuditLog[]>;
    listAll(limit?: number): Promise<IAuditLog[]>;
}
export declare const auditService: AuditService;
//# sourceMappingURL=audit.service.d.ts.map