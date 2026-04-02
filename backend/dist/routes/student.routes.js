"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const student_controller_1 = require("../controllers/student.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permission_middleware_1 = require("../middlewares/permission.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/', (0, permission_middleware_1.permissionMiddleware)('VIEW_STUDENT', 'STUDENT'), (req, res) => student_controller_1.studentController.listStudents(req, res));
router.post('/', (0, permission_middleware_1.permissionMiddleware)('CREATE_STUDENT', 'STUDENT'), (req, res) => student_controller_1.studentController.createStudent(req, res));
router.get('/count', (0, permission_middleware_1.permissionMiddleware)('VIEW_STUDENT', 'STUDENT'), (req, res) => student_controller_1.studentController.getCount(req, res));
router.get('/generate-admission-id', (0, permission_middleware_1.permissionMiddleware)('CREATE_STUDENT', 'STUDENT'), (req, res) => student_controller_1.studentController.generateAdmissionId(req, res));
router.get('/:id', (0, permission_middleware_1.permissionMiddleware)('VIEW_STUDENT', 'STUDENT'), (req, res) => student_controller_1.studentController.getStudent(req, res));
router.get('/meta/schools', (0, permission_middleware_1.permissionMiddleware)('VIEW_STUDENT', 'STUDENT'), (req, res) => student_controller_1.studentController.getSchools(req, res));
router.patch('/:id/status', (0, permission_middleware_1.permissionMiddleware)('UPDATE_STUDENT', 'STUDENT'), (req, res) => student_controller_1.studentController.updateStatus(req, res));
exports.default = router;
//# sourceMappingURL=student.routes.js.map