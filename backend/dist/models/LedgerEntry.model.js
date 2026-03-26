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
exports.LedgerEntry = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const LedgerEntrySchema = new mongoose_1.Schema({
    enrollmentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Enrollment',
        required: true,
    },
    type: {
        type: String,
        enum: ['CREDIT', 'DEBIT'],
        required: true,
        // CREDIT = money received / fee reduced. DEBIT = balance owed / reversal.
    },
    amount: {
        type: Number,
        required: true,
        min: [0.01, 'Ledger amount must be positive'],
    },
    referenceType: {
        type: String,
        enum: ['PAYMENT', 'CONCESSION', 'ADJUSTMENT', 'CANCELLATION'],
        required: true,
    },
    referenceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        // References Payment._id, or internal adjustment doc
    },
    description: {
        type: String,
        trim: true,
        default: '',
        maxlength: 500,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
    // FINANCIAL RULE: LedgerEntry is append-only.
    // No update or delete path exists. Period.
});
// PRIMARY: reconstruct balance for an enrollment (most critical query)
LedgerEntrySchema.index({ enrollmentId: 1, createdAt: 1 });
// For daily report aggregation by date range
LedgerEntrySchema.index({ createdAt: 1 });
// For cancellation flow: find ledger entries for a specific payment
LedgerEntrySchema.index({ referenceId: 1, referenceType: 1 });
// ──────────────────────────────────────────────────────────────────────────────
// IMMUTABILITY ENFORCEMENT
// Pre-save hook ensures we never accidentally call .save() on an existing entry.
// ──────────────────────────────────────────────────────────────────────────────
LedgerEntrySchema.pre('save', function (next) {
    if (!this.isNew) {
        next(new Error('FINANCIAL VIOLATION: LedgerEntry is immutable. Cannot update an existing ledger record.'));
    }
    else {
        next();
    }
});
// Block findOneAndUpdate and updateOne at the model level
LedgerEntrySchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
    next(new Error('FINANCIAL VIOLATION: LedgerEntry updates are forbidden.'));
});
// Block findOneAndDelete and deleteOne at the model level
LedgerEntrySchema.pre(['findOneAndDelete', 'deleteOne', 'deleteMany'], function (next) {
    next(new Error('FINANCIAL VIOLATION: LedgerEntry deletion is forbidden.'));
});
exports.LedgerEntry = mongoose_1.default.model('LedgerEntry', LedgerEntrySchema);
//# sourceMappingURL=LedgerEntry.model.js.map