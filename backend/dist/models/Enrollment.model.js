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
exports.Enrollment = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const EnrollmentSchema = new mongoose_1.Schema({
    studentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    academicClassId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'AcademicClass',
        required: true,
    },
    academicYear: {
        type: String,
        required: true,
        trim: true,
        // Denormalized from AcademicClass for fast queries without join
    },
    totalFee: {
        type: Number,
        required: true,
        min: 0,
        // Snapshot of class fee at time of enrollment — immutable
    },
    concessionType: {
        type: String,
        enum: ['PERCENTAGE', 'FLAT', 'NONE'],
        default: 'NONE',
    },
    concessionValue: {
        type: Number,
        default: 0,
        min: 0,
    },
    netFee: {
        type: Number,
        required: true,
        min: 0,
        // = totalFee minus concession amount
        // IMPORTANT: Balance is NOT stored here — always computed from LedgerEntries
    },
    status: {
        type: String,
        enum: ['ONGOING', 'COMPLETED', 'CANCELLED'],
        default: 'ONGOING',
        index: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });
// Prevent a student from being enrolled twice in the same academic year/class
EnrollmentSchema.index({ studentId: 1, academicYear: 1, academicClassId: 1 }, { unique: true });
// Fast lookup of all enrollments for a student
EnrollmentSchema.index({ studentId: 1, academicYear: 1 });
exports.Enrollment = mongoose_1.default.model('Enrollment', EnrollmentSchema);
//# sourceMappingURL=Enrollment.model.js.map