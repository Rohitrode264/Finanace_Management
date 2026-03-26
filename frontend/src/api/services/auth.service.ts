import apiClient from '../client';
import type { LoginResponse, ApiResponse } from '../../types';

export const authService = {
    login: (email: string, password: string) =>
        apiClient.post<LoginResponse>('/auth/login', { email, password }),

    registerFingerprint: (fingerprintKey: string) =>
        apiClient.patch<ApiResponse<{ fingerprintKey: string }>>('/auth/register-fingerprint', {
            fingerprintKey,
        }),

    forgotPassword: (email: string) =>
        apiClient.post<ApiResponse<any>>('/auth/forgot-password', { email }),

    resetPassword: (data: any) =>
        apiClient.post<ApiResponse<any>>('/auth/reset-password', data),

    changePassword: (data: any) =>
        apiClient.patch<ApiResponse<any>>('/auth/change-password', data),
};
