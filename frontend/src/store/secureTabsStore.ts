import { create } from 'zustand';
import { authService } from '../api/services/auth.service';
import { useAuthStore } from './authStore';

interface SecureTabsState {
    unlocked: boolean;
    /** Returns true if password matches the logged-in user's login password */
    unlock: (password: string) => Promise<boolean>;
    lock: () => void;
}

export const useSecureTabsStore = create<SecureTabsState>(() => ({
    // Persist unlock for this session only
    unlocked: sessionStorage.getItem('secure_tabs_unlocked') === 'true',

    unlock: async (password: string) => {
        const email = useAuthStore.getState().user?.email;
        if (!email) return false;

        try {
            await authService.login(email, password);
            sessionStorage.setItem('secure_tabs_unlocked', 'true');
            useSecureTabsStore.setState({ unlocked: true });
            return true;
        } catch {
            return false;
        }
    },

    lock: () => {
        sessionStorage.removeItem('secure_tabs_unlocked');
        useSecureTabsStore.setState({ unlocked: false });
    },
}));

// ── Auto-lock when user logs out ──────────────────────────────────────────────
// Subscribe to authStore: whenever isAuthenticated flips to false, lock the tabs.
useAuthStore.subscribe((state, prev) => {
    if (prev.isAuthenticated && !state.isAuthenticated) {
        sessionStorage.removeItem('secure_tabs_unlocked');
        useSecureTabsStore.setState({ unlocked: false });
    }
});
