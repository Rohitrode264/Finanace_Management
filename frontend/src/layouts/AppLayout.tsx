import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarNav } from '../components/sidebar/SidebarNav';
import { AppHeader } from '../components/layout/AppHeader';
import { useThemeStore } from '../store/themeStore';
import { Toaster } from 'react-hot-toast';

// Route metadata for header titles
const ROUTE_META: Record<string, { title: string; subtitle: string }> = {
    '/dashboard':   { title: 'Dashboard',            subtitle: 'Overview of your financial institute operations.' },
    '/students':    { title: 'Student Management',   subtitle: 'Create, view, and manage student records.' },
    '/classes':     { title: 'Programs & Fees',      subtitle: 'Manage class templates, academic years, and fee structures.' },
    '/enrollments': { title: 'Enrollments',          subtitle: 'Enroll students into classes and manage fee installments.' },
    '/payments':    { title: 'Fee Collection',       subtitle: 'Record payments, allocate installments, and generate receipts.' },
    '/ledger':      { title: 'Student Ledger',       subtitle: 'Complete financial history and searchable past receipts.' },
    '/receipts':    { title: 'Receipts',             subtitle: 'View and print payment receipts.' },
    '/reports':     { title: 'Reports',              subtitle: 'Generate and export financial reports.' },
    '/users':       { title: 'User & Access Control',subtitle: 'Manage system users, assign roles, and control access.' },
    '/rbac':        { title: 'Roles & Permissions',  subtitle: 'Configure roles and map permissions across the system.' },
    '/audit':       { title: 'Audit Logs',           subtitle: 'Track all system actions with a full audit trail.' },
    '/settings':    { title: 'Settings',             subtitle: 'System configuration and preferences.' },
};

export function AppLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const applyTheme = useThemeStore((s) => s.applyTheme);

    useEffect(() => { applyTheme(); }, [applyTheme]);

    // Close mobile sidebar on route change
    useEffect(() => { setMobileOpen(false); }, [location.pathname]);

    const meta = ROUTE_META[location.pathname] ?? { title: 'Finance Management', subtitle: '' };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
            <SidebarNav
                collapsed={collapsed}
                onCollapse={() => setCollapsed((c) => !c)}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            {/* Mobile Backdrop */}
            {mobileOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999 }}
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Main content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                <AppHeader
                    title={meta.title}
                    subtitle={meta.subtitle}
                    onMenuClick={() => setMobileOpen(true)}
                />

                <main style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '24px 24px 40px',
                }}>
                    <div className="page-enter" key={location.pathname}>
                        <Outlet />
                    </div>
                </main>
            </div>

            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        fontSize: '0.8125rem',
                        boxShadow: 'var(--shadow-lg)',
                        padding: '10px 14px',
                    },
                    success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                    error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                }}
            />
        </div>
    );
}
