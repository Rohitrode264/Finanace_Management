"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedPermissions = seedPermissions;
const Permission_model_1 = require("../models/Permission.model");
const Role_model_1 = require("../models/Role.model");
const RolePermission_model_1 = require("../models/RolePermission.model");
const User_model_1 = require("../models/User.model");
/**
 * Ensures all defined permissions exist in the database and are assigned to the ADMIN role.
 * This should run on every startup to accommodate new permissions.
 */
async function seedPermissions() {
    try {
        console.log('🌱 Seeding permissions...');
        // 1. Create all missing permissions
        const existingPermissions = await Permission_model_1.Permission.find();
        const existingMap = new Set(existingPermissions.map(p => `${p.action}:${p.resource}`));
        const permissionSpecs = Permission_model_1.PERMISSION_ACTIONS.flatMap(action => {
            // Map actions to resources logically
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
            await Permission_model_1.Permission.insertMany(toCreate.map(p => ({
                ...p,
                description: `Automatically created permission for ${p.action} on ${p.resource}`
            })));
            console.log(`   ✅ Created ${toCreate.length} new permissions`);
        }
        // 2. Ensure ADMIN role has all permissions
        const adminRole = await Role_model_1.Role.findOne({ name: 'ADMIN' });
        if (!adminRole) {
            console.warn('   ⚠️ ADMIN role not found, skipping assignment');
            return;
        }
        const allPermissions = await Permission_model_1.Permission.find();
        const adminPerms = await RolePermission_model_1.RolePermission.find({ roleId: adminRole._id });
        const adminPermIds = new Set(adminPerms.map(rp => rp.permissionId.toString()));
        const missingAdminPerms = allPermissions.filter(p => !adminPermIds.has(p._id.toString()));
        if (missingAdminPerms.length > 0) {
            // We need a user to "grant" these permissions for the audit trail
            // Use the first admin user found
            const firstAdmin = await User_model_1.User.findOne({ roleId: adminRole._id });
            const grantedBy = firstAdmin?._id ?? adminRole._id; // Fallback to role ID if no user exists yet
            await RolePermission_model_1.RolePermission.insertMany(missingAdminPerms.map(p => ({
                roleId: adminRole._id,
                permissionId: p._id,
                grantedBy: grantedBy
            })));
            console.log(`   ✅ Granted ${missingAdminPerms.length} permissions to ADMIN role`);
        }
        console.log('🌱 Permission seeding complete.');
    }
    catch (err) {
        console.error('❌ Failed to seed permissions:', err);
    }
}
//# sourceMappingURL=seeder.js.map