import { Request, Response } from 'express';
import { z } from 'zod';
import { ProgramCategory } from '../models/ProgramCategory.model';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { auditService } from '../services/audit.service';

const categorySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional().default(''),
});

export class CategoryController {
    // PUBLIC / AUTHED
    async listCategories(req: Request, res: Response): Promise<void> {
        try {
            const isActive = req.query.all ? {} : { isActive: true };
            const categories = await ProgramCategory.find(isActive).sort({ name: 1 });
            sendSuccess(res, categories);
        } catch (err) {
            sendError(res, 'Failed to list categories', 500);
        }
    }

    // ADMIN
    async createCategory(req: Request, res: Response): Promise<void> {
        const parsed = categorySchema.safeParse(req.body);
        if (!parsed.success) {
            sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }

        try {
            const existing = await ProgramCategory.findOne({ name: { $regex: new RegExp(`^${parsed.data.name}$`, 'i') } });
            if (existing) {
                sendError(res, 'Category already exists', 400);
                return;
            }

            const category = await ProgramCategory.create({
                ...parsed.data,
                createdBy: req.user!.userId,
            });

            auditService.logAsync({
                actorId: req.user!.userId,
                action: 'SETTING_UPDATED',
                entityType: 'CATEGORY',
                entityId: category._id.toString(),
                before: null,
                after: { name: category.name },
                ipAddress: auditService.extractRequestMeta(req).ipAddress,
            });

            sendSuccess(res, category, 201, 'Category created');
        } catch (err) {
            sendError(res, 'Failed to create category', 500);
        }
    }

    async toggleCategoryStatus(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const category = await ProgramCategory.findById(id);
            if (!category) {
                sendError(res, 'Category not found', 404);
                return;
            }

            category.isActive = !category.isActive;
            await category.save();

            sendSuccess(res, category, 200, `Category ${category.isActive ? 'activated' : 'deactivated'}`);
        } catch (err) {
            sendError(res, 'Failed to toggle category status', 500);
        }
    }
}

export const categoryController = new CategoryController();
