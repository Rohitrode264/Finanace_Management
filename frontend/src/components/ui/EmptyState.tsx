import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

// ── Inline SVG illustrations for different empty states ──

const illustrations: Record<string, ReactNode> = {
    students: (
        <svg width="180" height="140" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="90" cy="130" rx="70" ry="8" fill="var(--bg-muted)" opacity="0.5" />
            <rect x="45" y="25" width="90" height="95" rx="12" fill="var(--bg-subtle)" stroke="var(--border)" strokeWidth="1.5" />
            <circle cx="90" cy="58" r="18" fill="var(--accent-light)" stroke="var(--accent)" strokeWidth="1.5" />
            <path d="M82 56 L88 62 L98 52" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5"/>
            <rect x="65" y="84" width="50" height="6" rx="3" fill="var(--border)" />
            <rect x="72" y="96" width="36" height="5" rx="2.5" fill="var(--border-subtle)" />
            <circle cx="135" cy="35" r="4" fill="var(--accent)" opacity="0.15" />
            <circle cx="45" cy="45" r="3" fill="var(--warning)" opacity="0.15" />
            <circle cx="148" cy="70" r="5" fill="var(--success)" opacity="0.1" />
        </svg>
    ),
    classes: (
        <svg width="180" height="140" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="90" cy="130" rx="70" ry="8" fill="var(--bg-muted)" opacity="0.5" />
            <rect x="30" y="40" width="55" height="70" rx="8" fill="var(--bg-subtle)" stroke="var(--border)" strokeWidth="1.5" />
            <rect x="37" y="52" width="18" height="3" rx="1.5" fill="var(--accent)" opacity="0.6" />
            <rect x="37" y="60" width="40" height="3" rx="1.5" fill="var(--border)" />
            <rect x="37" y="68" width="30" height="3" rx="1.5" fill="var(--border)" />
            <rect x="37" y="82" width="40" height="14" rx="4" fill="var(--accent-light)" stroke="var(--accent)" strokeWidth="1" opacity="0.6" />
            <rect x="95" y="30" width="55" height="70" rx="8" fill="var(--bg-subtle)" stroke="var(--border)" strokeWidth="1.5" />
            <rect x="102" y="42" width="18" height="3" rx="1.5" fill="var(--success)" opacity="0.6" />
            <rect x="102" y="50" width="40" height="3" rx="1.5" fill="var(--border)" />
            <rect x="102" y="58" width="30" height="3" rx="1.5" fill="var(--border)" />
            <rect x="102" y="72" width="40" height="14" rx="4" fill="var(--success-light)" stroke="var(--success)" strokeWidth="1" opacity="0.6" />
            <circle cx="155" cy="25" r="4" fill="var(--accent)" opacity="0.12" />
            <circle cx="28" cy="35" r="3" fill="var(--warning)" opacity="0.12" />
        </svg>
    ),
    enrollments: (
        <svg width="180" height="140" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="90" cy="130" rx="70" ry="8" fill="var(--bg-muted)" opacity="0.5" />
            <rect x="40" y="20" width="100" height="100" rx="14" fill="var(--bg-subtle)" stroke="var(--border)" strokeWidth="1.5" />
            <path d="M65 55 L90 75 L115 55" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <rect x="58" y="55" width="64" height="40" rx="6" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.4" />
            <rect x="70" y="85" width="40" height="5" rx="2.5" fill="var(--border)" />
            <circle cx="90" cy="42" r="8" fill="var(--accent-light)" stroke="var(--accent)" strokeWidth="1" />
            <circle cx="145" cy="30" r="5" fill="var(--success)" opacity="0.1" />
            <circle cx="35" cy="55" r="3" fill="var(--warning)" opacity="0.12" />
        </svg>
    ),
    payments: (
        <svg width="180" height="140" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="90" cy="130" rx="70" ry="8" fill="var(--bg-muted)" opacity="0.5" />
            <rect x="35" y="35" width="110" height="70" rx="10" fill="var(--bg-subtle)" stroke="var(--border)" strokeWidth="1.5" />
            <rect x="35" y="52" width="110" height="14" fill="var(--border)" opacity="0.3" />
            <rect x="45" y="75" width="35" height="6" rx="3" fill="var(--border)" />
            <rect x="45" y="85" width="25" height="5" rx="2.5" fill="var(--border-subtle)" />
            <circle cx="128" cy="82" r="10" fill="var(--accent-light)" stroke="var(--accent)" strokeWidth="1" />
            <text x="125" y="86" fontSize="10" fontWeight="700" fill="var(--accent)">₹</text>
            <circle cx="150" cy="30" r="4" fill="var(--success)" opacity="0.12" />
            <circle cx="30" cy="50" r="3" fill="var(--accent)" opacity="0.12" />
        </svg>
    ),
    reports: (
        <svg width="180" height="140" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="90" cy="130" rx="70" ry="8" fill="var(--bg-muted)" opacity="0.5" />
            <rect x="50" y="20" width="80" height="100" rx="10" fill="var(--bg-subtle)" stroke="var(--border)" strokeWidth="1.5" />
            <rect x="60" y="35" width="20" height="40" rx="3" fill="var(--accent)" opacity="0.2" />
            <rect x="60" y="55" width="20" height="20" rx="3" fill="var(--accent)" opacity="0.5" />
            <rect x="85" y="45" width="20" height="30" rx="3" fill="var(--success)" opacity="0.2" />
            <rect x="85" y="60" width="20" height="15" rx="3" fill="var(--success)" opacity="0.5" />
            <rect x="110" y="35" width="10" height="40" rx="3" fill="var(--warning)" opacity="0.2" />
            <rect x="110" y="50" width="10" height="25" rx="3" fill="var(--warning)" opacity="0.5" />
            <rect x="60" y="90" width="60" height="5" rx="2.5" fill="var(--border)" />
            <rect x="68" y="100" width="45" height="4" rx="2" fill="var(--border-subtle)" />
        </svg>
    ),
    users: (
        <svg width="180" height="140" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="90" cy="130" rx="70" ry="8" fill="var(--bg-muted)" opacity="0.5" />
            <circle cx="90" cy="50" r="20" fill="var(--accent-light)" stroke="var(--accent)" strokeWidth="1.5" />
            <circle cx="90" cy="45" r="8" fill="var(--accent)" opacity="0.3" />
            <path d="M72 60 Q90 78 108 60" fill="var(--accent)" opacity="0.15" />
            <circle cx="55" cy="65" r="14" fill="var(--bg-subtle)" stroke="var(--border)" strokeWidth="1" />
            <circle cx="55" cy="62" r="5" fill="var(--border)" />
            <circle cx="125" cy="65" r="14" fill="var(--bg-subtle)" stroke="var(--border)" strokeWidth="1" />
            <circle cx="125" cy="62" r="5" fill="var(--border)" />
            <rect x="60" y="95" width="60" height="6" rx="3" fill="var(--border)" />
            <rect x="70" y="106" width="40" height="5" rx="2.5" fill="var(--border-subtle)" />
        </svg>
    ),
    ledger: (
        <svg width="180" height="140" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="90" cy="130" rx="70" ry="8" fill="var(--bg-muted)" opacity="0.5" />
            <rect x="40" y="20" width="100" height="100" rx="10" fill="var(--bg-subtle)" stroke="var(--border)" strokeWidth="1.5" />
            <line x1="55" y1="42" x2="125" y2="42" stroke="var(--border)" strokeWidth="1" />
            <line x1="55" y1="58" x2="125" y2="58" stroke="var(--border)" strokeWidth="1" />
            <line x1="55" y1="74" x2="125" y2="74" stroke="var(--border)" strokeWidth="1" />
            <line x1="55" y1="90" x2="125" y2="90" stroke="var(--border)" strokeWidth="1" />
            <rect x="55" y="32" width="30" height="5" rx="2.5" fill="var(--accent)" opacity="0.4" />
            <rect x="100" y="32" width="20" height="5" rx="2.5" fill="var(--success)" opacity="0.4" />
            <rect x="55" y="48" width="25" height="5" rx="2.5" fill="var(--border)" />
            <rect x="100" y="48" width="20" height="5" rx="2.5" fill="var(--danger)" opacity="0.3" />
            <rect x="55" y="64" width="35" height="5" rx="2.5" fill="var(--border)" />
            <rect x="100" y="64" width="20" height="5" rx="2.5" fill="var(--success)" opacity="0.3" />
            <rect x="55" y="80" width="28" height="5" rx="2.5" fill="var(--border)" />
            <rect x="100" y="80" width="20" height="5" rx="2.5" fill="var(--success)" opacity="0.3" />
            <rect x="60" y="100" width="60" height="6" rx="3" fill="var(--accent-light)" />
        </svg>
    ),
    categories: (
        <svg width="180" height="140" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="90" cy="130" rx="70" ry="8" fill="var(--bg-muted)" opacity="0.5" />
            <rect x="30" y="40" width="50" height="50" rx="12" fill="var(--accent-light)" stroke="var(--accent)" strokeWidth="1" opacity="0.6" />
            <rect x="65" y="30" width="50" height="50" rx="12" fill="var(--success-light)" stroke="var(--success)" strokeWidth="1" opacity="0.6" />
            <rect x="100" y="50" width="50" height="50" rx="12" fill="var(--warning-light)" stroke="var(--warning)" strokeWidth="1" opacity="0.6" />
            <rect x="45" y="55" width="20" height="4" rx="2" fill="var(--accent)" opacity="0.5" />
            <rect x="80" y="45" width="20" height="4" rx="2" fill="var(--success)" opacity="0.5" />
            <rect x="115" y="65" width="20" height="4" rx="2" fill="var(--warning)" opacity="0.5" />
            <rect x="45" y="63" width="14" height="3" rx="1.5" fill="var(--border)" />
            <rect x="80" y="53" width="14" height="3" rx="1.5" fill="var(--border)" />
            <rect x="115" y="73" width="14" height="3" rx="1.5" fill="var(--border)" />
        </svg>
    ),
    audit: (
        <svg width="180" height="140" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="90" cy="130" rx="70" ry="8" fill="var(--bg-muted)" opacity="0.5" />
            <rect x="45" y="20" width="90" height="100" rx="12" fill="var(--bg-subtle)" stroke="var(--border)" strokeWidth="1.5" />
            <circle cx="65" cy="45" r="6" fill="var(--success-light)" stroke="var(--success)" strokeWidth="1" />
            <rect x="78" y="42" width="45" height="5" rx="2.5" fill="var(--border)" />
            <circle cx="65" cy="65" r="6" fill="var(--accent-light)" stroke="var(--accent)" strokeWidth="1" />
            <rect x="78" y="62" width="35" height="5" rx="2.5" fill="var(--border)" />
            <circle cx="65" cy="85" r="6" fill="var(--warning-light)" stroke="var(--warning)" strokeWidth="1" />
            <rect x="78" y="82" width="40" height="5" rx="2.5" fill="var(--border)" />
            <path d="M63 43 L65 46 L68 41" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
    ),
    search: (
        <svg width="180" height="140" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="90" cy="130" rx="70" ry="8" fill="var(--bg-muted)" opacity="0.5" />
            <circle cx="82" cy="60" r="30" fill="var(--bg-subtle)" stroke="var(--border)" strokeWidth="2" />
            <circle cx="82" cy="60" r="18" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 3" />
            <line x1="103" y1="82" x2="125" y2="104" stroke="var(--border-strong)" strokeWidth="4" strokeLinecap="round" />
            <line x1="104" y1="83" x2="124" y2="103" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
            <text x="76" y="65" fontSize="14" fill="var(--accent)" opacity="0.4" fontWeight="600">?</text>
        </svg>
    ),
    default: (
        <svg width="180" height="140" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="90" cy="130" rx="70" ry="8" fill="var(--bg-muted)" opacity="0.5" />
            <rect x="45" y="25" width="90" height="90" rx="14" fill="var(--bg-subtle)" stroke="var(--border)" strokeWidth="1.5" />
            <rect x="60" y="50" width="60" height="5" rx="2.5" fill="var(--border)" />
            <rect x="70" y="62" width="40" height="5" rx="2.5" fill="var(--border-subtle)" />
            <rect x="65" y="74" width="50" height="5" rx="2.5" fill="var(--border-subtle)" />
            <circle cx="90" cy="38" r="6" fill="var(--accent-light)" stroke="var(--accent)" strokeWidth="1" />
        </svg>
    ),
};

interface EmptyStateProps {
    /** The illustration type to show */
    type?: keyof typeof illustrations | string;
    /** The heading text */
    title: string;
    /** The description text */
    description?: string;
    /** Optional action button */
    action?: ReactNode;
}

export function EmptyState({ type = 'default', title, description, action }: EmptyStateProps) {
    const illustration = illustrations[type] || illustrations.default;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 24px',
                textAlign: 'center',
            }}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                style={{ marginBottom: 20 }}
            >
                {illustration}
            </motion.div>

            <h4 style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 6,
                letterSpacing: '-0.01em',
            }}>
                {title}
            </h4>

            {description && (
                <p style={{
                    fontSize: '0.8125rem',
                    color: 'var(--text-muted)',
                    maxWidth: 320,
                    lineHeight: 1.6,
                    margin: 0,
                }}>
                    {description}
                </p>
            )}

            {action && (
                <div style={{ marginTop: 20 }}>
                    {action}
                </div>
            )}
        </motion.div>
    );
}
