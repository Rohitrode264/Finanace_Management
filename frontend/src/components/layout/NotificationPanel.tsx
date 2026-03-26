import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Bell, CreditCard, GraduationCap, BookOpen,
    TrendingUp, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { formatCurrency } from '../../utils/currency';

interface NotificationPanelProps {
    open: boolean;
    onClose: () => void;
}

interface DashboardStats {
    daily?: {
        totalCollected?: number;
        entryCount?: number;
        netReceipts?: number;
        totalCancellations?: number;
        totalConcessions?: number;
    };
    stats?: {
        totalStudents?: number;
        totalEnrollments?: number;
        totalClasses?: number;
    };
}

function buildNotifications(stats: DashboardStats | undefined) {
    if (!stats) return [];
    const items = [];
    const { daily, stats: s } = stats;

    if (daily?.totalCollected) {
        items.push({
            id: 'collected',
            icon: CreditCard,
            color: '#10b981',
            bg: 'rgba(16,185,129,0.10)',
            title: "Today's Collection",
            desc: `${formatCurrency(daily.totalCollected)} received across ${daily.entryCount ?? 0} entries`,
        });
    }

    if (daily?.totalCancellations && daily.totalCancellations > 0) {
        items.push({
            id: 'cancelled',
            icon: AlertCircle,
            color: '#ef4444',
            bg: 'rgba(239,68,68,0.10)',
            title: 'Cancellations Today',
            desc: `${formatCurrency(daily.totalCancellations)} in cancelled payments`,
        });
    }

    if (daily?.totalConcessions && daily.totalConcessions > 0) {
        items.push({
            id: 'concessions',
            icon: TrendingUp,
            color: '#f59e0b',
            bg: 'rgba(245,158,11,0.10)',
            title: 'Concessions Applied',
            desc: `${formatCurrency(daily.totalConcessions)} in concessions`,
        });
    }

    if (s?.totalStudents) {
        items.push({
            id: 'students',
            icon: GraduationCap,
            color: '#4f6ef7',
            bg: 'rgba(79,110,247,0.10)',
            title: 'Student Registry',
            desc: `${s.totalStudents} students registered in the system`,
        });
    }

    if (s?.totalEnrollments) {
        items.push({
            id: 'enrollments',
            icon: BookOpen,
            color: '#8b5cf6',
            bg: 'rgba(139,92,246,0.10)',
            title: 'Active Enrollments',
            desc: `${s.totalEnrollments} students currently enrolled in classes`,
        });
    }

    if (daily?.netReceipts) {
        items.push({
            id: 'net',
            icon: CheckCircle2,
            color: '#10b981',
            bg: 'rgba(16,185,129,0.10)',
            title: 'Net Revenue Today',
            desc: `${formatCurrency(daily.netReceipts)} net after concessions & cancellations`,
        });
    }

    return items;
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
    const { data, isLoading } = useQuery({
        queryKey: ['dashboard', 'stats'],
        queryFn: () => apiClient.get('/reports/dashboard-stats'),
        enabled: open,
        refetchInterval: 10000,
    });

    const stats = data?.data?.data as DashboardStats | undefined;
    const notifs = buildNotifications(stats);
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(0,0,0,0.25)',
                            zIndex: 8999,
                        }}
                    />

                    {/* Panel */}
                    <motion.div
                        className="notif-panel"
                        initial={{ x: 360, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 360, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    >
                        {/* Header */}
                        <div className="notif-panel-header">
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Bell size={15} color="var(--accent)" />
                                    <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        Activity
                                    </span>
                                    {notifs.length > 0 && (
                                        <span style={{
                                            background: 'var(--accent)',
                                            color: '#fff',
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            borderRadius: 99,
                                            padding: '1px 6px',
                                            minWidth: 18,
                                            textAlign: 'center',
                                        }}>
                                            {notifs.length}
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                    Live summary · {timeStr}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="btn-icon"
                                style={{ width: 30, height: 30 }}
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                            {isLoading ? (
                                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                            <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
                                            <div style={{ flex: 1 }}>
                                                <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 6 }} />
                                                <div className="skeleton" style={{ height: 10, width: '85%' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : notifs.length === 0 ? (
                                <div className="data-empty">
                                    <div className="data-empty-icon">
                                        <Bell size={22} color="var(--text-muted)" />
                                    </div>
                                    <h4>No activity yet</h4>
                                    <p>Today's financial activity will appear here as it happens.</p>
                                </div>
                            ) : (
                                notifs.map((n, i) => (
                                    <motion.div
                                        key={n.id}
                                        className="notif-item"
                                        initial={{ opacity: 0, x: 16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                    >
                                        <div className="notif-icon" style={{ background: n.bg }}>
                                            <n.icon size={16} color={n.color} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {n.title}
                                            </div>
                                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5 }}>
                                                {n.desc}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer note */}
                        <div style={{
                            padding: '12px 20px',
                            borderTop: '1px solid var(--border)',
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            textAlign: 'center',
                        }}>
                            Auto-refreshes every 10 seconds
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
