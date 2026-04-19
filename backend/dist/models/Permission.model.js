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
exports.Permission = exports.PERMISSION_RESOURCES = exports.PERMISSION_ACTIONS = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Strict permission action and resource enums prevent typo-based privilege escalation
exports.PERMISSION_ACTIONS = [
    'CREATE_PAYMENT',
    'CANCEL_PAYMENT',
    'DELETE_PAYMENT',
    'VIEW_PAYMENT',
    'CREATE_STUDENT',
    'UPDATE_STUDENT',
    'VIEW_STUDENT',
    'CREATE_ENROLLMENT',
    'VIEW_ENROLLMENT',
    'TRANSFER_ENROLLMENT',
    'APPLY_CONCESSION',
    'APPROVE_CONCESSION',
    'CREATE_CLASS',
    'UPDATE_CLASS',
    'VIEW_CLASS',
    'VIEW_RECEIPT',
    'AUTHORIZE_RECEIPT_PRINT',
    'VIEW_REPORT',
    'GENERATE_REPORT',
    'MANAGE_ROLES',
    'MANAGE_PERMISSIONS',
    'MANAGE_USERS',
    'CREATE_USER',
    'VIEW_AUDIT_LOG',
    'UPDATE_SETTING',
];
exports.PERMISSION_RESOURCES = [
    'PAYMENT',
    'STUDENT',
    'ENROLLMENT',
    'CLASS',
    'RECEIPT',
    'REPORT',
    'AUDIT_LOG',
    'ROLE',
    'PERMISSION',
    'CONCESSION',
    'USER',
    'SETTING',
];
const PermissionSchema = new mongoose_1.Schema({
    action: {
        type: String,
        enum: exports.PERMISSION_ACTIONS,
        required: true,
    },
    resource: {
        type: String,
        enum: exports.PERMISSION_RESOURCES,
        required: true,
    },
    description: {
        type: String,
        trim: true,
        default: '',
    },
}, { timestamps: true });
// Compound unique — can't have duplicate action+resource combinations
PermissionSchema.index({ action: 1, resource: 1 }, { unique: true });
exports.Permission = mongoose_1.default.model('Permission', PermissionSchema);
//# sourceMappingURL=Permission.model.js.map