import { useQuery } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import apiClient from '../../api/client';
import { format } from 'date-fns';
import { usePermission } from '../../hooks/usePermission';

export function AuditLogsPage() {
    const canViewAudit = usePermission('VIEW_AUDIT_LOG');

    const { data: logsRes, isLoading } = useQuery({
        queryKey: ['audit-logs'],
        queryFn: () => apiClient.get('/audit-logs', { params: { limit: 100 } }),
        enabled: canViewAudit,
        refetchInterval: 3000,
    });

    const logs = logsRes?.data?.data || [];

    return (
        <div>
            <PageHeader
                title="Security Audit Logs"
                subtitle="Live tracking of critical system actions, permission changes, and staff activities."
            />

            <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <ClipboardList size={18} color="#6366f1" />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Activities</h3>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                        Live updating
                    </div>
                </div>

                <div className="table-container" style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
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
                                        No audit logs found.
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
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{log.actorId?.name || 'Vercel / System'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.actorId?.email || 'N/A'}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{log.entityType}</div>
                                            <code style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.entityId}</code>
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
            </div>
            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }`}</style>
        </div>
    );
}
