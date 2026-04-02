"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rbac_controller_1 = require("../controllers/rbac.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permission_middleware_1 = require("../middlewares/permission.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// ── User Management ───────────────────────────────────────────────────────────
router.get('/users', (0, permission_middleware_1.permissionMiddleware)(['MANAGE_USERS', 'CREATE_USER'], 'USER'), (req, res) => rbac_controller_1.rbacController.listUsers(req, res));
router.post('/users', (0, permission_middleware_1.permissionMiddleware)(['MANAGE_USERS', 'CREATE_USER'], 'USER'), (req, res) => rbac_controller_1.rbacController.createUser(req, res));
router.patch('/users/:id/status', (0, permission_middleware_1.permissionMiddleware)('MANAGE_USERS', 'USER'), (req, res) => rbac_controller_1.rbacController.updateUserStatus(req, res));
router.patch('/users/:id/fingerprint', (0, permission_middleware_1.permissionMiddleware)('MANAGE_USERS', 'USER'), (req, res) => rbac_controller_1.rbacController.updateUserFingerprint(req, res));
// ── Role & Permission Management ──────────────────────────────────────────────
router.get('/roles', (0, permission_middleware_1.permissionMiddleware)('MANAGE_ROLES', 'ROLE'), (req, res) => rbac_controller_1.rbacController.listRoles(req, res));
router.post('/roles', (0, permission_middleware_1.permissionMiddleware)('MANAGE_ROLES', 'ROLE'), (req, res) => rbac_controller_1.rbacController.createRole(req, res));
router.get('/roles/:id/permissions', (0, permission_middleware_1.permissionMiddleware)('MANAGE_ROLES', 'ROLE'), (req, res) => rbac_controller_1.rbacController.getRolePermissions(req, res));
router.post('/roles/:id/permissions', (0, permission_middleware_1.permissionMiddleware)('MANAGE_PERMISSIONS', 'PERMISSION'), (req, res) => rbac_controller_1.rbacController.grantPermission(req, res));
router.delete('/roles/:id/permissions/:permId', (0, permission_middleware_1.permissionMiddleware)('MANAGE_PERMISSIONS', 'PERMISSION'), (req, res) => rbac_controller_1.rbacController.revokePermission(req, res));
router.get('/permissions', (0, permission_middleware_1.permissionMiddleware)('MANAGE_PERMISSIONS', 'PERMISSION'), (req, res) => rbac_controller_1.rbacController.listPermissions(req, res));
exports.default = router;
//# sourceMappingURL=rbac.routes.js.map