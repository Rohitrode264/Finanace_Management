interface PageHeaderProps {
    title: string;
    subtitle: string;
    actions?: React.ReactNode;
    tabs?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions, tabs }: PageHeaderProps) {
    return (
        <div>
            <div className="page-header">
                <div style={{ minWidth: 0 }}>
                    <h2 className="page-title">{title}</h2>
                    <p className="page-subtitle">{subtitle}</p>
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
