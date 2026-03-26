

import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', (req, res) => authController.login(req, res));
router.post('/signup-admin', (req, res) => authController.signupAdmin(req, res));
router.patch('/register-fingerprint', authMiddleware, (req, res) => authController.registerFingerprint(req, res));

// Password recovery
router.post('/forgot-password', (req, res) => authController.forgotPassword(req, res));
router.post('/reset-password', (req, res) => authController.resetPassword(req, res));
router.patch('/change-password', authMiddleware, (req, res) => authController.changePassword(req, res));

export default router;
