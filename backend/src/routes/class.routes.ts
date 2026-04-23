import { Router } from 'express';
import { classController } from '../controllers/class.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { permissionMiddleware } from '../middlewares/permission.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/templates', permissionMiddleware('VIEW_CLASS', 'CLASS'), (req, res) => classController.listTemplates(req, res));
router.get('/sessions', permissionMiddleware('VIEW_CLASS', 'CLASS'), (req, res) => classController.listSessions(req, res));
router.get('/', permissionMiddleware('VIEW_CLASS', 'CLASS'), (req, res) => classController.getClassesByYear(req, res));
router.get('/:id', permissionMiddleware('VIEW_CLASS', 'CLASS'), (req, res) => classController.getClass(req, res));
router.post('/', permissionMiddleware('CREATE_CLASS', 'CLASS'), (req, res) => classController.createClass(req, res));
router.post('/templates', permissionMiddleware('CREATE_CLASS', 'CLASS'), (req, res) => classController.createTemplate(req, res));

export default router;

