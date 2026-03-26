import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../types';
import { jwtDecode } from '../utils/jwt';

interface AuthState {
    hasHydrated: boolean;
    setHasHydrated: (value: boolean) => void;
    token: string | null;
    user: AuthUser | null;
    permissions: string[];
    isAuthenticated: boolean;
    setAuth: (token: string, user: AuthUser, permissions: string[]) => void;
    logout: () => void;
    hasPermission: (permission: string) => boolean;
    isTokenExpired: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            hasHydrated: false,
            setHasHydrated: (value) => set({ hasHydrated: value }),
            token: null,
            user: null,
            permissions: [],
            isAuthenticated: false,

            setAuth: (token, user, permissions) =>
                set({ token, user, permissions, isAuthenticated: true }),

            logout: () =>
                set({ token: null, user: null, permissions: [], isAuthenticated: false }),

            hasPermission: (permission: string) => {
                const { permissions } = get();
                return permissions.includes(permission);
            },

            isTokenExpired: () => {
                const { token } = get();
                if (!token) return true;
                try {
                    const decoded = jwtDecode(token);
                    return decoded.exp ? decoded.exp * 1000 < Date.now() : false;
                } catch {
                    return true;
                }
            },
        }),
        {
            name: 'fms-auth',
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                permissions: state.permissions,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
