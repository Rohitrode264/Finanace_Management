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
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const UserSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    passwordHash: {
        type: String,
        required: true,
        // Never expose this field in API responses
        select: false,
    },
    roleId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Role',
        required: true,
        index: true,
    },
    fingerprintKey: {
        type: String,
        default: null,
        // Encrypted fingerprint reference key, NOT raw biometric data
    },
    resetPasswordOTP: {
        type: String,
        select: false,
    },
    resetPasswordOTPExpires: {
        type: Date,
        select: false,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
}, {
    timestamps: true,
    // Never expose passwordHash in toJSON
    toJSON: {
        transform(_doc, ret) {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            delete ret.passwordHash;
            // Flatten role if populated
            if (ret.roleId && typeof ret.roleId === 'object' && ret.roleId.name) {
                ret.role = ret.roleId.name;
                ret.roleId = ret.roleId._id.toString();
            }
            return ret;
        },
    },
});
// Compound index: active users by role — common query for permission resolution
UserSchema.index({ roleId: 1, isActive: 1 });
exports.User = mongoose_1.default.model('User', UserSchema);
//# sourceMappingURL=User.model.js.map