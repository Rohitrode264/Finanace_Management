import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UserPlus, Calendar, TrendingUp, Users } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import apiClient from '../../api/client';
import { formatCurrency } from '../../utils/currency';
import { format } from 'date-fns';

export function AdmissionsPage() {
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Fetch daily report for the selected date — this gives us newAdmissions data
    const { data: reportRes, isLoading } = useQuery({
        queryKey: ['admissions-daily', selectedDate],
        queryFn: () => apiClient.get(`/reports/daily?date=${selectedDate}`),
    });

    const daily = reportRes?.data?.data;
    const newAdmissions = daily?.newAdmissions;
    const admissionCount = newAdmissions?.total ?? 0;
    const admissionStudents: {
        name: string;
        admissionNumber: string;
        deposited: number;
        totalPaid: number;
        left: number;
        collectedBy: string;
    }[] = newAdmissions?.students ?? [];

    const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

    // Quick stats
    const totalDeposited = admissionStudents.reduce((sum, s) => sum + s.deposited, 0);
    const totalOutstanding = admissionStudents.reduce((sum, s) => sum + s.left, 0);

    return (
        <div style={{ maxWidth: 1200 }}>
            <PageHeader
                title="Daily Admissions"
                subtitle="Track new student admissions on any date — visible to all staff."
            />

            {/* ── Date Picker + Stats ──────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 24 }}
            >
                <div className="card" style={{ padding: 24 }}>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        gap: 16, flexWrap: 'wrap', marginBottom: 24,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 44, height: 44,
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                borderRadius: 12,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                            }}>
                                <Calendar size={22} color="#fff" />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Select Date
                                </div>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    max={format(new Date(), 'yyyy-MM-dd')}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="form-input"
                                    style={{
                                        padding: '8px 14px', fontSize: '0.9375rem', fontWeight: 700,
                                        width: 200, marginTop: 4,
                                        background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Date display */}
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                                {isToday ? "Today's Count" : 'Admissions on this date'}
                            </div>
                            <div style={{
                                fontSize: '3rem', fontWeight: 900, lineHeight: 1,
                                color: admissionCount > 0 ? '#6366f1' : 'var(--text-muted)',
                                marginTop: 4,
                            }}>
                                {isLoading ? '...' : admissionCount}
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>
                                new {admissionCount === 1 ? 'student' : 'students'}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Row */}
                    {admissionCount > 0 && (
                        <div className="stats-grid" style={{ marginBottom: 0 }}>
                            <div className="stat-card" style={{ borderLeftColor: '#6366f1' }}>
                                <div style={{ padding: '14px 18px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <UserPlus size={14} color="#6366f1" />
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>New Students</span>
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#6366f1' }}>{admissionCount}</div>
                                </div>
                            </div>
                            <div className="stat-card" style={{ borderLeftColor: '#10b981' }}>
                                <div style={{ padding: '14px 18px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <TrendingUp size={14} color="#10b981" />
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Deposited</span>
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981' }}>{formatCurrency(totalDeposited)}</div>
                                </div>
                            </div>
                            <div className="stat-card" style={{ borderLeftColor: '#ef4444' }}>
                                <div style={{ padding: '14px 18px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <Users size={14} color="#ef4444" />
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Outstanding</span>
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ef4444' }}>{formatCurrency(totalOutstanding)}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* ── Student List ──────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
            >
                {isLoading ? (
                    <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                        <div className="spin" style={{
                            width: 36, height: 36, margin: '0 auto 16px',
                            border: '3px solid var(--border)', borderTopColor: '#6366f1', borderRadius: '50%',
                        }} />
                        <p style={{ color: 'var(--text-muted)' }}>Loading admissions data...</p>
                    </div>
                ) : admissionCount === 0 ? (
                    <div className="card">
                        <EmptyState
                            type="students"
                            title={isToday ? 'No New Admissions Today' : `No Admissions on ${format(new Date(selectedDate + 'T00:00:00'), 'dd MMM yyyy')}`}
                            description={isToday
                                ? 'New student registrations will appear here as they are enrolled.'
                                : 'No new students were enrolled on this date. Try a different date.'
                            }
                        />
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="table-container desktop-only">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: 40 }}>#</th>
                                        <th>Student Name</th>
                                        <th>Adm. No.</th>
                                        <th style={{ textAlign: 'right' }}>Deposited</th>
                                        <th style={{ textAlign: 'right' }}>Total Paid</th>
                                        <th style={{ textAlign: 'right' }}>Outstanding</th>
                                        <th>Collected By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {admissionStudents.map((s, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{i + 1}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{
                                                        width: 32, height: 32, borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#fff', fontWeight: 700, fontSize: '0.75rem',
                                                        flexShrink: 0,
                                                    }}>
                                                        {s.name.charAt(0)}
                                                    </div>
                                                    <span style={{ fontWeight: 700 }}>{s.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                                {s.admissionNumber}
                                            </td>
                                            <td className="financial-value" style={{ color: '#10b981' }}>
                                                {formatCurrency(s.deposited)}
                                            </td>
                                            <td className="financial-value">
                                                {formatCurrency(s.totalPaid)}
                                            </td>
                                            <td className="financial-value" style={{ color: s.left > 0 ? '#ef4444' : '#10b981' }}>
                                                {formatCurrency(s.left)}
                                            </td>
                                            <td style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6366f1' }}>
                                                {s.collectedBy}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={3} style={{ fontWeight: 800 }}>
                                            Total ({admissionCount} students)
                                        </td>
                                        <td className="financial-value" style={{ color: '#10b981' }}>
                                            {formatCurrency(totalDeposited)}
                                        </td>
                                        <td className="financial-value">
                                            {formatCurrency(admissionStudents.reduce((s, x) => s + x.totalPaid, 0))}
                                        </td>
                                        <td className="financial-value" style={{ color: '#ef4444' }}>
                                            {formatCurrency(totalOutstanding)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="mobile-card">
                            {admissionStudents.map((s, i) => (
                                <div key={i} className="mobile-card-item">
                                    <div className="mobile-card-header">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontWeight: 700, fontSize: '0.8rem',
                                                flexShrink: 0,
                                            }}>
                                                {s.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="mobile-card-title">{s.name}</div>
                                                <div className="mobile-card-subtitle">{s.admissionNumber}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mobile-card-row">
                                        <span className="mobile-card-row-label">Deposited</span>
                                        <span className="mobile-card-row-value" style={{ color: '#10b981' }}>
                                            {formatCurrency(s.deposited)}
                                        </span>
                                    </div>
                                    <div className="mobile-card-row">
                                        <span className="mobile-card-row-label">Total Paid</span>
                                        <span className="mobile-card-row-value">
                                            {formatCurrency(s.totalPaid)}
                                        </span>
                                    </div>
                                    <div className="mobile-card-row">
                                        <span className="mobile-card-row-label">Outstanding</span>
                                        <span className="mobile-card-row-value" style={{ color: s.left > 0 ? '#ef4444' : '#10b981' }}>
                                            {formatCurrency(s.left)}
                                        </span>
                                    </div>
                                    <div className="mobile-card-footer">
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            Collected by <strong style={{ color: '#6366f1' }}>{s.collectedBy}</strong>
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {/* Mobile Summary */}
                            <div style={{
                                padding: 16, background: 'var(--bg-subtle)',
                                borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                                marginTop: 4,
                            }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
                                    Summary — {admissionCount} students
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontSize: '0.8125rem' }}>Total Deposited</span>
                                    <strong style={{ color: '#10b981' }}>{formatCurrency(totalDeposited)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.8125rem' }}>Total Outstanding</span>
                                    <strong style={{ color: '#ef4444' }}>{formatCurrency(totalOutstanding)}</strong>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
}
