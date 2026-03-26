import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePermission } from '../hooks/usePermission';

interface ProtectedRouteProps {
    permission?: string;
    redirectTo?: string;
}

export function ProtectedRoute({ permission, redirectTo = '/login' }: ProtectedRouteProps) {
    const hasHydrated = useAuthStore((s) => s.hasHydrated);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const isTokenExpired = useAuthStore((s) => s.isTokenExpired);
    const hasPermission = usePermission(permission ?? null);

    if (!hasHydrated) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                <div style={{
                    width: 36, height: 36,
                    border: '3px solid var(--border)',
                    borderTopColor: '#6366f1',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!isAuthenticated || isTokenExpired()) {
        return <Navigate to={redirectTo} replace />;
    }

    if (permission && !hasPermission) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
