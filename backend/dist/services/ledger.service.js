"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ledgerService = exports.LedgerService = void 0;
const ledger_repository_1 = require("../repositories/ledger.repository");
const enrollment_repository_1 = require("../repositories/enrollment.repository");
const mongoose_1 = require("mongoose");
const ledgerRepo = new ledger_repository_1.LedgerRepository();
const enrollmentRepo = new enrollment_repository_1.EnrollmentRepository();
class LedgerService {
    /**
     * Records a CREDIT entry (money received or fee reduction).
     * Called within a MongoDB session — always part of a larger transaction.
     */
    async recordCredit(params) {
        await ledgerRepo.create({
            enrollmentId: new mongoose_1.Types.ObjectId(params.enrollmentId.toString()),
            type: 'CREDIT',
            amount: params.amount,
            referenceType: params.referenceType,
            referenceId: new mongoose_1.Types.ObjectId(params.referenceId.toString()),
            description: params.description,
            createdBy: new mongoose_1.Types.ObjectId(params.createdBy.toString()),
        }, params.session);
    }
    /**
     * Records a DEBIT entry (fee reversal, concession debit, cancellation).
     */
    async recordDebit(params) {
        await ledgerRepo.create({
            enrollmentId: new mongoose_1.Types.ObjectId(params.enrollmentId.toString()),
            type: 'DEBIT',
            amount: params.amount,
            referenceType: params.referenceType,
            referenceId: new mongoose_1.Types.ObjectId(params.referenceId.toString()),
            description: params.description,
            createdBy: new mongoose_1.Types.ObjectId(params.createdBy.toString()),
        }, params.session);
    }
    /**
     * Computes current outstanding balance for an enrollment.
     * balance > 0 means student still owes money
     * balance <= 0 means fully paid or overpaid
     */
    async getBalance(enrollmentId) {
        const enrollment = await enrollmentRepo.findById(enrollmentId);
        if (!enrollment)
            throw new Error('Enrollment not found');
        // Start with netFee (what student owes)
        // Subtract all CREDIT entries (payments received, concessions granted)
        // Add back all DEBIT entries (reversals, cancellations)
        const ledgerBalance = await ledgerRepo.computeBalance(enrollmentId);
        // balance = netFee - credits + debits (already computed in aggregate)
        // The aggregate returns debits - credits, so:
        // outstanding = netFee + (debits - credits combined negative = money received)
        // Simpler: outstanding = netFee - total_credits + total_debits_from_reversals
        // LedgerRepository.computeBalance returns: debits - credits
        // So: outstanding = netFee + (debits - credits)
        // BUT: concession CREDIT reduces netFee separately
        // So: outstanding = netFee - payment_credits + cancellation_debits
        return enrollment.netFee + ledgerBalance;
    }
    async getLedger(enrollmentId) {
        return ledgerRepo.findByEnrollment(enrollmentId);
    }
}
exports.LedgerService = LedgerService;
exports.ledgerService = new LedgerService();
//# sourceMappingURL=ledger.service.js.map