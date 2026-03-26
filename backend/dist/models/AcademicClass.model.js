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
exports.AcademicClass = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const InstallmentPlanSchema = new mongoose_1.Schema({
    installmentNo: { type: Number, required: true, min: 1 },
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
}, { _id: false });
const AcademicClassSchema = new mongoose_1.Schema({
    templateId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ClassTemplate',
        required: true,
    },
    academicYear: {
        type: String,
        required: true,
        trim: true,
        match: [/^\d{4}-\d{2,4}$/, 'academicYear must be in format YYYY-YY or YYYY-YYYY'],
        // FINANCIAL RULE: Once set, this MUST NOT be changed.
        // Enforced in service layer — no update path for academicYear.
    },
    section: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        // e.g. 'A', 'B', 'C'
    },
    totalFee: {
        type: Number,
        required: true,
        min: 0,
    },
    installmentPlan: {
        type: [InstallmentPlanSchema],
        required: true,
        validate: {
            validator: function (plan) {
                if (plan.length === 0)
                    return false;
                // Validate installment amounts sum equals totalFee
                const total = plan.reduce((sum, i) => sum + i.amount, 0);
                return Math.abs(total - this.totalFee) < 0.01;
            },
            message: 'Sum of installment amounts must equal totalFee',
        },
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });
// Find all classes for a specific academic year (very common query)
AcademicClassSchema.index({ academicYear: 1 });
// Prevent duplicate section in same year for same template
AcademicClassSchema.index({ templateId: 1, academicYear: 1, section: 1 }, { unique: true });
exports.AcademicClass = mongoose_1.default.model('AcademicClass', AcademicClassSchema);
//# sourceMappingURL=AcademicClass.model.js.map