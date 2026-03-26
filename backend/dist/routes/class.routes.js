"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const class_controller_1 = require("../controllers/class.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permission_middleware_1 = require("../middlewares/permission.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/templates', (0, permission_middleware_1.permissionMiddleware)('VIEW_CLASS', 'CLASS'), (req, res) => class_controller_1.classController.listTemplates(req, res));
router.get('/', (0, permission_middleware_1.permissionMiddleware)('VIEW_CLASS', 'CLASS'), (req, res) => class_controller_1.classController.getClassesByYear(req, res));
router.get('/:id', (0, permission_middleware_1.permissionMiddleware)('VIEW_CLASS', 'CLASS'), (req, res) => class_controller_1.classController.getClass(req, res));
router.post('/', (0, permission_middleware_1.permissionMiddleware)('CREATE_CLASS', 'CLASS'), (req, res) => class_controller_1.classController.createClass(req, res));
router.post('/templates', (0, permission_middleware_1.permissionMiddleware)('CREATE_CLASS', 'CLASS'), (req, res) => class_controller_1.classController.createTemplate(req, res));
exports.default = router;
//# sourceMappingURL=class.routes.js.map