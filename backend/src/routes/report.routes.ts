import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { permissionMiddleware } from '../middlewares/permission.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/daily', permissionMiddleware('VIEW_REPORT', 'REPORT'), (req, res) => reportController.getDailyReport(req, res));
router.get('/enrollment/:enrollmentId/ledger', permissionMiddleware('VIEW_REPORT', 'REPORT'), (req, res) => reportController.getEnrollmentLedgerReport(req, res));
router.get('/dashboard-stats', permissionMiddleware('VIEW_REPORT', 'REPORT'), (req, res) => reportController.getDashboardStats(req, res));
router.get('/payment-dates', permissionMiddleware('VIEW_REPORT', 'REPORT'), (req, res) => reportController.getPaymentDates(req, res));
router.post('/send-now', permissionMiddleware('VIEW_REPORT', 'REPORT'), (req, res) => reportController.sendNow(req, res));

export default router;
