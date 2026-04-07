import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    subtitle: string;
    actions?: React.ReactNode;
    tabs?: React.ReactNode;
    backPath?: string;
}

export function PageHeader({ title, subtitle, actions, tabs, backPath }: PageHeaderProps) {
    const navigate = useNavigate();
    return (
        <div>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {backPath && (
                        <button
                            onClick={() => navigate(backPath)}
                            style={{
                                width: 32, height: 32, borderRadius: 8,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                                cursor: 'pointer', color: 'var(--text-secondary)'
                            }}
                        >
                            <ArrowLeft size={16} />
                        </button>
                    )}
                    <div style={{ minWidth: 0 }}>
                        <h2 className="page-title">{title}</h2>
                        <p className="page-subtitle">{subtitle}</p>
                    </div>
                </div>
                {actions && (
                    <div>
                        {actions}
                    </div>
                )}
            </div>
            {tabs && (
                <div style={{ marginTop: 16, borderBottom: '1px solid var(--border)' }}>
                    {tabs}
                </div>
            )}
        </div>
    );
}
