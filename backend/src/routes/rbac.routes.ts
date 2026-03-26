import { Router } from 'express';
import { rbacController } from '../controllers/rbac.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { permissionMiddleware } from '../middlewares/permission.middleware';

const router = Router();

router.use(authMiddleware);

// ── User Management ───────────────────────────────────────────────────────────
router.get('/users', permissionMiddleware('MANAGE_USERS', 'USER'), (req, res) => rbacController.listUsers(req, res));
router.post('/users', permissionMiddleware('MANAGE_USERS', 'USER'), (req, res) => rbacController.createUser(req, res));
router.patch('/users/:id/status', permissionMiddleware('MANAGE_USERS', 'USER'), (req, res) => rbacController.updateUserStatus(req, res));
router.patch('/users/:id/fingerprint', permissionMiddleware('MANAGE_USERS', 'USER'), (req, res) => rbacController.updateUserFingerprint(req, res));

// ── Role & Permission Management ──────────────────────────────────────────────
router.get('/roles', permissionMiddleware('MANAGE_ROLES', 'ROLE'), (req, res) => rbacController.listRoles(req, res));
router.post('/roles', permissionMiddleware('MANAGE_ROLES', 'ROLE'), (req, res) => rbacController.createRole(req, res));
router.get('/roles/:id/permissions', permissionMiddleware('MANAGE_ROLES', 'ROLE'), (req, res) => rbacController.getRolePermissions(req, res));
router.post('/roles/:id/permissions', permissionMiddleware('MANAGE_PERMISSIONS', 'PERMISSION'), (req, res) => rbacController.grantPermission(req, res));
router.get('/permissions', permissionMiddleware('MANAGE_PERMISSIONS', 'PERMISSION'), (req, res) => rbacController.listPermissions(req, res));

export default router;

