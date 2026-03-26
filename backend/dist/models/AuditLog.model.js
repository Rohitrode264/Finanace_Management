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
exports.AuditLog = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AuditLogSchema = new mongoose_1.Schema({
    actorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    action: {
        type: String,
        required: true,
        enum: [
            'USER_LOGIN', 'USER_LOGOUT',
            'USER_CREATED', 'USER_ACTIVATED', 'USER_DEACTIVATED',
            'PAYMENT_CREATED', 'PAYMENT_CANCELLED',
            'CONCESSION_APPLIED',
            'ENROLLMENT_CREATED', 'ENROLLMENT_STATUS_CHANGED',
            'STUDENT_CREATED', 'STUDENT_UPDATED',
            'CLASS_CREATED', 'CLASS_UPDATED',
            'RECEIPT_PRINTED', 'RECEIPT_REPRINT_AUTHORIZED',
            'ROLE_CREATED', 'PERMISSION_GRANTED', 'PERMISSION_REVOKED',
            'REPORT_GENERATED', 'ADJUSTMENT_APPLIED',
            'ADMIN_SETUP', 'FINGERPRINT_REGISTERED', 'SETTING_UPDATED',
        ],
    },
    entityType: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        // e.g. 'PAYMENT', 'ENROLLMENT', 'STUDENT'
    },
    entityId: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
    before: {
        type: mongoose_1.Schema.Types.Mixed,
        default: null,
        // Snapshot of entity state BEFORE the action
    },
    after: {
        type: mongoose_1.Schema.Types.Mixed,
        default: null,
        // Snapshot of entity state AFTER the action
    },
    ipAddress: {
        type: String,
        required: true,
        trim: true,
    },
    userAgent: {
        type: String,
        trim: true,
        default: '',
    },
    timestamp: {
        type: Date,
        required: true,
        default: () => new Date(),
        index: true,
    },
}, {
    // No timestamps option — we manage our own 'timestamp' field for precision
    strict: true,
    collection: 'auditlogs',
});
// ABSOLUTE IMMUTABILITY — AuditLog must NEVER be mutated or deleted
AuditLogSchema.pre('save', function (next) {
    if (!this.isNew) {
        next(new Error('COMPLIANCE VIOLATION: AuditLog is immutable. Existing entries cannot be modified.'));
    }
    else {
        next();
    }
});
AuditLogSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
    next(new Error('COMPLIANCE VIOLATION: AuditLog updates are strictly forbidden.'));
});
AuditLogSchema.pre(['findOneAndDelete', 'deleteOne', 'deleteMany'], function (next) {
    next(new Error('COMPLIANCE VIOLATION: AuditLog deletion is strictly forbidden.'));
});
// Query by actor for user activity reports
AuditLogSchema.index({ actorId: 1, timestamp: -1 });
// Query by entity for an entity's full audit trail
AuditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
// Query by action type
AuditLogSchema.index({ action: 1, timestamp: -1 });
exports.AuditLog = mongoose_1.default.model('AuditLog', AuditLogSchema);
//# sourceMappingURL=AuditLog.model.js.map