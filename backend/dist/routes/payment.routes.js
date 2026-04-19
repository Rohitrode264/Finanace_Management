"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permission_middleware_1 = require("../middlewares/permission.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.post('/', (0, permission_middleware_1.permissionMiddleware)('CREATE_PAYMENT', 'PAYMENT'), (req, res) => payment_controller_1.paymentController.createPayment(req, res));
router.get('/:id', (0, permission_middleware_1.permissionMiddleware)('VIEW_PAYMENT', 'PAYMENT'), (req, res) => payment_controller_1.paymentController.getPayment(req, res));
router.post('/:id/cancel', (0, permission_middleware_1.permissionMiddleware)('CANCEL_PAYMENT', 'PAYMENT'), (req, res) => payment_controller_1.paymentController.cancelPayment(req, res));
router.delete('/:id/hard', (0, permission_middleware_1.permissionMiddleware)('DELETE_PAYMENT', 'PAYMENT'), (req, res) => payment_controller_1.paymentController.hardDeletePayment(req, res));
exports.default = router;
//# sourceMappingURL=payment.routes.js.map