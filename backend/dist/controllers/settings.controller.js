"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsController = exports.SettingsController = void 0;
const SystemSetting_model_1 = require("../models/SystemSetting.model");
const apiResponse_1 = require("../utils/apiResponse");
const zod_1 = require("zod");
const audit_service_1 = require("../services/audit.service");
const updateSettingSchema = zod_1.z.object({
    key: zod_1.z.string(),
    value: zod_1.z.any(),
});
class SettingsController {
    async getSetting(req, res) {
        try {
            const { key } = req.params;
            const setting = await SystemSetting_model_1.SystemSetting.findOne({ key });
            (0, apiResponse_1.sendSuccess)(res, setting);
        }
        catch {
            (0, apiResponse_1.sendError)(res, 'Failed to fetch setting', 500);
        }
    }
    async updateSetting(req, res) {
        const parsed = updateSettingSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, apiResponse_1.sendError)(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }
        try {
            const { key, value } = parsed.data;
            const before = await SystemSetting_model_1.SystemSetting.findOne({ key });
            const setting = await SystemSetting_model_1.SystemSetting.findOneAndUpdate({ key }, { value, updatedBy: req.user.userId }, { upsert: true, new: true });
            audit_service_1.auditService.logAsync({
                actorId: req.user.userId,
                action: 'SETTING_UPDATED',
                entityType: 'SETTING',
                entityId: key,
                before: before?.value ? { value: before.value } : null,
                after: { value },
                ipAddress: audit_service_1.auditService.extractRequestMeta(req).ipAddress,
            });
            (0, apiResponse_1.sendSuccess)(res, setting, 200, 'Setting updated successfully');
        }
        catch (err) {
            (0, apiResponse_1.sendError)(res, 'Failed to update setting', 500);
        }
    }
}
exports.SettingsController = SettingsController;
exports.settingsController = new SettingsController();
//# sourceMappingURL=settings.controller.js.map