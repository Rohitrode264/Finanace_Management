import { ClientSession, Types } from 'mongoose';
import { LedgerReferenceType } from '../models/LedgerEntry.model';
export declare class LedgerService {
    /**
     * Records a CREDIT entry (money received or fee reduction).
     * Called within a MongoDB session — always part of a larger transaction.
     */
    recordCredit(params: {
        enrollmentId: string | Types.ObjectId;
        amount: number;
        referenceType: LedgerReferenceType;
        referenceId: string | Types.ObjectId;
        description: string;
        createdBy: string | Types.ObjectId;
        session: ClientSession;
    }): Promise<void>;
    /**
     * Records a DEBIT entry (fee reversal, concession debit, cancellation).
     */
    recordDebit(params: {
        enrollmentId: string | Types.ObjectId;
        amount: number;
        referenceType: LedgerReferenceType;
        referenceId: string | Types.ObjectId;
        description: string;
        createdBy: string | Types.ObjectId;
        session: ClientSession;
    }): Promise<void>;
    /**
     * Computes current outstanding balance for an enrollment.
     * balance > 0 means student still owes money
     * balance <= 0 means fully paid or overpaid
     */
    getBalance(enrollmentId: string | Types.ObjectId): Promise<number>;
    getLedger(enrollmentId: string | Types.ObjectId): Promise<import("../models/LedgerEntry.model").ILedgerEntry[]>;
}
export declare const ledgerService: LedgerService;
//# sourceMappingURL=ledger.service.d.ts.map