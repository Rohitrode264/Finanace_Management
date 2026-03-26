import { Router } from 'express';
import { studentController } from '../controllers/student.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { permissionMiddleware } from '../middlewares/permission.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', permissionMiddleware('VIEW_STUDENT', 'STUDENT'), (req, res) => studentController.listStudents(req, res));
router.post('/', permissionMiddleware('CREATE_STUDENT', 'STUDENT'), (req, res) => studentController.createStudent(req, res));
router.get('/count', permissionMiddleware('VIEW_STUDENT', 'STUDENT'), (req, res) => studentController.getCount(req, res));
router.get('/generate-admission-id', permissionMiddleware('CREATE_STUDENT', 'STUDENT'), (req, res) => studentController.generateAdmissionId(req, res));
router.get('/:id', permissionMiddleware('VIEW_STUDENT', 'STUDENT'), (req, res) => studentController.getStudent(req, res));
router.patch('/:id/status', permissionMiddleware('UPDATE_STUDENT', 'STUDENT'), (req, res) => studentController.updateStatus(req, res));

export default router;
