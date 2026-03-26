import mongoose from 'mongoose';

// ──────────────────────────────────────────────────────────────────────────────
// Atomic receipt number generator using MongoDB findOneAndUpdate
// Uses a dedicated 'counters' collection for the sequence
// This is safe for concurrent requests — no race conditions
// ──────────────────────────────────────────────────────────────────────────────

interface ICounter {
    _id: string;
    seq: number;
}

const CounterSchema = new mongoose.Schema<ICounter>({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
});

const Counter = mongoose.model<ICounter>('Counter', CounterSchema);

/**
 * Atomically increments and returns the next receipt number.
 * Format: RCP-YYYY-NNNNNN
 * Example: RCP-2024-000042
 *
 * @param session - Optional MongoDB session for use within transactions
 */
export async function generateReceiptNumber(
    session?: mongoose.ClientSession
): Promise<string> {
    const year = new Date().getFullYear();
    const counterId = `receipt_${year}`;

    const result = await Counter.findOneAndUpdate(
        { _id: counterId },
        { $inc: { seq: 1 } },
        { upsert: true, new: true, session }
    );

    if (!result) {
        throw new Error('Failed to generate receipt number');
    }

    const padded = String(result.seq).padStart(6, '0');
    return `RCP-${year}-${padded}`;
}
