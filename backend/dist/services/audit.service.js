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
    async listAll(limit = 100) {
        return AuditLog_model_1.AuditLog.find({})
            .sort({ timestamp: -1 })
            .limit(limit)
            .populate('actorId', 'name email role');
    }
}
exports.AuditService = AuditService;
exports.auditService = new AuditService();
//# sourceMappingURL=audit.service.js.map