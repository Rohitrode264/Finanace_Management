import { ConcessionType } from '../models/Enrollment.model';
export interface ApplyConcessionInput {
    enrollmentId: string;
    concessionType: ConcessionType;
    concessionValue: number;
    reason: string;
    approvedBy: string;
    ipAddress: string;
    userAgent: string;
}
export declare class ConcessionService {
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
    applyConcession(input: ApplyConcessionInput): Promise<{
        concessionAmount: number;
        updatedNetFee: number;
    }>;
}
export declare const concessionService: ConcessionService;
//# sourceMappingURL=concession.service.d.ts.map