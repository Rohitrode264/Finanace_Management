"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRepository = void 0;
const mongoose_1 = require("mongoose");
const Payment_model_1 = require("../models/Payment.model");
class PaymentRepository {
    async create(data, session) {
        const [payment] = await Payment_model_1.Payment.create([data], { session });
        if (!payment)
            throw new Error('Failed to create payment');
        return payment;
    }
    async findById(id) {
        return Payment_model_1.Payment.findById(id).populate('receivedBy', 'name firstName lastName');
    }
    async findByEnrollment(enrollmentId) {
        return Payment_model_1.Payment.find({ enrollmentId }).sort({ createdAt: -1 });
    }
    async cancelPayment(paymentId, cancelledBy, reason, session) {
        return Payment_model_1.Payment.findOneAndUpdate({ _id: paymentId, isCancelled: false }, {
            $set: {
                isCancelled: true,
                cancellationReason: reason,
                cancelledBy: new mongoose_1.Types.ObjectId(cancelledBy.toString()),
                cancelledAt: new Date(),
            },
        }, { new: true, session });
    }
    async setReceiptId(paymentId, receiptId, session) {
        await Payment_model_1.Payment.findByIdAndUpdate(paymentId, { $set: { receiptId } }, { session });
    }
    async hardDelete(paymentId, session) {
        await Payment_model_1.Payment.findByIdAndDelete(paymentId, { session });
    }
}
exports.PaymentRepository = PaymentRepository;
//# sourceMappingURL=payment.repository.js.map