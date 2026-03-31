import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Plus, Check, Lock } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { rbacService } from '../../api/services/rbac.service';
import type { Role } from '../../types';
import toast from 'react-hot-toast';

export function RBACPage() {
    const qc = useQueryClient();
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [addingRole, setAddingRole] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');

    const { data: rolesRes, isLoading: rLoading } = useQuery({
        queryKey: ['roles'],
        queryFn: () => rbacService.listRoles(),
    });

    const { data: permsRes } = useQuery({
        queryKey: ['permissions'],
        queryFn: () => rbacService.listPermissions(),
    });

    const { data: rolePermsRes, refetch: refetchRolePerms } = useQuery({
        queryKey: ['role-permissions', selectedRole?._id],
        queryFn: () => rbacService.getRolePermissions(selectedRole!._id),
        enabled: !!selectedRole,
    });

    const roles = rolesRes?.data?.data ?? [];
    const permissions = permsRes?.data?.data ?? [];
    const activeRolePerms = rolePermsRes?.data?.data?.map(p => p._id) ?? [];

    const updatePermMutation = useMutation({
        mutationFn: (permId: string) => {
            const isAssigned = activeRolePerms.includes(permId);
            if (isAssigned) {
                return rbacService.revokePermission(selectedRole!._id, permId);
            }
            return rbacService.grantPermission(selectedRole!._id, permId);
        },
        onSuccess: (res, permId) => {
            if (res !== null) {
                refetchRolePerms();
                const isAssigned = activeRolePerms.includes(permId);
                toast.success(isAssigned ? 'Permission revoked' : 'Permission granted');
            }
        },
        onError: () => toast.error('Failed to update permission'),
    });

    const createRoleMutation = useMutation({
        mutationFn: () => rbacService.createRole({ name: newRoleName, description: 'Staff role' }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['roles'] });
            setAddingRole(false);
            setNewRoleName('');
            toast.success('Role created');
        },
        onError: () => toast.error('Role creation failed'),
    });

    return (
        <div>
            <PageHeader
                title="Role-Based Access Control"
                subtitle="Configure system permissions and role assignments for staff members."
                actions={
                    <button className="btn-secondary" onClick={() => setAddingRole(true)}>
                        <Plus size={14} /> New Role
                    </button>
                }
            />

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
                {/* Roles List */}
                <div className="card" style={{ padding: 16 }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Shield size={16} color="#6366f1" /> Roles
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {rLoading ? (
                            Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 40, marginBottom: 4 }} />)
                        ) : (
                            roles.map(r => (
                                <button
                                    key={r._id}
                                    onClick={() => setSelectedRole(r)}
                                    style={{
                                        padding: '10px 14px', borderRadius: 10, border: 'none', textAlign: 'left', cursor: 'pointer',
                                        background: selectedRole?._id === r._id ? 'rgba(99,102,241,0.1)' : 'transparent',
                                        color: selectedRole?._id === r._id ? '#6366f1' : 'var(--text-primary)',
                                        fontWeight: selectedRole?._id === r._id ? 600 : 500,
                                        fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    }}
                                >
                                    {r.name}
                                    {r.isSystemRole && <Lock size={12} style={{ opacity: 0.5 }} />}
                                </button>
                            ))
                        )}
                        {addingRole && (
                            <div style={{ marginTop: 8 }}>
                                <input
                                    autoFocus
                                    className="form-input"
                                    value={newRoleName}
                                    onChange={e => setNewRoleName(e.target.value)}
                                    placeholder="Role name..."
                                    onKeyDown={e => e.key === 'Enter' && createRoleMutation.mutate()}
                                />
                                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                    <button className="btn-primary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => createRoleMutation.mutate()}>Save</button>
                                    <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => setAddingRole(false)}>Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Permissions Matrix */}
                <div className="card" style={{ padding: 24 }}>
                    {selectedRole ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <div>
                                    <h3 style={{ fontWeight: 700 }}>Permissions for {selectedRole.name}</h3>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Toggle permissions to grant or revoke access.</p>
                                </div>
                                {selectedRole.isSystemRole && (
                                    <span className="badge badge-indigo">System Protected</span>
                                )}
                            </div>

                            {/* Grouped Permissions */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                                {Array.from(new Set(permissions.map(p => p.resource))).sort().map(group => {
                                    const groupPerms = permissions.filter(p => p.resource === group);
                                    if (groupPerms.length === 0) return null;
                                    return (
                                        <div key={group} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                                            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 12 }}>
                                                {group.replace(/_/g, ' ')} Management
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                {groupPerms.map(p => {
                                                    const isAssigned = activeRolePerms.includes(p._id);
                                                    return (
                                                        <label key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: selectedRole.isSystemRole ? 'default' : 'pointer' }}>
                                                            <div
                                                                onClick={() => !selectedRole.isSystemRole && updatePermMutation.mutate(p._id)}
                                                                style={{
                                                                    width: 18, height: 18, border: `2px solid ${isAssigned ? '#6366f1' : 'var(--border)'}`,
                                                                    borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    background: isAssigned ? '#6366f1' : 'transparent', transition: 'all 0.2s',
                                                                }}
                                                            >
                                                                {isAssigned && <Check size={12} color="#fff" />}
                                                            </div>
                                                            <span style={{ fontSize: '0.875rem', fontWeight: 500, flex: 1 }}>{p.action.replace(/_/g, ' ')}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, color: 'var(--text-muted)' }}>
                            <Shield size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                            <p>Select a role from the left to manage its permissions.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
