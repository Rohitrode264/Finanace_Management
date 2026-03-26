import mongoose, { Types } from 'mongoose';
import { EnrollmentRepository } from '../repositories/enrollment.repository';
import { LedgerService } from './ledger.service';
import { auditService } from './audit.service';
import { ConcessionType } from '../models/Enrollment.model';

const enrollmentRepo = new EnrollmentRepository();
const ledgerSvc = new LedgerService();

export interface ApplyConcessionInput {
    enrollmentId: string;
    concessionType: ConcessionType;
    concessionValue: number;
    reason: string;
    approvedBy: string;
    ipAddress: string;
    userAgent: string;
}

export class ConcessionService {
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
    async applyConcession(input: ApplyConcessionInput): Promise<{
        concessionAmount: number;
        updatedNetFee: number;
    }> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Validate enrollment
            const enrollment = await enrollmentRepo.findById(input.enrollmentId, session);
            if (!enrollment) throw new Error('Enrollment not found');
            if (enrollment.status !== 'ONGOING') {
                throw new Error('Concession can only be applied to ONGOING enrollments');
            }
            if (enrollment.concessionType !== 'NONE') {
                throw new Error('Enrollment already has a concession applied. Contact admin to adjust.');
            }

            // Compute concession amount
            let concessionAmount: number;
            if (input.concessionType === 'PERCENTAGE') {
                if (input.concessionValue < 0 || input.concessionValue > 100) {
                    throw new Error('Percentage concession must be between 0 and 100');
                }
                concessionAmount = (enrollment.netFee * input.concessionValue) / 100;
            } else if (input.concessionType === 'FLAT') {
                if (input.concessionValue > enrollment.netFee) {
                    throw new Error('Flat concession cannot exceed net fee');
                }
                concessionAmount = input.concessionValue;
            } else {
                throw new Error('Invalid concession type');
            }

            concessionAmount = Math.round(concessionAmount * 100) / 100; // Round to 2dp

            const updatedNetFee = enrollment.netFee - concessionAmount;

            // Create a reference object for the concession (use enrollment ID as ref)
            // In a more advanced system, you'd have a Concession document as ref
            const referenceId = new Types.ObjectId(input.enrollmentId);

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
            await enrollmentRepo.updateNetFee(
                input.enrollmentId,
                updatedNetFee,
                input.concessionType,
                input.concessionValue,
                session
            );

            await session.commitTransaction();

            // Post-commit: fire-and-forget audit log
            auditService.logAsync({
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
        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    }
}

export const concessionService = new ConcessionService();
