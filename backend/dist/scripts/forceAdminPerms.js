"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
const Permission_model_1 = require("../models/Permission.model");
const Role_model_1 = require("../models/Role.model");
const RolePermission_model_1 = require("../models/RolePermission.model");
async function forceAdminPerms() {
    try {
        console.log('Connecting to database...');
        await mongoose_1.default.connect(env_1.env.MONGODB_URI);
        console.log('Connected.');
        // Get admin role
        const adminRole = await Role_model_1.Role.findOne({ name: 'ADMIN' });
        if (!adminRole) {
            console.error('Admin role not found');
            process.exit(1);
        }
        console.log(`Found ADMIN role: ${adminRole._id}`);
        // Ensure all permutations are created in Permissions table
        const existingPermissions = await Permission_model_1.Permission.find();
        const existingMap = new Set(existingPermissions.map(p => `${p.action}:${p.resource}`));
        const permissionSpecs = Permission_model_1.PERMISSION_ACTIONS.flatMap(action => {
            let resource = 'SYSTEM';
            if (action.includes('PAYMENT'))
                resource = 'PAYMENT';
            else if (action.includes('STUDENT'))
                resource = 'STUDENT';
            else if (action.includes('ENROLLMENT'))
                resource = 'ENROLLMENT';
            else if (action.includes('CLASS'))
                resource = 'CLASS';
            else if (action.includes('RECEIPT'))
                resource = 'RECEIPT';
            else if (action.includes('REPORT'))
                resource = 'REPORT';
            else if (action.includes('AUDIT'))
                resource = 'AUDIT_LOG';
            else if (action.includes('ROLE'))
                resource = 'ROLE';
            else if (action.includes('PERMISSION'))
                resource = 'PERMISSION';
            else if (action.includes('CONCESSION'))
                resource = 'CONCESSION';
            else if (action.includes('USER'))
                resource = 'USER';
            else if (action.includes('SETTING'))
                resource = 'SETTING';
            return { action, resource };
        });
        const toCreate = permissionSpecs.filter(p => !existingMap.has(`${p.action}:${p.resource}`));
        if (toCreate.length > 0) {
            console.log(`Creating ${toCreate.length} missing permissions...`);
            await Permission_model_1.Permission.insertMany(toCreate.map(p => ({
                ...p,
                description: `Automatically created permission for ${p.action} on ${p.resource}`
            })));
        }
        // Grant ALL permissions to admin role
        const allPermissions = await Permission_model_1.Permission.find();
        let grantedCount = 0;
        await RolePermission_model_1.RolePermission.deleteMany({ roleId: adminRole._id });
        console.log('Cleared existing admin permissions...');
        const toInsert = allPermissions.map(p => ({
            roleId: adminRole._id,
            permissionId: p._id,
            grantedBy: adminRole._id
        }));
        await RolePermission_model_1.RolePermission.insertMany(toInsert);
        grantedCount = toInsert.length;
        console.log(`✅ Successfully granted ${grantedCount} permissions to ADMIN role!`);
        await mongoose_1.default.disconnect();
        process.exit(0);
    }
    catch (err) {
        console.error('Failed:', err);
        await mongoose_1.default.disconnect();
        process.exit(1);
    }
}
forceAdminPerms();
//# sourceMappingURL=forceAdminPerms.js.map