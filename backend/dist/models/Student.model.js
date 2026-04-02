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
exports.Student = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const StudentSchema = new mongoose_1.Schema({
    admissionNumber: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        // Format: e.g. ADM-2024-0001
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    alternatePhone: {
        type: String,
        trim: true,
    },
    motherPhone: {
        type: String,
        trim: true,
    },
    fatherName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    motherName: {
        type: String,
        required: false,
        trim: true,
        maxlength: 100,
    },
    schoolName: {
        type: String,
        trim: true,
        maxlength: 200,
        default: '',
    },
    program: {
        type: String,
        trim: true,
        default: '',
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    bloodGroup: {
        type: String,
        trim: true,
    },
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true },
    },
    history: {
        previousSchool: { type: String, trim: true },
        percentage: { type: String, trim: true },
        yearPassout: { type: String, trim: true },
        extraNote: { type: String, trim: true },
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'DROPPED', 'PASSED_OUT'],
        default: 'ACTIVE',
        index: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });
// Full-text search on student names and program
StudentSchema.index({ firstName: 'text', lastName: 'text', admissionNumber: 'text', program: 'text' });
exports.Student = mongoose_1.default.model('Student', StudentSchema);
//# sourceMappingURL=Student.model.js.map