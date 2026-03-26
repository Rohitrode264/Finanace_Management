"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.receiptController = exports.ReceiptController = void 0;
const report_service_1 = require("../services/report.service");
const audit_service_1 = require("../services/audit.service");
const apiResponse_1 = require("../utils/apiResponse");
const zod_1 = require("zod");
const authorizePrintSchema = zod_1.z.object({
    receiptId: zod_1.z.string().length(24),
    fingerprintToken: zod_1.z.string().min(8),
});
class ReceiptController {
    async getReceipt(req, res) {
        try {
            const { ReceiptRepository } = await Promise.resolve().then(() => __importStar(require('../repositories/receipt.repository')));
            const repo = new ReceiptRepository();
            const receipt = await repo.findById(req.params['id']);
            if (!receipt) {
                (0, apiResponse_1.sendError)(res, 'Receipt not found', 404);
                return;
            }
            (0, apiResponse_1.sendSuccess)(res, receipt);
        }
        catch {
            (0, apiResponse_1.sendError)(res, 'Failed to fetch receipt', 500);
        }
    }
    async getByPayment(req, res) {
        try {
            const { ReceiptRepository } = await Promise.resolve().then(() => __importStar(require('../repositories/receipt.repository')));
            const repo = new ReceiptRepository();
            const receipt = await repo.findByPaymentId(req.params['paymentId']);
            if (!receipt) {
                (0, apiResponse_1.sendError)(res, 'Receipt not found for this payment', 404);
                return;
            }
            (0, apiResponse_1.sendSuccess)(res, receipt);
        }
        catch {
            (0, apiResponse_1.sendError)(res, 'Failed to fetch receipt by payment', 500);
        }
    }
    async authorizePrint(req, res) {
        const parsed = authorizePrintSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, apiResponse_1.sendError)(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }
        try {
            const meta = audit_service_1.auditService.extractRequestMeta(req);
            const result = await report_service_1.reportService.authorizeReceiptPrint({
                ...parsed.data,
                authorizedBy: req.user.userId,
                ...meta,
            });
            (0, apiResponse_1.sendSuccess)(res, result, 200, 'Receipt print authorized');
        }
        catch (err) {
            (0, apiResponse_1.sendError)(res, err instanceof Error ? err.message : 'Authorization failed', 403, 'FINGERPRINT_FAILED');
        }
    }
}
exports.ReceiptController = ReceiptController;
exports.receiptController = new ReceiptController();
//# sourceMappingURL=receipt.controller.js.map