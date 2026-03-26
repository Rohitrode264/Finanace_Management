import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ClipboardList, Filter, ChevronLeft, ChevronRight, X, Calendar } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import apiClient from '../../api/client';
import { format } from 'date-fns';
import { usePermission } from '../../hooks/usePermission';

const AUDIT_ACTIONS = [
    'USER_LOGIN', 'USER_LOGOUT', 'USER_CREATED', 'USER_ACTIVATED', 'USER_DEACTIVATED',
    'PAYMENT_CREATED', 'PAYMENT_CANCELLED', 'CONCESSION_APPLIED',
    'ENROLLMENT_CREATED', 'ENROLLMENT_STATUS_CHANGED',
    'STUDENT_CREATED', 'STUDENT_UPDATED',
    'CLASS_CREATED', 'CLASS_UPDATED',
    'RECEIPT_PRINTED', 'RECEIPT_REPRINT_AUTHORIZED',
    'ROLE_CREATED', 'PERMISSION_GRANTED', 'PERMISSION_REVOKED',
    'REPORT_GENERATED', 'ADJUSTMENT_APPLIED',
    'ADMIN_SETUP', 'FINGERPRINT_REGISTERED', 'SETTING_UPDATED'
];

const ENTITY_TYPES = ['USER', 'PAYMENT', 'ENROLLMENT', 'STUDENT', 'CLASS', 'RECEIPT', 'ROLE', 'PERMISSION', 'REPORT', 'SETTING'];

export function AuditLogsPage() {
    const canViewAudit = usePermission('VIEW_AUDIT_LOG');

    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [action, setAction] = useState('');
    const [entityType, setEntityType] = useState('');
    const [actorId, setActorId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const { data: usersRes } = useQuery({
        queryKey: ['users'],
        queryFn: () => apiClient.get('/rbac/users'),
        enabled: canViewAudit,
    });
    const users = usersRes?.data?.data || [];

    const queryParams = {
        page,
        limit,
        action: action || undefined,
        entityType: entityType || undefined,
        actorId: actorId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
    };

    const { data: logsRes, isLoading } = useQuery({
        queryKey: ['audit-logs', queryParams],
        queryFn: () => apiClient.get('/audit-logs', { params: queryParams }),
        enabled: canViewAudit,
        placeholderData: keepPreviousData,
    });

    const logs = logsRes?.data?.data?.logs || [];
    const total = logsRes?.data?.data?.total || 0;
    const totalPages = Math.ceil(total / limit);

    const resetFilters = () => {
        setAction('');
        setEntityType('');
        setActorId('');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    return (
        <div style={{ paddingBottom: 40 }}>
            <PageHeader
                title="Security Audit Logs"
                subtitle="Live tracking of critical system actions, permission changes, and staff activities."
            />

            {/* Filters Section */}
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <Filter size={18} color="var(--primary)" />
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Filter Logs</h3>
                    {(action || entityType || actorId || startDate || endDate) && (
                        <button
                            onClick={resetFilters}
                            style={{
                                marginLeft: 'auto', background: 'none', border: 'none',
                                color: '#ef4444', fontSize: '0.75rem', display: 'flex',
                                alignItems: 'center', gap: 4, cursor: 'pointer', fontWeight: 600
                            }}
                        >
                            <X size={14} /> Clear Filters
                        </button>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Actor / User</label>
                        <select
                            value={actorId}
                            onChange={(e) => { setActorId(e.target.value); setPage(1); }}
                            className="input-base"
                            style={{ width: '100%' }}
                        >
                            <option value="">All Users</option>
                            {users.map((u: any) => <option key={u._id} value={u._id}>{u.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Action Type</label>
                        <select
                            value={action}
                            onChange={(e) => { setAction(e.target.value); setPage(1); }}
                            className="input-base"
                            style={{ width: '100%' }}
                        >
                            <option value="">All Actions</option>
                            {AUDIT_ACTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Entity Type</label>
                        <select
                            value={entityType}
                            onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
                            className="input-base"
                            style={{ width: '100%' }}
                        >
                            <option value="">All Entities</option>
                            {ENTITY_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>From Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                            className="input-base"
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>To Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                            className="input-base"
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <ClipboardList size={18} color="#6366f1" />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Activity Records</h3>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{total}</span> entries found
                    </div>
                </div>

                <div className="table-container" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <table className="data-table">
                        <thead>
                            <tr style={{ position: 'sticky', top: 0, background: 'var(--card)', zIndex: 1 }}>
                                <th>Timestamp</th>
                                <th>Action</th>
                                <th>Actor / User</th>
                                <th>Entity</th>
                                <th>IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                                        Loading audit logs...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                                        No audit logs found matching criteria.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log: any) => (
                                    <tr key={log._id}>
                                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                            {format(new Date(log.timestamp), 'dd MMM yyyy HH:mm:ss')}
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '3px 8px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600,
                                                background: 'rgba(99,102,241,0.1)', color: '#4f46e5'
                                            }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{log.actorId?.name || 'System / Auto'}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.actorId?.email || 'N/A'}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: '0.75rem' }}>{log.entityType}</div>
                                            <code style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--bg-muted)', padding: '2px 4px', borderRadius: 4 }}>
                                                {log.entityId}
                                            </code>
                                        </td>
                                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                            {log.ipAddress}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 24 }}>
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="btn-outline"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: '0.85rem' }}
                        >
                            <ChevronLeft size={16} /> Previous
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Page {page} of {totalPages}
                        </span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="btn-outline"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: '0.85rem' }}
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
            <style>{`
                .input-base {
                    padding: 8px 12px;
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    background: var(--card);
                    color: var(--text-primary);
                    font-size: 0.875rem;
                }
                .btn-outline {
                    background: var(--card);
                    border: 1px solid var(--border);
                    color: var(--text-primary);
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-outline:hover:not(:disabled) {
                    background: var(--bg-hover);
                    border-color: var(--text-muted);
                }
                .btn-outline:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}
