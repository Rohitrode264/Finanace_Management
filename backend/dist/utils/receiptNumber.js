"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReceiptNumber = generateReceiptNumber;
const mongoose_1 = __importDefault(require("mongoose"));
const CounterSchema = new mongoose_1.default.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
});
const Counter = mongoose_1.default.model('Counter', CounterSchema);
/**
 * Atomically increments and returns the next receipt number.
 * Format: RCP-YYYY-NNNNNN
 * Example: RCP-2024-000042
 *
 * @param session - Optional MongoDB session for use within transactions
 */
async function generateReceiptNumber(session) {
    const year = new Date().getFullYear();
    const counterId = `receipt_${year}`;
    const result = await Counter.findOneAndUpdate({ _id: counterId }, { $inc: { seq: 1 } }, { upsert: true, new: true, session });
    if (!result) {
        throw new Error('Failed to generate receipt number');
    }
    const padded = String(result.seq).padStart(6, '0');
    return `RCP-${year}-${padded}`;
}
//# sourceMappingURL=receiptNumber.js.map