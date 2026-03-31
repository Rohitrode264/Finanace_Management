import { useAuthStore } from '../store/authStore';

/**
 * Returns true if the current user has the given permission.
 * Permission is null → always allowed (e.g. Dashboard link).
 */
export function usePermission(permission: string | string[] | null): boolean {
    const permissions = useAuthStore((s) => s.permissions);
    const user = useAuthStore((s) => s.user);

    // Super-admin escape hatch
    if (user?.role === 'ADMIN') return true;

    if (permission === null) return true;

    if (Array.isArray(permission)) {
        return permission.some(p => permissions.includes(p));
    }

    return permissions.includes(permission);
}
