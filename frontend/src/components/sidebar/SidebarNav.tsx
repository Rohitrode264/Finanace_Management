import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Users, GraduationCap,
    CreditCard, School, BarChart3, ClipboardList,
    ShieldCheck, Settings, ChevronLeft, ChevronRight,
    BookOpen,
} from 'lucide-react';
import { usePermission } from '../../hooks/usePermission';
import { useAuthStore } from '../../store/authStore';

interface NavItem {
    label: string;
    icon: React.ElementType;
    path: string;
    permission: string | null;
    section: string;
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', permission: null, section: 'MAIN' },
    { label: 'Students', icon: GraduationCap, path: '/students', permission: 'VIEW_STUDENT', section: 'ACADEMIC' },
    { label: 'Programs & Fees', icon: School, path: '/classes', permission: 'VIEW_CLASS', section: 'ACADEMIC' },
    // { label: 'Categories', icon: ClipboardList, path: '/categories', permission: 'VIEW_CLASS', section: 'ACADEMIC' },
    { label: 'Enrollments', icon: BookOpen, path: '/enrollments', permission: 'VIEW_ENROLLMENT', section: 'ACADEMIC' },
    { label: 'Collect Payment', icon: CreditCard, path: '/payments', permission: 'CREATE_PAYMENT', section: 'FINANCE' },
    { label: 'Ledger', icon: ClipboardList, path: '/ledger', permission: 'VIEW_ENROLLMENT', section: 'FINANCE' },
    // { label: 'Receipts', icon: Receipt, path: '/receipts', permission: 'VIEW_RECEIPT', section: 'FINANCE' },
    { label: 'Reports', icon: BarChart3, path: '/reports', permission: 'VIEW_REPORT', section: 'FINANCE' },
    { label: 'Users', icon: Users, path: '/users', permission: 'MANAGE_PERMISSIONS', section: 'ADMIN' },
    { label: 'Roles & RBAC', icon: ShieldCheck, path: '/rbac', permission: 'MANAGE_ROLES', section: 'ADMIN' },
    { label: 'Audit Logs', icon: ClipboardList, path: '/audit', permission: 'VIEW_AUDIT_LOG', section: 'ADMIN' },
    { label: 'Settings', icon: Settings, path: '/settings', permission: null, section: 'SYSTEM' },
];

const SECTIONS = [
    { key: 'MAIN', label: 'Main' },
    { key: 'ACADEMIC', label: 'Academic' },
    { key: 'FINANCE', label: 'Finance' },
    { key: 'ADMIN', label: 'Administration' },
    { key: 'SYSTEM', label: 'System' },
];

const ROLE_DISPLAY: Record<string, { label: string; color: string }> = {
    SUPER_ADMIN: { label: 'Super Admin', color: '#ef4444' },
    ADMIN: { label: 'Admin', color: '#f59e0b' },
    INCHARGE: { label: 'Incharge', color: '#4f6ef7' },
    TEACHER: { label: 'Teacher', color: '#10b981' },
    RECEPTIONIST: { label: 'Reception', color: '#8b5cf6' },
};

interface SidebarNavProps {
    collapsed: boolean;
    onCollapse: () => void;
    mobileOpen?: boolean;
    setMobileOpen?: (open: boolean) => void;
}

function NavItemLink({ item, collapsed, setMobileOpen }: {
    item: NavItem;
    collapsed: boolean;
    setMobileOpen?: (o: boolean) => void;
}) {
    const allowed = usePermission(item.permission);
    if (!allowed) return null;

    return (
        <NavLink
            to={item.path}
            onClick={() => setMobileOpen?.(false)}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : undefined}
        >
            <item.icon size={16} style={{ flexShrink: 0, opacity: 0.85 }} />
            <AnimatePresence>
                {!collapsed && (
                    <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.18 }}
                        style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
                    >
                        {item.label}
                    </motion.span>
                )}
            </AnimatePresence>
        </NavLink>
    );
}

