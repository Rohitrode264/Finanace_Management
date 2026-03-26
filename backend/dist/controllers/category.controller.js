"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryController = exports.CategoryController = void 0;
const zod_1 = require("zod");
const ProgramCategory_model_1 = require("../models/ProgramCategory.model");
const apiResponse_1 = require("../utils/apiResponse");
const audit_service_1 = require("../services/audit.service");
const categorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    description: zod_1.z.string().optional().default(''),
});
class CategoryController {
    // PUBLIC / AUTHED
    async listCategories(req, res) {
        try {
            const isActive = req.query.all ? {} : { isActive: true };
            const categories = await ProgramCategory_model_1.ProgramCategory.find(isActive).sort({ name: 1 });
            (0, apiResponse_1.sendSuccess)(res, categories);
        }
        catch (err) {
            (0, apiResponse_1.sendError)(res, 'Failed to list categories', 500);
        }
    }
    // ADMIN
    async createCategory(req, res) {
        const parsed = categorySchema.safeParse(req.body);
        if (!parsed.success) {
            (0, apiResponse_1.sendError)(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }
        try {
            const existing = await ProgramCategory_model_1.ProgramCategory.findOne({ name: { $regex: new RegExp(`^${parsed.data.name}$`, 'i') } });
            if (existing) {
                (0, apiResponse_1.sendError)(res, 'Category already exists', 400);
                return;
            }
            const category = await ProgramCategory_model_1.ProgramCategory.create({
                ...parsed.data,
                createdBy: req.user.userId,
            });
            audit_service_1.auditService.logAsync({
                actorId: req.user.userId,
                action: 'SETTING_UPDATED',
                entityType: 'CATEGORY',
                entityId: category._id.toString(),
                before: null,
                after: { name: category.name },
                ipAddress: audit_service_1.auditService.extractRequestMeta(req).ipAddress,
            });
            (0, apiResponse_1.sendSuccess)(res, category, 201, 'Category created');
        }
        catch (err) {
            (0, apiResponse_1.sendError)(res, 'Failed to create category', 500);
        }
    }
    async toggleCategoryStatus(req, res) {
        try {
            const { id } = req.params;
            const category = await ProgramCategory_model_1.ProgramCategory.findById(id);
            if (!category) {
                (0, apiResponse_1.sendError)(res, 'Category not found', 404);
                return;
            }
            category.isActive = !category.isActive;
            await category.save();
            (0, apiResponse_1.sendSuccess)(res, category, 200, `Category ${category.isActive ? 'activated' : 'deactivated'}`);
        }
        catch (err) {
            (0, apiResponse_1.sendError)(res, 'Failed to toggle category status', 500);
        }
    }
}
exports.CategoryController = CategoryController;
exports.categoryController = new CategoryController();
//# sourceMappingURL=category.controller.js.map