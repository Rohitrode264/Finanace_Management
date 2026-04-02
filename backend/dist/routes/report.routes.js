"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = require("../controllers/report.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permission_middleware_1 = require("../middlewares/permission.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/daily', (0, permission_middleware_1.permissionMiddleware)('VIEW_REPORT', 'REPORT'), (req, res) => report_controller_1.reportController.getDailyReport(req, res));
router.get('/enrollment/:enrollmentId/ledger', (0, permission_middleware_1.permissionMiddleware)('VIEW_REPORT', 'REPORT'), (req, res) => report_controller_1.reportController.getEnrollmentLedgerReport(req, res));
router.get('/dashboard-stats', (0, permission_middleware_1.permissionMiddleware)('VIEW_REPORT', 'REPORT'), (req, res) => report_controller_1.reportController.getDashboardStats(req, res));
router.get('/payment-dates', (0, permission_middleware_1.permissionMiddleware)('VIEW_REPORT', 'REPORT'), (req, res) => report_controller_1.reportController.getPaymentDates(req, res));
router.get('/eagle-eye', (0, permission_middleware_1.permissionMiddleware)('VIEW_REPORT', 'REPORT'), (req, res) => report_controller_1.reportController.getEagleEye(req, res));
router.post('/send-now', (0, permission_middleware_1.permissionMiddleware)('VIEW_REPORT', 'REPORT'), (req, res) => report_controller_1.reportController.sendNow(req, res));
exports.default = router;
//# sourceMappingURL=report.routes.js.map