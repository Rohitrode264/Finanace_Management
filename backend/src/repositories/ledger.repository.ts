import { ClientSession, Types } from 'mongoose';
import { LedgerEntry, ILedgerEntry } from '../models/LedgerEntry.model';

export class LedgerRepository {
    async create(data: Partial<ILedgerEntry>, session: ClientSession): Promise<ILedgerEntry> {
        const [entry] = await LedgerEntry.create([data], { session });
        if (!entry) throw new Error('Failed to create ledger entry');
        return entry as ILedgerEntry;
    }

    async findByEnrollment(enrollmentId: string | Types.ObjectId): Promise<ILedgerEntry[]> {
        return LedgerEntry.find({ enrollmentId })
            .populate('createdBy', 'name firstName lastName')
            .sort({ createdAt: 1 }) as unknown as Promise<ILedgerEntry[]>;
    }

    async computeBalance(enrollmentId: string | Types.ObjectId): Promise<number> {
        const result = await LedgerEntry.aggregate<{ _id: string; total: number }>([
            { $match: { enrollmentId: new Types.ObjectId(enrollmentId.toString()) } },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                },
            },
        ]);

        let credits = 0;
        let debits = 0;

        for (const r of result) {
            if (r._id === 'CREDIT') credits = r.total;
            if (r._id === 'DEBIT') debits = r.total;
        }

        return debits - credits;
    }

    async findByDateRange(from: Date, to: Date): Promise<ILedgerEntry[]> {
        return LedgerEntry.find({
            createdAt: { $gte: from, $lte: to },
        }).sort({ createdAt: 1 }) as unknown as Promise<ILedgerEntry[]>;
    }

    async findByReference(
        referenceId: string | Types.ObjectId,
        referenceType: ILedgerEntry['referenceType']
    ): Promise<ILedgerEntry | null> {
        return LedgerEntry.findOne({ referenceId, referenceType }) as unknown as Promise<ILedgerEntry | null>;
    }
}
