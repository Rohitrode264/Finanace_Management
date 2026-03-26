import { Request, Response } from 'express';
import { SystemSetting } from '../models/SystemSetting.model';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { z } from 'zod';
import { auditService } from '../services/audit.service';

const updateSettingSchema = z.object({
    key: z.string(),
    value: z.any(),
});

export class SettingsController {
    async getSetting(req: Request, res: Response): Promise<void> {
        try {
            const { key } = req.params;
            const setting = await SystemSetting.findOne({ key });
            sendSuccess(res, setting);
        } catch {
            sendError(res, 'Failed to fetch setting', 500);
        }
    }

    async updateSetting(req: Request, res: Response): Promise<void> {
        const parsed = updateSettingSchema.safeParse(req.body);
        if (!parsed.success) {
            sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }

        try {
            const { key, value } = parsed.data;
            const before = await SystemSetting.findOne({ key });
            
            const setting = await SystemSetting.findOneAndUpdate(
                { key },
                { value, updatedBy: req.user!.userId },
                { upsert: true, new: true }
            );

            auditService.logAsync({
                actorId: req.user!.userId,
                action: 'SETTING_UPDATED',
                entityType: 'SETTING',
                entityId: key,
                before: before?.value ? { value: before.value } : null,
                after: { value },
                ipAddress: auditService.extractRequestMeta(req).ipAddress,
            });

            sendSuccess(res, setting, 200, 'Setting updated successfully');
        } catch (err) {
            sendError(res, 'Failed to update setting', 500);
        }
    }
}

export const settingsController = new SettingsController();
