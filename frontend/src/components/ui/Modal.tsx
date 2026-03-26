import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    icon?: React.ReactNode;
    maxWidth?: string;
    /** Extra content for the header right slot */
    headerRight?: React.ReactNode;
}

export function Modal({ isOpen, onClose, children, title, icon, maxWidth = '600px', headerRight }: ModalProps) {
    // Body scroll lock
    useEffect(() => {
        if (isOpen) {
            const original = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = original; };
        }
    }, [isOpen]);

    // ESC key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="modal-overlay">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ position: 'absolute', inset: 0 }}
                    onClick={onClose}
                />

                {/* Modal card */}
                <motion.div
                    className="modal-content custom-scrollbar"
                    initial={{ scale: 0.96, opacity: 0, y: 12 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.96, opacity: 0, y: 12 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 360 }}
                    style={{ maxWidth }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    {(title || icon) && (
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {icon && (
                                    <div style={{
                                        width: 34, height: 34,
                                        background: 'var(--accent-light)',
                                        borderRadius: 'var(--radius-sm)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        {icon}
                                    </div>
                                )}
                                {title && <h3 className="modal-title">{title}</h3>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {headerRight}
                                <button onClick={onClose} className="btn-icon" style={{ width: 30, height: 30 }} title="Close (Esc)">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Body */}
                    {children}
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
