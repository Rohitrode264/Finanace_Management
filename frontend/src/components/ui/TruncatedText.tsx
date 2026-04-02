import { useState } from 'react';
import { Modal } from './Modal';
import { Info } from 'lucide-react';

interface Props {
    text: string;
    maxWidth?: string | number;
    className?: string;
    modalTitle?: string;
}

export function TruncatedText({ text, maxWidth = '150px', className = '', modalTitle = 'Details' }: Props) {
    const [isOpen, setIsOpen] = useState(false);

    if (!text) return null;

    return (
        <>
            <div
                title="Click to view full details"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(true);
                }}
                className={`truncate-clickable ${className}`}
                style={{
                    maxWidth,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    cursor: 'pointer',
                    display: 'inline-block',
                    verticalAlign: 'bottom'
                }}
            >
                {text}
            </div>

            {isOpen && (
                <Modal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title={modalTitle}
                    icon={<Info size={20} color="var(--accent)" />}
                    maxWidth="450px"
                >
                    <div style={{ padding: '20px 24px', fontSize: '0.9375rem', lineHeight: 1.6, wordBreak: 'break-word', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                        {text}
                    </div>
                    <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
                        <button className="btn-secondary" onClick={() => setIsOpen(false)}>Close</button>
                    </div>
                </Modal>
            )}
        </>
    );
}
