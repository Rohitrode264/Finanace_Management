"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("../controllers/settings.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permission_middleware_1 = require("../middlewares/permission.middleware");
const router = (0, express_1.Router)();
router.get('/:key', auth_middleware_1.authMiddleware, settings_controller_1.settingsController.getSetting);
router.post('/', auth_middleware_1.authMiddleware, (0, permission_middleware_1.permissionMiddleware)('UPDATE_SETTING', 'SETTING'), settings_controller_1.settingsController.updateSetting);
exports.default = router;
//# sourceMappingURL=settings.routes.js.map