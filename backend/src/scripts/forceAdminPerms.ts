import mongoose from 'mongoose';
import { env } from '../config/env';
import { Permission, PERMISSION_ACTIONS, PERMISSION_RESOURCES } from '../models/Permission.model';
import { Role } from '../models/Role.model';
import { RolePermission } from '../models/RolePermission.model';
import { User } from '../models/User.model';

async function forceAdminPerms() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(env.MONGODB_URI);
        console.log('Connected.');

        // Get admin role
        const adminRole = await Role.findOne({ name: 'ADMIN' });
        if (!adminRole) {
            console.error('Admin role not found');
            process.exit(1);
        }

        console.log(`Found ADMIN role: ${adminRole._id}`);

        // Ensure all permutations are created in Permissions table
        const existingPermissions = await Permission.find();
        const existingMap = new Set(existingPermissions.map(p => `${p.action}:${p.resource}`));

        const permissionSpecs = PERMISSION_ACTIONS.flatMap(action => {
            let resource = 'SYSTEM';
            if (action.includes('PAYMENT')) resource = 'PAYMENT';
            else if (action.includes('STUDENT')) resource = 'STUDENT';
            else if (action.includes('ENROLLMENT')) resource = 'ENROLLMENT';
            else if (action.includes('CLASS')) resource = 'CLASS';
            else if (action.includes('RECEIPT')) resource = 'RECEIPT';
            else if (action.includes('REPORT')) resource = 'REPORT';
            else if (action.includes('AUDIT')) resource = 'AUDIT_LOG';
            else if (action.includes('ROLE')) resource = 'ROLE';
            else if (action.includes('PERMISSION')) resource = 'PERMISSION';
            else if (action.includes('CONCESSION')) resource = 'CONCESSION';
            else if (action.includes('USER')) resource = 'USER';
            else if (action.includes('SETTING')) resource = 'SETTING';

            return { action, resource };
        });

        const toCreate = permissionSpecs.filter(p => !existingMap.has(`${p.action}:${p.resource}`));
        if (toCreate.length > 0) {
            console.log(`Creating ${toCreate.length} missing permissions...`);
            await Permission.insertMany(toCreate.map(p => ({
                ...p,
                description: `Automatically created permission for ${p.action} on ${p.resource}`
            })));
        }

        // Grant ALL permissions to admin role
        const allPermissions = await Permission.find();
        let grantedCount = 0;

        await RolePermission.deleteMany({ roleId: adminRole._id });
        console.log('Cleared existing admin permissions...');

        const toInsert = allPermissions.map(p => ({
            roleId: adminRole._id,
            permissionId: p._id,
            grantedBy: adminRole._id
        }));

        await RolePermission.insertMany(toInsert);
        grantedCount = toInsert.length;

        console.log(`✅ Successfully granted ${grantedCount} permissions to ADMIN role!`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Failed:', err);
        await mongoose.disconnect();
        process.exit(1);
    }
}

forceAdminPerms();
