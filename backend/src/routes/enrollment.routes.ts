import { Router } from 'express';
import { enrollmentController } from '../controllers/enrollment.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { permissionMiddleware } from '../middlewares/permission.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', permissionMiddleware('CREATE_ENROLLMENT', 'ENROLLMENT'), (req, res) => enrollmentController.createEnrollment(req, res));
router.get('/', permissionMiddleware('VIEW_ENROLLMENT', 'ENROLLMENT'), (req, res) => enrollmentController.getAllEnrollments(req, res));
router.get('/student/:studentId', permissionMiddleware('VIEW_ENROLLMENT', 'ENROLLMENT'), (req, res) => enrollmentController.getEnrollmentsByStudent(req, res));
router.get('/:id', permissionMiddleware('VIEW_ENROLLMENT', 'ENROLLMENT'), (req, res) => enrollmentController.getEnrollment(req, res));
router.post('/:id/concession', permissionMiddleware('APPLY_CONCESSION', 'CONCESSION'), (req, res) => enrollmentController.applyConcession(req, res));
router.get('/:id/ledger', permissionMiddleware('VIEW_ENROLLMENT', 'ENROLLMENT'), (req, res) => enrollmentController.getEnrollmentLedger(req, res));
router.post('/:id/transfer', permissionMiddleware('TRANSFER_ENROLLMENT', 'ENROLLMENT'), (req, res) => enrollmentController.transferEnrollment(req, res));

export default router;
