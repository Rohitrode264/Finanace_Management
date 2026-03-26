import type { Category, ApiResponse } from '../../types';
import apiClient from '../client';

export const categoryService = {
    // GET /categories
    list: (all?: boolean) => apiClient.get<ApiResponse<Category[]>>('/categories', { params: { all } }),

    // POST /categories
    create: (data: { name: string; description?: string }) => apiClient.post<ApiResponse<Category>>('/categories', data),

    // PATCH /categories/:id/toggle-status
    toggleStatus: (id: string) => apiClient.patch<ApiResponse<Category>>(`/categories/${id}/toggle-status`),
};
