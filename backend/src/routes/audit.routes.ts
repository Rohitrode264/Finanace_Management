import { Router } from 'express';
import { auditController } from '../controllers/audit.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { permissionMiddleware } from '../middlewares/permission.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', permissionMiddleware('VIEW_AUDIT_LOG', 'AUDIT_LOG'), auditController.listLogs.bind(auditController));

export default router;
