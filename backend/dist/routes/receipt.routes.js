"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const receipt_controller_1 = require("../controllers/receipt.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permission_middleware_1 = require("../middlewares/permission.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/:id', (0, permission_middleware_1.permissionMiddleware)('VIEW_RECEIPT', 'RECEIPT'), (req, res) => receipt_controller_1.receiptController.getReceipt(req, res));
router.get('/by-payment/:paymentId', (0, permission_middleware_1.permissionMiddleware)('VIEW_RECEIPT', 'RECEIPT'), (req, res) => receipt_controller_1.receiptController.getByPayment(req, res));
router.post('/authorize-print', (0, permission_middleware_1.permissionMiddleware)('AUTHORIZE_RECEIPT_PRINT', 'RECEIPT'), (req, res) => receipt_controller_1.receiptController.authorizePrint(req, res));
exports.default = router;
//# sourceMappingURL=receipt.routes.js.map