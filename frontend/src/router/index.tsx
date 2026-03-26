import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Pages — lazy imports for code splitting
import { lazy, Suspense } from 'react';

const LoginPage = lazy(() => import('../pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const StudentsPage = lazy(() => import('../pages/students/StudentsPage').then(m => ({ default: m.StudentsPage })));
const ClassesPage = lazy(() => import('../pages/classes/ClassesPage').then(m => ({ default: m.ClassesPage })));
const EnrollmentsPage = lazy(() => import('../pages/enrollments/EnrollmentsPage').then(m => ({ default: m.EnrollmentsPage })));
const PaymentEntryPage = lazy(() => import('../pages/payments/PaymentEntryPage').then(m => ({ default: m.PaymentEntryPage })));
const ReceiptPage = lazy(() => import('../pages/receipts/ReceiptPage').then(m => ({ default: m.ReceiptPage })));
const ReportsPage = lazy(() => import('../pages/reports/ReportsPage').then(m => ({ default: m.ReportsPage })));
const UsersPage = lazy(() => import('../pages/users/UsersPage').then(m => ({ default: m.UsersPage })));
const RBACPage = lazy(() => import('../pages/rbac/RBACPage').then(m => ({ default: m.RBACPage })));
const AuditLogsPage = lazy(() => import('../pages/audit/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const LedgerPage = lazy(() => import('../pages/ledger/LedgerPage').then(m => ({ default: m.LedgerPage })));
const ClassStudentsPage = lazy(() => import('../pages/classes/ClassStudentsPage').then(m => ({ default: m.ClassStudentsPage })));

function PageLoader() {
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

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
    return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
    {
        path: '/forgot-password',
        element: <SuspenseWrapper><ForgotPasswordPage /></SuspenseWrapper>,
    },
    {
        path: '/login',
        element: <SuspenseWrapper><LoginPage /></SuspenseWrapper>,
    },
    {
        // Protected area — all children require authentication
        element: <ProtectedRoute />,
        children: [
            {
                element: <AppLayout />,
                children: [
                    { path: '/dashboard', element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper> },
                    { path: '/students', element: <SuspenseWrapper><StudentsPage /></SuspenseWrapper> },
                    { path: '/classes', element: <SuspenseWrapper><ClassesPage /></SuspenseWrapper> },
                    { path: '/classes/:classId/students', element: <SuspenseWrapper><ClassStudentsPage /></SuspenseWrapper> },
                    { path: '/enrollments', element: <SuspenseWrapper><EnrollmentsPage /></SuspenseWrapper> },
                    { path: '/payments', element: <SuspenseWrapper><PaymentEntryPage /></SuspenseWrapper> },
                    { path: '/receipts/:id', element: <SuspenseWrapper><ReceiptPage /></SuspenseWrapper> },
                    { path: '/reports', element: <SuspenseWrapper><ReportsPage /></SuspenseWrapper> },
                    { path: '/users', element: <SuspenseWrapper><UsersPage /></SuspenseWrapper> },
                    { path: '/rbac', element: <SuspenseWrapper><RBACPage /></SuspenseWrapper> },
                    { path: '/audit', element: <SuspenseWrapper><AuditLogsPage /></SuspenseWrapper> },
                    { path: '/ledger', element: <SuspenseWrapper><LedgerPage /></SuspenseWrapper> },
                    { path: '/settings', element: <SuspenseWrapper><SettingsPage /></SuspenseWrapper> },
                ],
            },
        ],
    },
    { path: '/', element: <ProtectedRoute />, children: [{ index: true, element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper> }] },
    { path: '*', element: <SuspenseWrapper><LoginPage /></SuspenseWrapper> },
]);
