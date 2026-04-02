import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Fingerprint, Check, X, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '../../components/ui/PageHeader';
import { usePermission } from '../../hooks/usePermission';
import { usersService } from '../../api/services/users.service';
import { rbacService } from '../../api/services/rbac.service';
import type { User, Role } from '../../types';
import { format } from 'date-fns';
import { TruncatedText } from '../../components/ui/TruncatedText';
import toast from 'react-hot-toast';

const createUserSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    roleId: z.string().length(24, 'Select a role'),
});
type CreateUserForm = z.infer<typeof createUserSchema>;

export function UsersPage() {
    const qc = useQueryClient();
    const [showCreate, setShowCreate] = useState(false);
    const [fingerprintModal, setFingerprintModal] = useState<User | null>(null);
    const [fingerprintKey, setFingerprintKey] = useState('');

    const canManage = usePermission('MANAGE_USERS');
    const canCreate = usePermission(['MANAGE_USERS', 'CREATE_USER']);

    const { data: usersRes, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => usersService.list(),
    });

    const { data: rolesRes } = useQuery({
        queryKey: ['roles'],
        queryFn: () => rbacService.listRoles(),
    });

    const users: User[] = (usersRes?.data?.data as User[] | undefined) ?? [];
    const roles: Role[] = (rolesRes?.data?.data as Role[] | undefined) ?? [];

    const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateUserForm>({
        resolver: zodResolver(createUserSchema),
    });

    const createMutation = useMutation({
        mutationFn: (d: CreateUserForm) => usersService.create(d),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['users'] });
            toast.success('User created successfully');
            setShowCreate(false);
            reset();
        },
        onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to create user'),
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            usersService.updateStatus(id, isActive),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['users'] });
            toast.success(`User ${vars.isActive ? 'activated' : 'deactivated'}`);
        },
        onError: () => toast.error('Failed to update user status'),
    });

    const fingerprintMutation = useMutation({
        mutationFn: () => usersService.updateFingerprint(fingerprintModal!._id, fingerprintKey),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['users'] });
            toast.success('Fingerprint registered successfully');
            setFingerprintModal(null);
            setFingerprintKey('');
        },
        onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to register fingerprint'),
    });

    const getRoleName = (user: User) => {
        const role = user.roleId;
        if (typeof role === 'object' && role !== null) return (role as Role).name;
        const found = roles.find(r => r._id === role);
        return found?.name ?? '—';
    };

    return (
        <div>
            <PageHeader
                title="User Management"
                subtitle="Manage staff accounts, roles, and biometric credentials."
                actions={canCreate ? (
                    <button className="btn-primary" onClick={() => setShowCreate(true)}>
                        <UserPlus size={15} /> New User
                    </button>
                ) : undefined}
            />

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Fingerprint</th>
                            <th>Created</th>
                            {canManage && <th style={{ textAlign: 'center' }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i}>
                                    {Array.from({ length: canManage ? 7 : 6 }).map((_, j) => (
                                        <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>
                                    ))}
                                </tr>
                            ))
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={canManage ? 7 : 6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                                    No users found.
                                </td>
                            </tr>
                        ) : (
                            users.map((u) => (
                                <tr key={u._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                width: 32, height: 32,
                                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                                            }}>
                                                {u.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                                <TruncatedText text={u.name} maxWidth="140px" modalTitle="Staff Member Name" />
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        <TruncatedText text={u.email} maxWidth="180px" modalTitle="Email Address" />
                                    </td>
                                    <td>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                            padding: '3px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600,
                                            background: 'rgba(99,102,241,0.1)', color: '#6366f1',
                                        }}>
                                            <Shield size={11} />
                                            {getRoleName(u)}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '3px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600,
                                            background: u.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                            color: u.isActive ? '#10b981' : '#ef4444',
                                        }}>
                                            {u.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '3px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600,
                                            background: u.fingerprintKey ? 'rgba(16,185,129,0.1)' : 'rgba(156,163,175,0.1)',
                                            color: u.fingerprintKey ? '#10b981' : 'var(--text-muted)',
                                        }}>
                                            {u.fingerprintKey ? 'Registered' : 'Not Set'}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {format(new Date(u.createdAt), 'dd MMM yyyy')}
                                    </td>
                                    {canManage && (
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                                <button
                                                    className={u.isActive ? 'btn-secondary' : 'btn-primary'}
                                                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                                    onClick={() => statusMutation.mutate({ id: u._id, isActive: !u.isActive })}
                                                    disabled={statusMutation.isPending}
                                                >
                                                    {u.isActive ? <X size={12} /> : <Check size={12} />}
                                                    {u.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    className="btn-secondary"
                                                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                                    onClick={() => { setFingerprintModal(u); setFingerprintKey(''); }}
                                                >
                                                    <Fingerprint size={12} /> Fingerprint
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </motion.div>

            {/* Create User Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setShowCreate(false)}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: 20 }}>Create New User</h3>
                            <form onSubmit={handleSubmit(d => createMutation.mutate(d))}>
                                <div className="form-grid">
                                    <div>
                                        <label className="form-label">Full Name *</label>
                                        <input {...register('name')} className={`form-input ${errors.name ? 'error' : ''}`} placeholder="e.g. Ramesh Kumar" />
                                        {errors.name && <p className="form-error">{errors.name.message}</p>}
                                    </div>
                                    <div>
                                        <label className="form-label">Email *</label>
                                        <input {...register('email')} type="email" className={`form-input ${errors.email ? 'error' : ''}`} placeholder="user@school.com" />
                                        {errors.email && <p className="form-error">{errors.email.message}</p>}
                                    </div>
                                    <div>
                                        <label className="form-label">Password *</label>
                                        <input {...register('password')} type="password" className={`form-input ${errors.password ? 'error' : ''}`} placeholder="Min 6 characters" />
                                        {errors.password && <p className="form-error">{errors.password.message}</p>}
                                    </div>
                                    <div>
                                        <label className="form-label">Role *</label>
                                        <select {...register('roleId')} className={`form-select ${errors.roleId ? 'error' : ''}`}>
                                            <option value="">— Select role —</option>
                                            {roles.filter(r => canManage || !['ADMIN', 'SUPER_ADMIN'].includes(r.name)).map(r => (
                                                <option key={r._id} value={r._id}>{r.name} — {r.description}</option>
                                            ))}
                                        </select>
                                        {errors.roleId && <p className="form-error">{errors.roleId.message}</p>}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                                    <button type="button" className="btn-secondary" onClick={() => { setShowCreate(false); reset(); }}>Cancel</button>
                                    <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                                        {createMutation.isPending ? 'Creating...' : 'Create User'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fingerprint Registration Modal */}
            <AnimatePresence>
                {fingerprintModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setFingerprintModal(null)}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            style={{ maxWidth: 480 }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                <div style={{ width: 44, height: 44, background: 'rgba(99,102,241,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Fingerprint size={22} color="#6366f1" />
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Register Fingerprint</h3>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>User: {fingerprintModal.name}</p>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                                Scan the user's fingerprint using the Mantra MFS100 device and paste the resulting base64 template key below.
                            </p>
                            <div style={{ marginBottom: 20 }}>
                                <label className="form-label">Fingerprint Template Key *</label>
                                <textarea
                                    value={fingerprintKey}
                                    onChange={e => setFingerprintKey(e.target.value)}
                                    className="form-input"
                                    rows={4}
                                    placeholder="Paste the base64 fingerprint template string from the Mantra SDK..."
                                    style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button className="btn-secondary" onClick={() => setFingerprintModal(null)}>Cancel</button>
                                <button
                                    className="btn-primary"
                                    onClick={() => fingerprintMutation.mutate()}
                                    disabled={fingerprintKey.length < 10 || fingerprintMutation.isPending}
                                >
                                    <Fingerprint size={14} />
                                    {fingerprintMutation.isPending ? 'Registering...' : 'Register Fingerprint'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
