"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("../controllers/category.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permission_middleware_1 = require("../middlewares/permission.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/', category_controller_1.categoryController.listCategories);
router.post('/', (0, permission_middleware_1.permissionMiddleware)('CREATE_CLASS', 'CLASS'), category_controller_1.categoryController.createCategory);
router.patch('/:id/toggle-status', (0, permission_middleware_1.permissionMiddleware)('CREATE_CLASS', 'CLASS'), category_controller_1.categoryController.toggleCategoryStatus);
exports.default = router;
//# sourceMappingURL=category.routes.js.map