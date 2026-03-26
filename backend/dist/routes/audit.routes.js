"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const audit_controller_1 = require("../controllers/audit.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permission_middleware_1 = require("../middlewares/permission.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/', (0, permission_middleware_1.permissionMiddleware)('VIEW_AUDIT_LOG', 'AUDIT_LOG'), audit_controller_1.auditController.listLogs.bind(audit_controller_1.auditController));
exports.default = router;
//# sourceMappingURL=audit.routes.js.map