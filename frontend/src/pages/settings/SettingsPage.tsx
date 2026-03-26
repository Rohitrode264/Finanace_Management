import { useState, useEffect } from 'react';
import { Settings, Moon, Sun, Monitor, Bell, Shield, Globe } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';

export function SettingsPage() {
    const { theme, setTheme } = useThemeStore();
    const user = useAuthStore((s) => s.user);

    const [notifications, setNotifications] = useState(true);

    return (
        <div>
            <PageHeader
                title="Account Settings"
                subtitle="Manage your personal preferences, display themes, and security settings."
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                {/* Profile */}
                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Globe size={18} color="#6366f1" /> Profile Information
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label className="form-label">Full Name</label>
                            <input className="form-input" value={user?.name || ''} readOnly style={{ background: 'var(--bg-subtle)', cursor: 'not-allowed' }} />
                        </div>
                        <div>
                            <label className="form-label">Email Address</label>
                            <input className="form-input" value={user?.email || ''} readOnly style={{ background: 'var(--bg-subtle)', cursor: 'not-allowed' }} />
                        </div>
                    </div>
                </div>

                {/* Theme Settings */}
                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Monitor size={18} color="#6366f1" /> Display Theme
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                        Choose how New Career Point Dashboard looks for you.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                        {[
                            { id: 'light', icon: Sun, label: 'Light' },
                            { id: 'dark', icon: Moon, label: 'Dark' },
                            { id: 'system', icon: Settings, label: 'System' },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTheme(t.id as any)}
                                style={{
                                    padding: '16px 12px', border: `2px solid ${theme === t.id ? '#6366f1' : 'var(--border)'}`,
                                    borderRadius: 12, background: theme === t.id ? 'rgba(99,102,241,0.06)' : 'var(--bg-surface)',
                                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                    transition: 'all 0.2s',
                                }}
                            >
                                <t.icon size={20} color={theme === t.id ? '#6366f1' : 'var(--text-muted)'} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: theme === t.id ? '#6366f1' : 'var(--text-secondary)' }}>
                                    {t.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Preferences */}
                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Bell size={18} color="#6366f1" /> Preferences
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                        <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Email Notifications</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Get reports via email weekly.</div>
                        </div>
                        <button
                            onClick={() => setNotifications(!notifications)}
                            style={{
                                width: 38, height: 20, borderRadius: 20, background: notifications ? '#6366f1' : 'var(--bg-muted)',
                                position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.2s',
                            }}
                        >
                            <div style={{
                                position: 'absolute', top: 3, left: notifications ? 21 : 3,
                                width: 14, height: 14, borderRadius: '50%', background: '#fff',
                                transition: 'left 0.2s',
                            }} />
                        </button>
                    </div>
                </div>

                {/* Reporting Configuration */}
                <ReportingSettings />

                {/* Data & Security */}
                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Shield size={18} color="#6366f1" /> Security
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                        Update your account password.
                    </p>
                    <ChangePasswordForm />
                </div>
            </div>
        </div>
    );
}

import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { Mail, Save } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';

function ReportingSettings() {
    const { data: settingRes, isLoading } = useQuery({
        queryKey: ['setting', 'DAILY_REPORT_EMAIL'],
        queryFn: () => apiClient.get('/settings/DAILY_REPORT_EMAIL'),
    });

    const [localEmail, setLocalEmail] = useState('');

    // Sync local state when data is loaded
    useEffect(() => {
        if (settingRes?.data?.data?.value) {
            setLocalEmail(settingRes.data.data.value);
        }
    }, [settingRes]);

    const mutation = useMutation({
        mutationFn: (val: string) => apiClient.post('/settings', { key: 'DAILY_REPORT_EMAIL', value: val }),
        onSuccess: () => toast.success('Report email updated'),
        onError: () => toast.error('Failed to update email'),
    });

    return (
        <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={18} color="#6366f1" /> Reporting Configuration
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                Set the email address where the 7:00 PM financial reports will be sent.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                    <label className="form-label">Report Recipient Email</label>
                    <input
                        className="form-input"
                        placeholder="admin@example.com"
                        value={localEmail}
                        onChange={(e) => setLocalEmail(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <button
                    className="btn-primary"
                    style={{ width: '100%', gap: 8 }}
                    onClick={() => mutation.mutate(localEmail)}
                    disabled={mutation.isPending || !localEmail}
                >
                    <Save size={16} /> {mutation.isPending ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>
        </div>
    );
}

function ChangePasswordForm() {
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [isPending, setIsPending] = useState(false);

    const handleUpdate = async () => {
        if (!oldPass || !newPass) return toast.error('Fill in all fields');
        if (newPass.length < 6) return toast.error('New password too short');

        setIsPending(true);
        try {
            const { authService: apiAuth } = await import('../../api/services/auth.service');
            await apiAuth.changePassword({ oldPassword: oldPass, newPassword: newPass });
            toast.success('Password updated successfully');
            setOldPass(''); setNewPass('');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to update password');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Current Password</label>
                <input
                    type="password" className="form-input"
                    value={oldPass} onChange={e => setOldPass(e.target.value)}
                />
            </div>
            <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>New Password</label>
                <input
                    type="password" className="form-input"
                    value={newPass} onChange={e => setNewPass(e.target.value)}
                />
            </div>
            <button
                className="btn-primary" style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
                onClick={handleUpdate} disabled={isPending}
            >
                {isPending ? 'Updating...' : 'Update Password'}
            </button>
        </div>
    );
}
