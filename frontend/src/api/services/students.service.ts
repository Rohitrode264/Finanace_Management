import apiClient from '../client';
import type { Student, StudentStatus, ApiResponse } from '../../types';

export const studentsService = {
    // GET /students?q=...&status=...&limit=...&skip=...
    list: (params?: { limit?: number; skip?: number; search?: string; status?: StudentStatus; program?: string }) => {
        const { search, ...rest } = params ?? {};
        return apiClient.get<ApiResponse<{ students: Student[]; total: number }>>('/students', {
            params: { ...rest, ...(search ? { q: search } : {}) },
        });
    },

    getById: (id: string) =>
        apiClient.get<ApiResponse<Student>>(`/students/${id}`),

    generateAdmissionId: () =>
        apiClient.get<ApiResponse<{ admissionId: string }>>('/students/generate-admission-id'),

    // POST /students — body: { admissionNumber, firstName, lastName, phone, fatherName, motherName }
    create: (data: Partial<Student>) => apiClient.post<ApiResponse<Student>>('/students', data),

    // PATCH /students/:id/status — body: { status: 'ACTIVE'|'DROPPED'|'PASSED_OUT' }
    updateStatus: (id: string, status: StudentStatus) =>
        apiClient.patch<ApiResponse<Student>>(`/students/${id}/status`, { status }),
};
