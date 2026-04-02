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
        const ledgerBalance = await ledgerRepo.computeBalance(enrollmentId);
        // outstanding = totalFee + (debits - credits)
        // Since concession is recorded as a CREDIT, it will correctly reduce the totalFee.
        return enrollment.totalFee + ledgerBalance;
    }
    async getLedger(enrollmentId) {
        return ledgerRepo.findByEnrollment(enrollmentId);
    }
}
exports.LedgerService = LedgerService;
exports.ledgerService = new LedgerService();
//# sourceMappingURL=ledger.service.js.map