import { LedgerRepository } from '../repositories/ledger.repository';
import { EnrollmentRepository } from '../repositories/enrollment.repository';
import { ClientSession, Types } from 'mongoose';
import { LedgerReferenceType } from '../models/LedgerEntry.model';

const ledgerRepo = new LedgerRepository();
const enrollmentRepo = new EnrollmentRepository();

export class LedgerService {
    /**
     * Records a CREDIT entry (money received or fee reduction).
     * Called within a MongoDB session — always part of a larger transaction.
     */
    async recordCredit(params: {
        enrollmentId: string | Types.ObjectId;
        amount: number;
        referenceType: LedgerReferenceType;
        referenceId: string | Types.ObjectId;
        description: string;
        createdBy: string | Types.ObjectId;
        session: ClientSession;
    }): Promise<void> {
        await ledgerRepo.create(
            {
                enrollmentId: new Types.ObjectId(params.enrollmentId.toString()),
                type: 'CREDIT',
                amount: params.amount,
                referenceType: params.referenceType,
                referenceId: new Types.ObjectId(params.referenceId.toString()),
                description: params.description,
                createdBy: new Types.ObjectId(params.createdBy.toString()),
            },
            params.session
        );
    }

    /**
     * Records a DEBIT entry (fee reversal, concession debit, cancellation).
     */
    async recordDebit(params: {
        enrollmentId: string | Types.ObjectId;
        amount: number;
        referenceType: LedgerReferenceType;
        referenceId: string | Types.ObjectId;
        description: string;
        createdBy: string | Types.ObjectId;
        session: ClientSession;
    }): Promise<void> {
        await ledgerRepo.create(
            {
                enrollmentId: new Types.ObjectId(params.enrollmentId.toString()),
                type: 'DEBIT',
                amount: params.amount,
                referenceType: params.referenceType,
                referenceId: new Types.ObjectId(params.referenceId.toString()),
                description: params.description,
                createdBy: new Types.ObjectId(params.createdBy.toString()),
            },
            params.session
        );
    }

    /**
     * Computes current outstanding balance for an enrollment.
     * balance > 0 means student still owes money
     * balance <= 0 means fully paid or overpaid
     */
    async getBalance(enrollmentId: string | Types.ObjectId): Promise<number> {
        const enrollment = await enrollmentRepo.findById(enrollmentId);
        if (!enrollment) throw new Error('Enrollment not found');

        const ledgerBalance = await ledgerRepo.computeBalance(enrollmentId);
        // outstanding = totalFee + (debits - credits)
        // Since concession is recorded as a CREDIT, it will correctly reduce the totalFee.
        return enrollment.totalFee + ledgerBalance;
    }

    async getLedger(enrollmentId: string | Types.ObjectId) {
        return ledgerRepo.findByEnrollment(enrollmentId);
    }
}

export const ledgerService = new LedgerService();
