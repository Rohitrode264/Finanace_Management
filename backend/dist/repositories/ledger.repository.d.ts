import { ClientSession, Types } from 'mongoose';
import { ILedgerEntry } from '../models/LedgerEntry.model';
export declare class LedgerRepository {
    create(data: Partial<ILedgerEntry>, session: ClientSession): Promise<ILedgerEntry>;
    findByEnrollment(enrollmentId: string | Types.ObjectId): Promise<ILedgerEntry[]>;
    computeBalance(enrollmentId: string | Types.ObjectId): Promise<number>;
    findByDateRange(from: Date, to: Date): Promise<ILedgerEntry[]>;
    findByReference(referenceId: string | Types.ObjectId, referenceType: ILedgerEntry['referenceType']): Promise<ILedgerEntry | null>;
    /**
     * ADMIN ONLY: Hard delete ledger entries by reference.
     * Bypasses Mongoose middleware to allow cleanup of "miss entries".
     */
    hardDeleteByReference(referenceId: string | Types.ObjectId, referenceType: ILedgerEntry['referenceType'], session?: ClientSession): Promise<void>;
}
//# sourceMappingURL=ledger.repository.d.ts.map