export function SidebarNav({ collapsed, onCollapse, mobileOpen, setMobileOpen }: SidebarNavProps) {
    const user = useAuthStore((s) => s.user);
    const navigate = useNavigate();
    const roleInfo = user?.role ? ROLE_DISPLAY[user.role] : null;

    return (
        <motion.aside
            className={`sidebar ${!mobileOpen ? 'mobile-hidden' : ''}`}
            style={{
                width: collapsed ? 64 : 248,
                transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            {/* ── Logo / Brand ─────────────────────────────── */}
            <div className="sidebar-logo" style={{ overflow: 'hidden', paddingRight: collapsed ? 12 : 16 }}>
                {/* Monogram */}
                <img
                    src="/images/logo_red.jpg"
                    alt="NCP Logo"
                    style={{
                        width: 38, height: 38, flexShrink: 0,
                        borderRadius: 10,
                        objectFit: 'cover',
                        border: '1px solid rgba(255,255,255,0.12)',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                    }}
                />

                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -6 }}
                            transition={{ duration: 0.15 }}
                            style={{ overflow: 'hidden', minWidth: 0 }}
                        >
                            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#999595ff', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                                New Career Point
                            </div>
                            <div style={{
                                fontSize: '0.65rem', fontWeight: 600, color: '#4d5e7a',
                                whiteSpace: 'nowrap', marginTop: 2, letterSpacing: '0.03em', textTransform: 'uppercase',
                            }}> 
                                Finance Suite
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Navigation ───────────────────────────────── */}
            <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}>
                {SECTIONS.map((section, si) => {
                    const items = NAV_ITEMS.filter((i) => i.section === section.key);
                    return (
                        <div key={section.key}>
                            {si > 0 && <div className="sidebar-section-divider" />}
                            {!collapsed && items.length > 0 && (
                                <div className="sidebar-section-label">{section.label}</div>
                            )}
                            {collapsed && si > 0 && <div style={{ height: 4 }} />}
                            {items.map((item) => (
                                <NavItemLink key={item.path} item={item} collapsed={collapsed} setMobileOpen={setMobileOpen} />
                            ))}
                        </div>
                    );
                })}
            </nav>

            {/* ── User Card ────────────────────────────────── */}
            <AnimatePresence>
                {!collapsed && user && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.18 }}
                        style={{
                            margin: '0 10px 12px',
                            padding: '10px 12px',
                            background: 'rgba(255,255,255,0.04)',
                            borderRadius: 10,
                            border: '1px solid rgba(255,255,255,0.06)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}
                        onClick={() => navigate('/settings')}
                    >
                        <div style={{
                            width: 30, height: 30, flexShrink: 0,
                            background: 'linear-gradient(135deg, #4f6ef7 0%, #8b5cf6 100%)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                            boxShadow: '0 1px 4px rgba(79,110,247,0.35)',
                        }}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontSize: '0.78rem', fontWeight: 600, color: '#c8d3e8',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                                {user.name}
                            </div>
                            <div style={{
                                marginTop: 2,
                                display: 'inline-block',
                                fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.04em',
                                padding: '1px 6px', borderRadius: 99,
                                background: roleInfo ? `${roleInfo.color}22` : 'rgba(255,255,255,0.08)',
                                color: roleInfo?.color ?? '#8494ae',
                                textTransform: 'uppercase',
                            }}>
                                {roleInfo?.label ?? user.role}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Collapsed avatar */}
            {collapsed && user && (
                <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 12 }}>
                    <div title={user.name} style={{
                        width: 30, height: 30,
                        background: 'linear-gradient(135deg, #4f6ef7 0%, #8b5cf6 100%)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                        cursor: 'pointer',
                    }}>
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                </div>
            )}

            {/* ── Collapse Toggle ──────────────────────────── */}
            <button
                onClick={onCollapse}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                style={{
                    position: 'absolute', top: 22, right: -11,
                    width: 22, height: 22,
                    background: '#1c2d47',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#8494ae',
                    zIndex: 10,
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#243650')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#1c2d47')}
            >
                {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>
        </motion.aside>
    );
}
