import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { permissionMiddleware } from '../middlewares/permission.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', permissionMiddleware('CREATE_PAYMENT', 'PAYMENT'), (req, res) => paymentController.createPayment(req, res));
router.get('/:id', permissionMiddleware('VIEW_PAYMENT', 'PAYMENT'), (req, res) => paymentController.getPayment(req, res));
router.post('/:id/cancel', permissionMiddleware('CANCEL_PAYMENT', 'PAYMENT'), (req, res) => paymentController.cancelPayment(req, res));

export default router;
