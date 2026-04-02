"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/login', (req, res) => auth_controller_1.authController.login(req, res));
router.post('/signup-admin', (req, res) => auth_controller_1.authController.signupAdmin(req, res));
router.patch('/register-fingerprint', auth_middleware_1.authMiddleware, (req, res) => auth_controller_1.authController.registerFingerprint(req, res));
// Password recovery
router.post('/forgot-password', (req, res) => auth_controller_1.authController.forgotPassword(req, res));
router.post('/reset-password', (req, res) => auth_controller_1.authController.resetPassword(req, res));
router.patch('/change-password', auth_middleware_1.authMiddleware, (req, res) => auth_controller_1.authController.changePassword(req, res));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map