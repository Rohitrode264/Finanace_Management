"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptRepository = void 0;
const mongoose_1 = require("mongoose");
const Receipt_model_1 = require("../models/Receipt.model");
class ReceiptRepository {
    async create(data, session) {
        const [receipt] = await Receipt_model_1.Receipt.create([data], { session });
        if (!receipt)
            throw new Error('Failed to create receipt');
        return receipt;
    }
    async findById(id) {
        return Receipt_model_1.Receipt.findById(id)
            .populate({
            path: 'paymentId',
            populate: { path: 'receivedBy' }
        })
            .populate({
            path: 'enrollmentId',
            populate: [
                { path: 'studentId' },
                { path: 'academicClassId', populate: { path: 'templateId' } }
            ]
        });
    }
    async findByReceiptNumber(receiptNumber) {
        return Receipt_model_1.Receipt.findOne({ receiptNumber: receiptNumber.toUpperCase() });
    }
    async findByPaymentId(paymentId) {
        return Receipt_model_1.Receipt.findOne({ paymentId })
            .populate({
            path: 'paymentId',
            populate: { path: 'receivedBy' }
        })
            .populate({
            path: 'enrollmentId',
            populate: [
                { path: 'studentId' },
                { path: 'academicClassId', populate: { path: 'templateId' } }
            ]
        });
    }
    async incrementReprintCount(receiptId) {
        await Receipt_model_1.Receipt.findByIdAndUpdate(receiptId, { $inc: { reprintCount: 1 } });
    }
    async markCancelled(receiptId, session) {
        await Receipt_model_1.Receipt.findByIdAndUpdate(receiptId, { $set: { isCancelled: true } }, { session });
    }
    async hardDeleteByPaymentId(paymentId, session) {
        await Receipt_model_1.Receipt.collection.deleteMany({ paymentId: new mongoose_1.Types.ObjectId(paymentId.toString()) }, { session });
    }
}
exports.ReceiptRepository = ReceiptRepository;
//# sourceMappingURL=receipt.repository.js.map