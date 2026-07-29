import { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useSecureTabsStore } from '../../store/secureTabsStore';

interface SecureTabUnlockProps {
    /** If true renders as a full-page block (for direct URL access). If false, renders as a modal overlay. */
    fullPage?: boolean;
    onClose?: () => void;
}

export function SecureTabUnlock({ fullPage = false, onClose }: SecureTabUnlockProps) {
    const unlock = useSecureTabsStore((s) => s.unlock);
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Auto-focus after mount
        const t = setTimeout(() => inputRef.current?.focus(), 120);
        return () => clearTimeout(t);
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        const ok = await unlock(password);
        setLoading(false);
        if (ok) {
            onClose?.();
        } else {
            setError('Incorrect password. Please try again.');
            setShake(true);
            setPassword('');
            setTimeout(() => setShake(false), 600);
        }
    }

    const card = (
        <div
            style={{
                background: '#111111',
                border: '1px solid #2a2a2a',
                borderRadius: 16,
                padding: '40px 36px',
                width: '100%',
                maxWidth: 380,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0,
                boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
                animation: shake ? 'secureShake 0.55s ease' : undefined,
            }}
        >
            <style>{`
                @keyframes secureShake {
                    0%,100% { transform: translateX(0); }
                    15% { transform: translateX(-8px); }
                    30% { transform: translateX(8px); }
                    45% { transform: translateX(-6px); }
                    60% { transform: translateX(6px); }
                    75% { transform: translateX(-3px); }
                    90% { transform: translateX(3px); }
                }
                @keyframes secureSpinner {
                    to { transform: rotate(360deg); }
                }
                @keyframes secureGlow {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(156,163,175,0.0); }
                    50% { box-shadow: 0 0 0 6px rgba(156,163,175,0.08); }
                }
                .secure-unlock-input:focus {
                    outline: none;
                    border-color: #555 !important;
                    background: #1a1a1a !important;
                }
                .secure-unlock-input::placeholder { color: #444; }
                .secure-unlock-btn:hover { background: #2a2a2a !important; }
                .secure-unlock-btn:active { transform: scale(0.98); }
                .secure-eye-btn:hover { color: #aaa !important; }
            `}</style>

            {/* Icon */}
            <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: '#1c1c1c',
                border: '1px solid #2e2e2e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
            }}>
                <Lock size={22} color="#888" strokeWidth={1.8} />
            </div>

            {/* Title */}
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#e0e0e0', marginBottom: 6, letterSpacing: '-0.01em' }}>
                Restricted Access
            </div>
            <div style={{ fontSize: '0.78rem', color: '#555', marginBottom: 28, textAlign: 'center', lineHeight: 1.5 }}>
                This section is locked. Enter the access password to continue.
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                    <input
                        ref={inputRef}
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        placeholder="Enter password"
                        className="secure-unlock-input"
                        autoComplete="off"
                        style={{
                            width: '100%',
                            background: '#161616',
                            border: '1px solid #2a2a2a',
                            borderRadius: 10,
                            padding: '11px 44px 11px 14px',
                            fontSize: '0.875rem',
                            color: '#d4d4d4',
                            fontFamily: 'inherit',
                            boxSizing: 'border-box',
                            transition: 'border-color 0.2s, background 0.2s',
                            letterSpacing: showPw ? 'normal' : '0.08em',
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="secure-eye-btn"
                        style={{
                            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#444', padding: 0, display: 'flex', alignItems: 'center',
                            transition: 'color 0.2s',
                        }}
                    >
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                </div>

                {error && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: '0.74rem', color: '#888',
                        background: '#1a1a1a', border: '1px solid #2a2a2a',
                        borderRadius: 7, padding: '8px 10px',
                    }}>
                        <ShieldAlert size={13} color="#666" />
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    className="secure-unlock-btn"
                    disabled={!password || loading}
                    style={{
                        width: '100%',
                        background: '#1e1e1e',
                        border: '1px solid #333',
                        borderRadius: 10,
                        padding: '11px 0',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: (password && !loading) ? '#ccc' : '#3a3a3a',
                        cursor: (password && !loading) ? 'pointer' : 'not-allowed',
                        fontFamily: 'inherit',
                        letterSpacing: '0.02em',
                        transition: 'all 0.2s',
                        marginTop: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                    }}
                >
                    {loading ? (
                        <>
                            <span style={{
                                width: 13, height: 13,
                                border: '2px solid #3a3a3a',
                                borderTopColor: '#888',
                                borderRadius: '50%',
                                display: 'inline-block',
                                animation: 'secureSpinner 0.7s linear infinite',
                            }} />
                            Verifying…
                        </>
                    ) : 'Unlock'}
                </button>
            </form>

            {/* Close / cancel — only for modal */}
            {!fullPage && onClose && (
                <button
                    onClick={onClose}
                    style={{
                        marginTop: 18, background: 'none', border: 'none',
                        fontSize: '0.75rem', color: '#3a3a3a', cursor: 'pointer',
                        fontFamily: 'inherit', transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#666')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#3a3a3a')}
                >
                    Cancel
                </button>
            )}
        </div>
    );

    if (fullPage) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '100%', padding: '40px 16px',
                background: 'var(--bg-base, #0d0d0d)',
            }}>
                {card}
            </div>
        );
    }

    // Modal overlay
    return (
        <div
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 9999,
                padding: 16,
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        >
            {card}
        </div>
    );
}
