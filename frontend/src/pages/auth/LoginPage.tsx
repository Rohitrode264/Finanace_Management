import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ShieldCheck, ChevronRight, Activity, TrendingUp, PieChart } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../api/services/auth.service';
import { useThemeStore } from '../../store/themeStore';
import toast from 'react-hot-toast';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { setAuth, isAuthenticated, isTokenExpired, logout } = useAuthStore();
    const applyTheme = useThemeStore((s) => s.applyTheme);

    useEffect(() => { applyTheme(); }, [applyTheme]);

    useEffect(() => {
        if (isAuthenticated) {
            if (isTokenExpired()) {
                logout();
            } else {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [isAuthenticated, isTokenExpired, logout, navigate]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            const response = await authService.login(data.email, data.password);
            const { accessToken, user, permissions } = response.data.data;
            setAuth(accessToken, user, permissions);
            toast.success(`Welcome back, ${user.name}!`);
        } catch (err: unknown) {
            const error = err as { response?: { status: number; data?: { error?: string } } };
            toast.error(error.response?.data?.error || 'Invalid email or password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'row',
            overflow: 'hidden',
        }}>
            {/* Left Session: Info/Branding (Mobile Hidden) */}
            <div className="login-side-pane" style={{
                flex: 1,
                background: '#0a0a0a',
                color: '#fff',
                padding: '80px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'radial-gradient(circle at 50% -20%, rgba(255,255,255,0.08) 0%, transparent 60%)',
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64 }} className='flex'>
                        <div style={{
                            width: 32, height: 32,
                            background: '#fff',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <img src="/images/logo_red.jpg" alt="Logo" className='rounded-sm' />
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em' }}>New Career Point</div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 style={{ fontSize: '3.5rem', fontWeight: 600, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.04em' }}>
                            Finance, <br />
                            simplified.
                        </h1>
                        <p style={{ fontSize: '1.25rem', color: '#86868b', maxWidth: 480, lineHeight: 1.5, fontWeight: 400 }}>
                            A unified platform for student lifecycle management, fee collection tracking, and real-time financial reporting.
                        </p>
                    </motion.div>
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, opacity: 0.7 }}>
                        <div>
                            <TrendingUp size={24} color="#fff" style={{ marginBottom: 12 }} />
                            <div style={{ fontWeight: 500, fontSize: '1rem', marginBottom: 4 }}>Growth Tracking</div>
                            <div style={{ fontSize: '0.875rem', color: '#86868b' }}>Monitor student enrollment trends dynamically.</div>
                        </div>
                        <div>
                            <PieChart size={24} color="#fff" style={{ marginBottom: 12 }} />
                            <div style={{ fontWeight: 500, fontSize: '1rem', marginBottom: 4 }}>Live Audit</div>
                            <div style={{ fontSize: '0.875rem', color: '#86868b' }}>Full transparency with immutable action logs.</div>
                        </div>
                    </div>
                </div>

                <div style={{ position: 'relative', zIndex: 1, fontSize: '0.875rem', color: '#86868b' }}>
                    © 2024 New Career Point. All rights reserved.
                </div>
            </div>

            {/* Right Session: Form */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                position: 'relative',
                background: 'var(--bg-surface)',
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ width: '100%', maxWidth: 400 }}
                >
                    <div style={{ marginBottom: 40, textAlign: 'center' }}>
                        <div style={{
                            width: 48, height: 48,
                            background: '#000',
                            borderRadius: '50%',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: 24
                        }}>
                            <img src="/images/logo_red.jpg" alt="Logo" className='rounded-sm' />
                        </div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>
                            Sign in to your account
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                            Enter your credentials to continue
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        <div style={{ marginBottom: 20 }}>
                            <label className="form-label">Email</label>
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="name@domain.com"
                                className={`form-input ${errors.email ? 'error' : ''}`}
                            />
                            {errors.email && <p className="form-error">{errors.email.message}</p>}
                        </div>

                        <div style={{ marginBottom: 32 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                                <button
                                    type="button"
                                    onClick={() => navigate('/forgot-password')}
                                    style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.8125rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500, cursor: 'pointer' }}
                                >
                                    Forgot?
                                </button>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className={`form-input ${errors.password ? 'error' : ''}`}
                                    style={{ paddingRight: 44 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    style={{
                                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--text-muted)', display: 'flex', padding: 4
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && <p className="form-error">{errors.password.message}</p>}
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            style={{
                                width: '100%',
                                height: 48,
                                justifyContent: 'center',
                                fontSize: '1rem',
                                marginTop: 8
                            }}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Authenticating...' : 'Sign in'}
                            {!isLoading && <ChevronRight size={18} style={{ marginLeft: 6 }} />}
                        </button>
                    </form>

                    <div style={{
                        marginTop: 40,
                        paddingTop: 24,
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ShieldCheck size={14} />
                            Secured Login
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Activity size={14} />
                            System Status: <span style={{ color: '#10b981', fontWeight: 700 }}>Online</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            <style>{`
                @media (max-width: 1024px) {
                    .login-side-pane { display: none !important; }
                }
            `}</style>
        </div>
    );
}
