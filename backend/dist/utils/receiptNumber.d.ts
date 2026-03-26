import mongoose from 'mongoose';
/**
 * Atomically increments and returns the next receipt number.
 * Format: RCP-YYYY-NNNNNN
 * Example: RCP-2024-000042
 *
 * @param session - Optional MongoDB session for use within transactions
 */
export declare function generateReceiptNumber(session?: mongoose.ClientSession): Promise<string>;
//# sourceMappingURL=receiptNumber.d.ts.map