import { Router } from 'express';
import { printController } from '../controllers/print.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Protect all print routes
router.use(authMiddleware);

// POST requests because HTML content can be large
router.post('/silent', (req, res) => printController.silentPrint(req, res));
router.post('/pdf', (req, res) => printController.generatePdf(req, res));

export default router;
