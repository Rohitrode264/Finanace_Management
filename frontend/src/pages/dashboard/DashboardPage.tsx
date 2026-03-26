import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    GraduationCap, Plus, CreditCard, FileText, ArrowUpRight,
    School, BookOpen, IndianRupee, Layers, RefreshCw,
    TrendingUp, CheckCircle2, AlertCircle, Minus,
} from 'lucide-react';
import { StatsCard } from '../../components/ui/StatsCard';
import { usePermission } from '../../hooks/usePermission';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';
import { formatCurrency } from '../../utils/currency';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

/** Time-based greeting */
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

/** Formatted date */
function getDateString() {
    return new Date().toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
}

const REFETCH_INTERVAL = 30; // seconds

export function DashboardPage() {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const canCreatePayment = usePermission('CREATE_PAYMENT');
    const canViewReport = usePermission('VIEW_REPORT');
    const canViewStudent = usePermission('VIEW_STUDENT');
    const canCreateStudent = usePermission('CREATE_STUDENT');

    const [countdown, setCountdown] = useState(REFETCH_INTERVAL);

    const { data: dashboardRes, dataUpdatedAt } = useQuery({
        queryKey: ['dashboard', 'stats'],
        queryFn: () => apiClient.get('/reports/dashboard-stats'),
        refetchInterval: REFETCH_INTERVAL * 1000,
    });

    // Countdown timer synced to refetch interval
    useEffect(() => {
        setCountdown(REFETCH_INTERVAL);
        const timer = setInterval(() => {
            setCountdown((c) => (c <= 1 ? REFETCH_INTERVAL : c - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [dataUpdatedAt]);

    const stats = dashboardRes?.data?.data;
    const dailyReport = stats?.daily;
    const totalStudents = stats?.stats?.totalStudents ?? 0;
    const totalEnrollments = stats?.stats?.totalEnrollments ?? 0;
    const totalClasses = stats?.stats?.totalClasses ?? 0;

    const summaryRows = [
        { label: 'Total Collected', value: dailyReport?.totalCollected, color: 'var(--success)', icon: TrendingUp },
        { label: 'Concessions Applied', value: dailyReport?.totalConcessions, color: 'var(--warning)', icon: Minus },
        { label: 'Cancellations', value: dailyReport?.totalCancellations, color: 'var(--danger)', icon: AlertCircle },
        { label: 'Net Receipts', value: dailyReport?.netReceipts, color: 'var(--accent)', icon: CheckCircle2 },
    ];

    const quickActions = [
        { label: 'Record Payment', icon: CreditCard, color: 'var(--accent)', bg: 'var(--accent-light)', path: '/payments', allowed: canCreatePayment },
        { label: 'Add Student', icon: Plus, color: 'var(--success)', bg: 'var(--success-light)', path: '/students', allowed: canCreateStudent },
        { label: 'View Reports', icon: FileText, color: 'var(--info)', bg: 'var(--info-light)', path: '/reports', allowed: canViewReport },
        { label: 'Student Ledger', icon: Layers, color: 'var(--warning)', bg: 'var(--warning-light)', path: '/ledger', allowed: canViewReport },
    ].filter((a) => a.allowed);

    const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
    const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

    return (
        <div style={{ maxWidth: 1400 }}>

            {/* ── Greeting ─────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    display: 'flex', alignItems: 'flex-start',
                    justifyContent: 'space-between', gap: 16,
                    marginBottom: 28, flexWrap: 'wrap',
                }}
            >
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                        {getGreeting()},{' '}
                        <span style={{ color: 'var(--accent)' }}>{user?.name?.split(' ')[0]}</span>
                    </h2>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 5 }}>
                        {getDateString()}
                    </p>
                </div>

                {/* Refresh indicator */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '6px 12px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.74rem', color: 'var(--text-muted)',
                    fontWeight: 500,
                    boxShadow: 'var(--shadow-xs)',
                }}>
                    <RefreshCw size={12} style={{ color: 'var(--accent)' }} />
                    <span>Auto-refresh in <strong style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{countdown}s</strong></span>
                </div>
            </motion.div>

            {/* ── Stats Cards ──────────────────────────────── */}
            <motion.div
                variants={stagger} initial="hidden" animate="show"
                className="stats-grid"
                style={{ marginBottom: 24 }}
            >
                {canViewReport && (
                    <motion.div variants={item}>
                        <StatsCard
                            title="Today's Collected"
                            value={dailyReport?.totalCollected ?? 0}
                            icon={IndianRupee}
                            color="emerald"
                            isCurrency
                            subtitle={`Net: ${formatCurrency(dailyReport?.netReceipts ?? 0)}`}
                        />
                    </motion.div>
                )}
                {canViewReport && (
                    <motion.div variants={item}>
                        <StatsCard
                            title="Ledger Entries Today"
                            value={dailyReport?.entryCount ?? 0}
                            icon={Layers}
                            color="indigo"
                            subtitle="All credit & debit events"
                        />
                    </motion.div>
                )}
                {canViewStudent && (
                    <motion.div variants={item}>
                        <StatsCard
                            title="Total Students"
                            value={totalStudents}
                            icon={GraduationCap}
                            color="blue"
                            subtitle="Registered in system"
                        />
                    </motion.div>
                )}
                {canViewReport && (
                    <motion.div variants={item}>
                        <StatsCard
                            title="Active Classes"
                            value={totalClasses}
                            icon={School}
                            color="amber"
                            subtitle="Current academic year"
                        />
                    </motion.div>
                )}
                {canViewReport && (
                    <motion.div variants={item}>
                        <StatsCard
                            title="Total Enrollments"
                            value={totalEnrollments}
                            icon={BookOpen}
                            color="purple"
                            subtitle="Active student placements"
                        />
                    </motion.div>
                )}
            </motion.div>

            {/* ── Quick Actions + Summary ──────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}
            >
                {/* Quick Actions */}
                {quickActions.length > 0 && (
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                            Quick Actions
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
                            {quickActions.map((a) => (
                                <button
                                    key={a.path}
                                    onClick={() => navigate(a.path)}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        gap: 8, padding: '14px 10px',
                                        background: a.bg,
                                        border: `1px solid ${a.color}22`,
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        transition: 'all var(--transition-base)',
                                        fontFamily: 'var(--font-sans)',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                                >
                                    <div style={{
                                        width: 36, height: 36,
                                        background: `${a.color}18`,
                                        borderRadius: 'var(--radius-sm)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <a.icon size={17} color={a.color} />
                                    </div>
                                    <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.3 }}>
                                        {a.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Today's Financial Summary */}
                {canViewReport && dailyReport && (
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                            Today's Summary
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {summaryRows.map((row) => (
                                <div
                                    key={row.label}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '10px 12px',
                                        background: 'var(--bg-subtle)',
                                        borderRadius: 'var(--radius-sm)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{
                                            width: 26, height: 26,
                                            background: `${row.color}18`,
                                            borderRadius: 6,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <row.icon size={13} color={row.color} />
                                        </div>
                                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                            {row.label}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: row.color, fontVariantNumeric: 'tabular-nums' }}>
                                        {formatCurrency(row.value ?? 0)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>

            {/* ── Reports CTA ──────────────────────────────── */}
            {canViewReport && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                >
                    <div
                        className="card card-interactive"
                        style={{
                            padding: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 16,
                            background: 'var(--bg-subtle)',
                            borderColor: 'var(--border)',
                            cursor: 'pointer',
                        }}
                        onClick={() => navigate('/reports')}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{
                                width: 40, height: 40,
                                background: 'var(--accent-light)',
                                borderRadius: 'var(--radius-sm)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <FileText size={18} color="var(--accent)" />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    Full Financial Reports
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                    View daily collections, enrollment ledgers, and outstanding balances
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--accent)', fontSize: '0.8125rem', fontWeight: 600, flexShrink: 0 }}>
                            View Reports
                            <ArrowUpRight size={15} />
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
