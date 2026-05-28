"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const print_controller_1 = require("../controllers/print.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Protect all print routes
router.use(auth_middleware_1.authMiddleware);
// POST requests because HTML content can be large
router.post('/silent', (req, res) => print_controller_1.printController.silentPrint(req, res));
router.post('/pdf', (req, res) => print_controller_1.printController.generatePdf(req, res));
exports.default = router;
//# sourceMappingURL=print.routes.js.map