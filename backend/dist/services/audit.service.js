"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = exports.AuditService = void 0;
const AuditLog_model_1 = require("../models/AuditLog.model");
const mongoose_1 = require("mongoose");
class AuditService {
    logAsync(params) {
        void AuditLog_model_1.AuditLog.create({
            actorId: new mongoose_1.Types.ObjectId(params.actorId.toString()),
            action: params.action,
            entityType: params.entityType.toUpperCase(),
            entityId: params.entityId,
            before: params.before ?? null,
            after: params.after ?? null,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent ?? '',
            timestamp: new Date(),
        }).catch((err) => {
            console.error('⚠️  AuditLog write failed (non-critical):', err);
        });
    }
    extractRequestMeta(req) {
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ??
            req.socket.remoteAddress ??
            'unknown';
        const userAgent = req.headers['user-agent'] ?? '';
        return { ipAddress: ip, userAgent };
    }
    async getAuditTrail(entityType, entityId, limit = 50) {
        return AuditLog_model_1.AuditLog.find({
            entityType: entityType.toUpperCase(),
            entityId,
        })
            .sort({ timestamp: -1 })
            .limit(limit);
    }
    async getActorHistory(actorId, limit = 50) {
        return AuditLog_model_1.AuditLog.find({ actorId: new mongoose_1.Types.ObjectId(actorId) })
            .sort({ timestamp: -1 })
            .limit(limit);
    }
    async listAll(params) {
        const { actorId, action, entityType, startDate, endDate, page = 1, limit = 50 } = params;
        const query = {};
        if (actorId)
            query.actorId = new mongoose_1.Types.ObjectId(actorId);
        if (action)
            query.action = action;
        if (entityType)
            query.entityType = entityType.toUpperCase();
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
            AuditLog_model_1.AuditLog.find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .populate('actorId', 'name email role')
                .lean(),
            AuditLog_model_1.AuditLog.countDocuments(query)
        ]);
        return { logs: logs, total };
    }
}
exports.AuditService = AuditService;
exports.auditService = new AuditService();
//# sourceMappingURL=audit.service.js.map