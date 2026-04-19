"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const enrollment_controller_1 = require("../controllers/enrollment.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permission_middleware_1 = require("../middlewares/permission.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.post('/', (0, permission_middleware_1.permissionMiddleware)('CREATE_ENROLLMENT', 'ENROLLMENT'), (req, res) => enrollment_controller_1.enrollmentController.createEnrollment(req, res));
router.get('/', (0, permission_middleware_1.permissionMiddleware)('VIEW_ENROLLMENT', 'ENROLLMENT'), (req, res) => enrollment_controller_1.enrollmentController.getAllEnrollments(req, res));
router.get('/student/:studentId', (0, permission_middleware_1.permissionMiddleware)('VIEW_ENROLLMENT', 'ENROLLMENT'), (req, res) => enrollment_controller_1.enrollmentController.getEnrollmentsByStudent(req, res));
router.get('/:id', (0, permission_middleware_1.permissionMiddleware)('VIEW_ENROLLMENT', 'ENROLLMENT'), (req, res) => enrollment_controller_1.enrollmentController.getEnrollment(req, res));
router.post('/:id/concession', (0, permission_middleware_1.permissionMiddleware)('APPLY_CONCESSION', 'CONCESSION'), (req, res) => enrollment_controller_1.enrollmentController.applyConcession(req, res));
router.get('/:id/ledger', (0, permission_middleware_1.permissionMiddleware)('VIEW_ENROLLMENT', 'ENROLLMENT'), (req, res) => enrollment_controller_1.enrollmentController.getEnrollmentLedger(req, res));
router.post('/:id/transfer', (0, permission_middleware_1.permissionMiddleware)('TRANSFER_ENROLLMENT', 'ENROLLMENT'), (req, res) => enrollment_controller_1.enrollmentController.transferEnrollment(req, res));
exports.default = router;
//# sourceMappingURL=enrollment.routes.js.map