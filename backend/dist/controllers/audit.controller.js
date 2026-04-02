"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditController = exports.AuditController = void 0;
const audit_service_1 = require("../services/audit.service");
const apiResponse_1 = require("../utils/apiResponse");
class AuditController {
    async listLogs(req, res) {
        try {
            const { actorId, action, entityType, startDate, endDate, page, limit } = req.query;
            const logsData = await audit_service_1.auditService.listAll({
                actorId: actorId,
                action: action,
                entityType: entityType,
                startDate: startDate,
                endDate: endDate,
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 50
            });
            (0, apiResponse_1.sendSuccess)(res, logsData);
        }
        catch (err) {
            (0, apiResponse_1.sendError)(res, 'Failed to fetch audit logs', 500);
        }
    }
}
exports.AuditController = AuditController;
exports.auditController = new AuditController();
//# sourceMappingURL=audit.controller.js.map