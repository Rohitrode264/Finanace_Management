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
exports.concessionService = exports.ConcessionService = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enrollment_repository_1 = require("../repositories/enrollment.repository");
const ledger_service_1 = require("./ledger.service");
const audit_service_1 = require("./audit.service");
const enrollmentRepo = new enrollment_repository_1.EnrollmentRepository();
const ledgerSvc = new ledger_service_1.LedgerService();
class ConcessionService {
    /**
     * ──────────────────────────────────────────────────────────────────────────
     * CONCESSION ENGINE — Runs inside MongoDB transaction.
     *
     * Concession does NOT modify payment history.
     * Instead it:
     * 1. Computes the concession amount from type (PERCENTAGE or FLAT)
     * 2. Inserts a LedgerEntry CREDIT (fee reduction = credit on what student owes)
     * 3. Updates enrollment.netFee to reflect the concession
     * 4. Writes audit log
     * ──────────────────────────────────────────────────────────────────────────
     */
    async applyConcession(input) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            // Validate enrollment
            const enrollment = await enrollmentRepo.findById(input.enrollmentId, session);
            if (!enrollment)
                throw new Error('Enrollment not found');
            if (enrollment.status !== 'ONGOING') {
                throw new Error('Concession can only be applied to ONGOING enrollments');
            }
            if (enrollment.concessionType !== 'NONE') {
                throw new Error('Enrollment already has a concession applied. Contact admin to adjust.');
            }
            // Compute concession amount
            let concessionAmount;
            if (input.concessionType === 'PERCENTAGE') {
                if (input.concessionValue < 0 || input.concessionValue > 100) {
                    throw new Error('Percentage concession must be between 0 and 100');
                }
                concessionAmount = (enrollment.netFee * input.concessionValue) / 100;
            }
            else if (input.concessionType === 'FLAT') {
                if (input.concessionValue > enrollment.netFee) {
                    throw new Error('Flat concession cannot exceed net fee');
                }
                concessionAmount = input.concessionValue;
            }
            else {
                throw new Error('Invalid concession type');
            }
            concessionAmount = Math.round(concessionAmount * 100) / 100; // Round to 2dp
            const updatedNetFee = enrollment.netFee - concessionAmount;
            // Create a reference object for the concession (use enrollment ID as ref)
            // In a more advanced system, you'd have a Concession document as ref
            const referenceId = new mongoose_1.Types.ObjectId(input.enrollmentId);
            // Insert CREDIT ledger entry — concession reduces what the student owes
            await ledgerSvc.recordCredit({
                enrollmentId: input.enrollmentId,
                amount: concessionAmount,
                referenceType: 'CONCESSION',
                referenceId,
                description: `Concession applied: ${input.concessionType} of ${input.concessionValue}${input.concessionType === 'PERCENTAGE' ? '%' : '₹'}. Reason: ${input.reason}`,
                createdBy: input.approvedBy,
                session,
            });
            // Update enrollment netFee and concession fields
            await enrollmentRepo.updateNetFee(input.enrollmentId, updatedNetFee, input.concessionType, input.concessionValue, session);
            await session.commitTransaction();
            // Post-commit: fire-and-forget audit log
            audit_service_1.auditService.logAsync({
                actorId: input.approvedBy,
                action: 'CONCESSION_APPLIED',
                entityType: 'ENROLLMENT',
                entityId: input.enrollmentId,
                before: { netFee: enrollment.netFee, concessionType: 'NONE', concessionValue: 0 },
                after: {
                    netFee: updatedNetFee,
                    concessionType: input.concessionType,
                    concessionValue: input.concessionValue,
                    concessionAmount,
                },
                ipAddress: input.ipAddress,
                userAgent: input.userAgent,
            });
            return { concessionAmount, updatedNetFee };
        }
        catch (err) {
            await session.abortTransaction();
            throw err;
        }
        finally {
            session.endSession();
        }
    }
}
exports.ConcessionService = ConcessionService;
exports.concessionService = new ConcessionService();
//# sourceMappingURL=concession.service.js.map