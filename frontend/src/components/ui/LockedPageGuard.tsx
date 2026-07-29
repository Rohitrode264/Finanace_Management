import { useSecureTabsStore } from '../../store/secureTabsStore';
import { SecureTabUnlock } from '../ui/SecureTabUnlock';

interface LockedPageGuardProps {
    children: React.ReactNode;
}

/**
 * Wraps a page that requires secure-tab unlock.
 * If the tabs are not unlocked, shows the full-page lock screen
 * instead of the actual page content — preventing direct URL access.
 */
export function LockedPageGuard({ children }: LockedPageGuardProps) {
    const unlocked = useSecureTabsStore((s) => s.unlocked);

    if (!unlocked) {
        return <SecureTabUnlock fullPage />;
    }

    return <>{children}</>;
}
