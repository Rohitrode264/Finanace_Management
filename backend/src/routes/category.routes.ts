import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { permissionMiddleware } from '../middlewares/permission.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', categoryController.listCategories);
router.post('/', permissionMiddleware('CREATE_CLASS', 'CLASS'), categoryController.createCategory);
router.patch('/:id/toggle-status', permissionMiddleware('CREATE_CLASS', 'CLASS'), categoryController.toggleCategoryStatus);

export default router;
