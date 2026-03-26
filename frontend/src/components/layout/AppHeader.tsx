import { Sun, Moon, LogOut, Bell, ChevronDown, Menu, Settings, User } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Breadcrumb } from './Breadcrumb';
import { NotificationPanel } from './NotificationPanel';

interface AppHeaderProps {
    title: string;
    subtitle?: string;
    onMenuClick?: () => void;
}

export function AppHeader({ title, subtitle, onMenuClick }: AppHeaderProps) {
    const { theme, toggle } = useThemeStore();
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            <header
                className="app-header"
                style={{
                    background: 'var(--bg-surface)',
                    borderBottom: '1px solid var(--border)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                    flexShrink: 0,
                }}
            >
                {/* ── Top row ─────────────────────────────────────── */}
                <div style={{
                    height: 56,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 20px',
                }}>
                    {/* Left: menu + title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        {onMenuClick && (
                            <button
                                onClick={onMenuClick}
                                className="mobile-toggle-btn btn-icon"
                                style={{ display: 'none' }}
                            >
                                <Menu size={17} />
                            </button>
                        )}
                        <div style={{ minWidth: 0 }}>
                            <h1 style={{
                                fontSize: '0.9375rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                lineHeight: 1.1,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                letterSpacing: '-0.01em',
                            }}>
                                {title}
                            </h1>
                            {subtitle && (
                                <p
                                    className="header-subtitle"
                                    style={{
                                        fontSize: '0.72rem',
                                        color: 'var(--text-muted)',
                                        marginTop: 1,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: 320,
                                    }}
                                >
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right: actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

                        {/* Notification Bell */}
                        <button
                            onClick={() => setNotifOpen(true)}
                            className="btn-icon"
                            title="Activity & Notifications"
                            style={{ position: 'relative' }}
                        >
                            <Bell size={15} />
                            <span style={{
                                position: 'absolute', top: 6, right: 6,
                                width: 6, height: 6,
                                background: 'var(--accent)',
                                borderRadius: '50%',
                                border: '1.5px solid var(--bg-surface)',
                            }} />
                        </button>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggle}
                            className="btn-icon"
                            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                        >
                            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
                        </button>

                        {/* User dropdown */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 7,
                                    padding: '5px 10px 5px 5px',
                                    background: 'var(--bg-subtle)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    color: 'var(--text-primary)',
                                    transition: 'all var(--transition-base)',
                                    fontFamily: 'var(--font-sans)',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                            >
                                <div style={{
                                    width: 26, height: 26,
                                    background: 'linear-gradient(135deg, #4f6ef7 0%, #8b5cf6 100%)',
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.7rem', fontWeight: 700, color: '#fff',
                                    flexShrink: 0,
                                }}>
                                    {user?.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="header-user-name" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                                    {user?.name}
                                </span>
                                <ChevronDown
                                    size={13}
                                    style={{
                                        color: 'var(--text-muted)', flexShrink: 0,
                                        transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                                        transition: 'transform 0.2s',
                                    }}
                                />
                            </button>

                            {dropdownOpen && (
                                <>
                                    <div
                                        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                                        onClick={() => setDropdownOpen(false)}
                                    />
                                    <div style={{
                                        position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                                        background: 'var(--bg-surface)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-md)',
                                        boxShadow: 'var(--shadow-lg)',
                                        minWidth: 200,
                                        zIndex: 50,
                                        overflow: 'hidden',
                                    }}>
                                        {/* Profile block */}
                                        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{
                                                    width: 34, height: 34,
                                                    background: 'linear-gradient(135deg, #4f6ef7 0%, #8b5cf6 100%)',
                                                    borderRadius: '50%',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.8125rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                                                }}>
                                                    {user?.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>{user?.email}</div>
                                                </div>
                                            </div>
                                            {user?.role && (
                                                <div style={{ marginTop: 8 }}>
                                                    <span className="badge badge-indigo">{user.role}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Menu items */}
                                        {[
                                            { icon: User, label: 'Profile', action: () => { navigate('/settings'); setDropdownOpen(false); } },
                                            { icon: Settings, label: 'Settings', action: () => { navigate('/settings'); setDropdownOpen(false); } },
                                        ].map(({ icon: Icon, label, action }) => (
                                            <button
                                                key={label}
                                                onClick={action}
                                                style={{
                                                    width: '100%', padding: '9px 16px',
                                                    display: 'flex', alignItems: 'center', gap: 9,
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'var(--text-secondary)',
                                                    fontSize: '0.8125rem', fontWeight: 500,
                                                    cursor: 'pointer', textAlign: 'left',
                                                    fontFamily: 'var(--font-sans)',
                                                    transition: 'background var(--transition-fast)',
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <Icon size={14} />
                                                {label}
                                            </button>
                                        ))}

                                        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

                                        <button
                                            onClick={handleLogout}
                                            style={{
                                                width: '100%', padding: '9px 16px',
                                                display: 'flex', alignItems: 'center', gap: 9,
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--danger)',
                                                fontSize: '0.8125rem', fontWeight: 500,
                                                cursor: 'pointer', textAlign: 'left',
                                                fontFamily: 'var(--font-sans)',
                                                transition: 'background var(--transition-fast)',
                                                marginBottom: 4,
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--danger-light)')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <LogOut size={14} />
                                            Sign out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Breadcrumb row ──────────────────────────────── */}
                <div style={{
                    paddingLeft: 20,
                    paddingRight: 20,
                    paddingBottom: 9,
                    borderTop: '1px solid var(--border-subtle)',
                    background: 'var(--bg-subtle)',
                }}>
                    <Breadcrumb />
                </div>
            </header>

            {/* Notification Panel */}
            <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
        </>
    );
}
