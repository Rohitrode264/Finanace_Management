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
exports.Receipt = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ReceiptSchema = new mongoose_1.Schema({
    receiptNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
    },
    paymentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true,
        unique: true, // One receipt per payment
    },
    enrollmentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Enrollment',
        required: true,
    },
    printedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    printedAt: {
        type: Date,
        required: true,
        default: () => new Date(),
    },
    reprintCount: {
        type: Number,
        default: 0,
        min: 0,
        // Only incremented via atomic $inc in authorize-print flow
    },
    isCancelled: {
        type: Boolean,
        default: false,
        // Set to true when corresponding payment is cancelled
    },
    locked: {
        type: Boolean,
        default: true,
        // Always true. Enforced in pre-save hook.
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
// Enforce locked = true always
ReceiptSchema.pre('save', function (next) {
    if (!this.isNew) {
        next(new Error('FINANCIAL VIOLATION: Receipt is immutable. Cannot update an existing receipt via .save().'));
    }
    this.locked = true;
    next();
});
// Allow ONLY atomic updates to reprintCount and isCancelled — block all else
ReceiptSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
    const update = this.getUpdate();
    const allowedKeys = ['$inc', '$set'];
    const updateKeys = Object.keys(update ?? {});
    const hasDisallowedKeys = updateKeys.some((k) => !allowedKeys.includes(k));
    if (hasDisallowedKeys) {
        return next(new Error('FINANCIAL VIOLATION: Only atomic $inc/$set allowed on Receipt.'));
    }
    const setFields = update?.['$set'] ?? {};
    const incFields = update?.['$inc'] ?? {};
    const allowedSetFields = ['isCancelled'];
    const allowedIncFields = ['reprintCount'];
    const invalidSet = Object.keys(setFields).some((f) => !allowedSetFields.includes(f));
    const invalidInc = Object.keys(incFields).some((f) => !allowedIncFields.includes(f));
    if (invalidSet || invalidInc) {
        return next(new Error('FINANCIAL VIOLATION: Only isCancelled ($set) and reprintCount ($inc) can be updated on Receipt.'));
    }
    next();
});
ReceiptSchema.pre(['findOneAndDelete', 'deleteOne', 'deleteMany'], function (next) {
    next(new Error('FINANCIAL VIOLATION: Receipt deletion is forbidden.'));
});
// Fast lookup of receipts for a given enrollment
ReceiptSchema.index({ enrollmentId: 1 });
exports.Receipt = mongoose_1.default.model('Receipt', ReceiptSchema);
//# sourceMappingURL=Receipt.model.js.map