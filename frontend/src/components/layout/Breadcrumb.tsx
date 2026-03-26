import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
    dashboard:   'Dashboard',
    students:    'Students',
    classes:     'Programs & Fees',
    enrollments: 'Enrollments',
    payments:    'Fee Collection',
    ledger:      'Ledger',
    receipts:    'Receipts',
    reports:     'Reports',
    users:       'Users',
    rbac:        'Roles & RBAC',
    audit:       'Audit Logs',
    settings:    'Settings',
};

export function Breadcrumb() {
    const location = useLocation();
    const navigate = useNavigate();

    const segments = location.pathname
        .split('/')
        .filter(Boolean);

    if (segments.length === 0) return null;

    const crumbs = segments.map((seg, idx) => ({
        label: ROUTE_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
        path: '/' + segments.slice(0, idx + 1).join('/'),
        isLast: idx === segments.length - 1,
    }));

    return (
        <nav className="breadcrumb" aria-label="Breadcrumb">
            <span
                className="breadcrumb-item"
                onClick={() => navigate('/dashboard')}
                role="button"
                tabIndex={0}
                style={{ display: 'flex', alignItems: 'center', gap: 3 }}
            >
                <Home size={11} />
            </span>
            {crumbs.map((crumb) => (
                <span key={crumb.path} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ChevronRight size={11} className="breadcrumb-sep" style={{ color: 'var(--border-strong)', flexShrink: 0 }} />
                    <span
                        className={`breadcrumb-item ${crumb.isLast ? 'active' : ''}`}
                        onClick={() => !crumb.isLast && navigate(crumb.path)}
                        role={crumb.isLast ? undefined : 'button'}
                        tabIndex={crumb.isLast ? undefined : 0}
                    >
                        {crumb.label}
                    </span>
                </span>
            ))}
        </nav>
    );
}
