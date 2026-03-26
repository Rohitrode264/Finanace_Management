"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PaymentAllocationSchema = new mongoose_1.Schema({
    installmentNo: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 },
}, { _id: false });
const PaymentSchema = new mongoose_1.Schema({
    enrollmentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Enrollment',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: [0.01, 'Payment amount must be positive'],
    },
    paymentMode: {
        type: String,
        enum: ['CASH', 'UPI', 'CARD', 'CHEQUE', 'BANK_TRANSFER'],
        required: true,
    },
    allocation: {
        type: [PaymentAllocationSchema],
        required: true,
        validate: {
            validator: function (alloc) {
                return alloc.length > 0;
            },
            message: 'Payment must be allocated to at least one installment',
        },
    },
    receiptId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Receipt',
        default: null,
    },
    receivedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fingerprintVerified: {
        type: Boolean,
        default: false,
    },
    isCancelled: {
        type: Boolean,
        default: false,
        index: true,
    },
    cancellationReason: {
        type: String,
        default: null,
        trim: true,
        maxlength: 500,
    },
    cancelledBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    cancelledAt: {
        type: Date,
        default: null,
    },
    transactionRef: {
        type: String,
        default: null,
        trim: true,
        // UPI ref, cheque number, transaction ID etc.
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
    // FINANCIAL RULE: Payment documents are created once and never updated
    // EXCEPTION: isCancelled, cancellationReason, cancelledBy, cancelledAt
    // can be set ONCE via atomic $set on cancellation (never via .save())
});
// Fast lookup of all payments for a given enrollment
PaymentSchema.index({ enrollmentId: 1, createdAt: 1 });
// Find active (non-cancelled) payments for an enrollment
PaymentSchema.index({ enrollmentId: 1, isCancelled: 1 });
exports.Payment = mongoose_1.default.model('Payment', PaymentSchema);
//# sourceMappingURL=Payment.model.js.map