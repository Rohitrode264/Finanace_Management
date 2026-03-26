import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Building2, Mail, CheckCircle2 } from 'lucide-react';
import { authService } from '../../api/services/auth.service';
import toast from 'react-hot-toast';

const emailSchema = z.object({
    email: z.string().email('Invalid email address'),
});

const resetSchema = z.object({
    otp: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type EmailForm = z.infer<typeof emailSchema>;
type ResetForm = z.infer<typeof resetSchema>;

export function ForgotPasswordPage() {
    const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
    const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

    const onEmailSubmit = async (data: EmailForm) => {
        setIsLoading(true);
        try {
            await authService.forgotPassword(data.email);
            setEmail(data.email);
            setStep('otp');
            toast.success('OTP sent! Check the console.');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const onResetSubmit = async (data: ResetForm) => {
        setIsLoading(true);
        try {
            await authService.resetPassword({
                email,
                otp: data.otp,
                newPassword: data.newPassword
            });
            setStep('success');
            toast.success('Password changed successfully');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Invalid OTP or expired');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
                        <Building2 size={24} color="#fff" />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                        {step === 'email' ? 'Forgot Password?' : step === 'otp' ? 'Reset Password' : 'Changed!'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                        {step === 'email' ? 'Enter your email to receive an OTP' : step === 'otp' ? `Account: ${email}` : 'Your password has been reset successfully.'}
                    </p>
                </div>

                <div className="card" style={{ padding: 32 }}>
                    <AnimatePresence mode="wait">
                        {step === 'email' && (
                            <motion.form
                                key="email"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                            >
                                <div style={{ marginBottom: 24 }}>
                                    <label className="form-label">Work Email</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            {...emailForm.register('email')}
                                            className="form-input"
                                            style={{ paddingLeft: 40 }}
                                            placeholder="name@domain.com"
                                        />
                                    </div>
                                    {emailForm.formState.errors.email && <p className="form-error">{emailForm.formState.errors.email.message}</p>}
                                </div>
                                <button type="submit" className="btn-primary" style={{ width: '100%', height: 48, justifyContent: 'center' }} disabled={isLoading}>
                                    {isLoading ? 'Sending OTP...' : 'Send Reset OTP'}
                                </button>
                                <button type="button" onClick={() => navigate('/login')} style={{ width: '100%', background: 'none', border: 'none', marginTop: 16, color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <ArrowLeft size={14} /> Back to Login
                                </button>
                            </motion.form>
                        )}

                        {step === 'otp' && (
                            <motion.form
                                key="otp"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={resetForm.handleSubmit(onResetSubmit)}
                            >
                                <div style={{ marginBottom: 20 }}>
                                    <label className="form-label">6-Digit OTP</label>
                                    <input
                                        {...resetForm.register('otp')}
                                        className="form-input"
                                        placeholder="Enter OTP"
                                    />
                                    {resetForm.formState.errors.otp && <p className="form-error">{resetForm.formState.errors.otp.message}</p>}
                                </div>
                                <div style={{ marginBottom: 20 }}>
                                    <label className="form-label">New Password</label>
                                    <input
                                        {...resetForm.register('newPassword')}
                                        type="password"
                                        className="form-input"
                                        placeholder="Min 6 characters"
                                    />
                                    {resetForm.formState.errors.newPassword && <p className="form-error">{resetForm.formState.errors.newPassword.message}</p>}
                                </div>
                                <div style={{ marginBottom: 32 }}>
                                    <label className="form-label">Confirm Password</label>
                                    <input
                                        {...resetForm.register('confirmPassword')}
                                        type="password"
                                        className="form-input"
                                    />
                                    {resetForm.formState.errors.confirmPassword && <p className="form-error">{resetForm.formState.errors.confirmPassword.message}</p>}
                                </div>
                                <button type="submit" className="btn-primary" style={{ width: '100%', height: 48, justifyContent: 'center' }} disabled={isLoading}>
                                    {isLoading ? 'Resetting...' : 'Change Password'}
                                </button>
                            </motion.form>
                        )}

                        {step === 'success' && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ textAlign: 'center' }}
                            >
                                <div style={{
                                    width: 64, height: 64, background: 'rgba(16,185,129,0.1)',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 20px'
                                }}>
                                    <CheckCircle2 size={32} color="#10b981" />
                                </div>
                                <p style={{ marginBottom: 24, fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                                    Your password has been changed. You can now log in with your new credentials.
                                </p>
                                <button onClick={() => navigate('/login')} className="btn-primary" style={{ width: '100%', height: 48, justifyContent: 'center' }}>
                                    Return to Sign In
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
