interface PageHeaderProps {
    title: string;
    subtitle: string;
    actions?: React.ReactNode;
    tabs?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions, tabs }: PageHeaderProps) {
    return (
        <div style={{ marginBottom: 24 }}>
            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
            }}>
                <div style={{ minWidth: 0 }}>
                    <h2 className="page-title">{title}</h2>
                    <p className="page-subtitle">{subtitle}</p>
                </div>
                {actions && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
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
