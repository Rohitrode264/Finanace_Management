import { Router } from 'express';
import { receiptController } from '../controllers/receipt.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { permissionMiddleware } from '../middlewares/permission.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/:id', permissionMiddleware('VIEW_RECEIPT', 'RECEIPT'), (req, res) => receiptController.getReceipt(req, res));
router.get('/by-payment/:paymentId', permissionMiddleware('VIEW_RECEIPT', 'RECEIPT'), (req, res) => receiptController.getByPayment(req, res));
router.post('/authorize-print', permissionMiddleware('AUTHORIZE_RECEIPT_PRINT', 'RECEIPT'), (req, res) => receiptController.authorizePrint(req, res));

export default router;
