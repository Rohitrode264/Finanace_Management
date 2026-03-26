type BadgeVariant = 'green' | 'red' | 'amber' | 'indigo' | 'gray';

interface StatusBadgeProps {
    label: string;
    variant: BadgeVariant;
}

export function StatusBadge({ label, variant }: StatusBadgeProps) {
    return <span className={`badge badge-${variant}`}>{label}</span>;
}

// Preset helpers
export function ActiveBadge({ isActive }: { isActive: boolean }) {
    return <StatusBadge label={isActive ? 'Active' : 'Inactive'} variant={isActive ? 'green' : 'gray'} />;
}

export function InstallmentStatusBadge({ status }: { status: string }) {
    const map: Record<string, BadgeVariant> = {
        PAID: 'green',
        OVERDUE: 'red',
        PARTIAL: 'amber',
        PENDING: 'gray',
    };
    return <StatusBadge label={status} variant={map[status] ?? 'gray'} />;
}

export function PaymentModeBadge({ mode }: { mode: string }) {
    return <StatusBadge label={mode} variant="indigo" />;
}
