import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { permissionMiddleware } from '../middlewares/permission.middleware';

const router = Router();

router.get('/cet/programs', authMiddleware, settingsController.getCETPrograms);
router.put('/cet/programs', authMiddleware, permissionMiddleware('MANAGE_CET_SETTINGS', 'CET_SETTINGS'), settingsController.updateCETPrograms);

router.get('/:key', authMiddleware, settingsController.getSetting);
router.post('/', authMiddleware, permissionMiddleware('UPDATE_SETTING', 'SETTING'), settingsController.updateSetting);

export default router;
