import apiClient from '../client';
import type { User, ApiResponse } from '../../types';

export const usersService = {
    /** GET /api/rbac/users — list all users (Admin only) */
    list: () =>
        apiClient.get<ApiResponse<User[]>>('/rbac/users'),

    /** POST /api/rbac/users — create a new staff user */
    create: (data: { name: string; email: string; password: string; roleId: string }) =>
        apiClient.post<ApiResponse<User>>('/rbac/users', data),

    /** PATCH /api/rbac/users/:id/status — activate or deactivate */
    updateStatus: (id: string, isActive: boolean) =>
        apiClient.patch<ApiResponse<User>>(`/rbac/users/${id}/status`, { isActive }),

    /** PATCH /api/rbac/users/:id/fingerprint — register fingerprint for a user */
    updateFingerprint: (id: string, fingerprintKey: string) =>
        apiClient.patch<ApiResponse<null>>(`/rbac/users/${id}/fingerprint`, { fingerprintKey }),

    /** PATCH /auth/register-fingerprint — register fingerprint for the CURRENT logged-in user */
    registerMyFingerprint: (fingerprintKey: string) =>
        apiClient.patch<ApiResponse<{ fingerprintKey: string }>>('/auth/register-fingerprint', { fingerprintKey }),
};

