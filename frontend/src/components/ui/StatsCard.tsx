import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: 'indigo' | 'emerald' | 'amber' | 'red' | 'blue' | 'purple';
    subtitle?: string;
    trend?: number;
    isCurrency?: boolean;
}

const COLOR_MAP = {
    indigo:  { iconBg: 'rgba(79,110,247,0.10)',   iconColor: '#4f6ef7',  accent: '#4f6ef7' },
    emerald: { iconBg: 'rgba(16,185,129,0.10)',   iconColor: '#10b981',  accent: '#10b981' },
    amber:   { iconBg: 'rgba(245,158,11,0.10)',   iconColor: '#f59e0b',  accent: '#f59e0b' },
    red:     { iconBg: 'rgba(239,68,68,0.10)',    iconColor: '#ef4444',  accent: '#ef4444' },
    blue:    { iconBg: 'rgba(59,130,246,0.10)',   iconColor: '#3b82f6',  accent: '#3b82f6' },
    purple:  { iconBg: 'rgba(139,92,246,0.10)',   iconColor: '#8b5cf6',  accent: '#8b5cf6' },
};

export function StatsCard({ title, value, icon: Icon, color, subtitle, trend, isCurrency }: StatsCardProps) {
    const c = COLOR_MAP[color];
    const displayValue = isCurrency && typeof value === 'number' ? formatCurrency(value) : value;

    return (
        <div className={`stat-card stat-card-${color}`}>
            <div style={{ padding: '18px 18px 16px' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                    <p style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        lineHeight: 1.2,
                        maxWidth: '70%',
                    }}>
                        {title}
                    </p>
                    <div style={{
                        width: 38, height: 38,
                        background: c.iconBg,
                        borderRadius: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <Icon size={18} color={c.iconColor} strokeWidth={2} />
                    </div>
                </div>

                {/* Value */}
                <p style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                    marginBottom: 10,
                }}>
                    {displayValue}
                </p>

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {trend !== undefined && (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 2,
                            fontSize: '0.72rem', fontWeight: 700,
                            color: trend >= 0 ? '#10b981' : '#ef4444',
                            background: trend >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                            padding: '2px 6px',
                            borderRadius: 99,
                        }}>
                            {trend >= 0
                                ? <TrendingUp size={11} />
                                : <TrendingDown size={11} />
                            }
                            {Math.abs(trend)}%
                        </span>
                    )}
                    {subtitle && (
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                            {subtitle}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
