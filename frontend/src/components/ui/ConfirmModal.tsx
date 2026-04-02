import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useEffect } from 'react';

interface ConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'primary';
    loading?: boolean;
}

export function ConfirmModal({
    open, onClose, onConfirm, title, message,
    confirmLabel = 'Confirm', cancelLabel = 'Cancel',
    variant = 'primary', loading = false,
}: ConfirmModalProps) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    const Icon = variant === 'danger' ? AlertTriangle : CheckCircle2;
    const iconColor = variant === 'danger' ? 'var(--danger)' : 'var(--accent)';
    const iconBg = variant === 'danger' ? 'var(--danger-light)' : 'var(--accent-light)';

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="modal-overlay">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'absolute', inset: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="modal-content"
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 360 }}
                        style={{ maxWidth: 440, width: '95%', margin: '0 10px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40,
                                    background: iconBg,
                                    borderRadius: 'var(--radius-sm)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <Icon size={20} color={iconColor} />
                                </div>
                                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {title}
                                </h3>
                            </div>
                            <button onClick={onClose} className="btn-icon" style={{ width: 28, height: 28, flexShrink: 0 }} disabled={loading}>
                                <X size={13} />
                            </button>
                        </div>

                        {/* Message */}
                        <p style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.65,
                            marginBottom: 24,
                            // paddingLeft: 52, // alignment removed for better mobile width
                        }}>
                            {message}
                        </p>

                        {/* Actions */}
                        <div className="modal-footer" style={{ marginTop: 0 }}>
                            <button className="btn-secondary" onClick={onClose} disabled={loading}>
                                {cancelLabel}
                            </button>
                            <button
                                className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
                                onClick={onConfirm}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
