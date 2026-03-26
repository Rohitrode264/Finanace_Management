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
exports.ClassTemplate = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ClassTemplateSchema = new mongoose_1.Schema({
    grade: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        // e.g. '11', '12', '10', '9'
    },
    stream: {
        type: String,
        trim: true,
        uppercase: true,
        default: null,
        // e.g. 'SCIENCE', 'COMMERCE', 'ARTS' — null for primary grades
    },
    board: {
        type: String,
        enum: ['CBSE', 'ICSE', 'STATE', 'IB', 'OTHER'],
        required: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });
// Unique combination: grade + stream + board defines a unique class type
ClassTemplateSchema.index({ grade: 1, stream: 1, board: 1 }, { unique: true });
exports.ClassTemplate = mongoose_1.default.model('ClassTemplate', ClassTemplateSchema);
//# sourceMappingURL=ClassTemplate.model.js.map