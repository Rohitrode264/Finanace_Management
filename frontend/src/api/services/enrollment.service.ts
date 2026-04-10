import apiClient from '../client';
import type { Enrollment, LedgerEntry, ApiResponse } from '../../types';

export const enrollmentService = {
    // GET /enrollments
    list: (params?: { limit?: number; skip?: number; program?: string }) =>
        apiClient.get<ApiResponse<(Enrollment & { outstandingBalance?: number })[]>>('/enrollments', { params }),

    // GET /enrollments/:id  — returns enrollment + outstandingBalance
    getById: (id: string) =>
        apiClient.get<ApiResponse<Enrollment & { outstandingBalance: number }>>(`/enrollments/${id}`),

    // POST /enrollments — body: { studentId, academicClassId }
    enroll: (data: { studentId: string; academicClassId: string }) =>
        apiClient.post<ApiResponse<Enrollment>>('/enrollments', data),

    // POST /enrollments/:id/concession — body: { concessionType, concessionValue, reason }
    applyConcession: (
        id: string,
        data: { concessionType: 'PERCENTAGE' | 'FLAT'; concessionValue: number; reason?: string }
    ) => apiClient.post<ApiResponse<{ concessionAmount: number }>>(`/enrollments/${id}/concession`, data),

    // GET /enrollments/:id/ledger — returns { ledger, outstandingBalance }
    getLedger: (id: string) =>
        apiClient.get<ApiResponse<{ ledger: LedgerEntry[]; outstandingBalance: number }>>(`/enrollments/${id}/ledger`),

    // GET /enrollments/:id/transfer — body: { targetClassId, reason?, concessionType?, concessionValue? }
    transfer: (id: string, data: { targetClassId: string; reason?: string; concessionType?: 'NONE' | 'PERCENTAGE' | 'FLAT'; concessionValue?: number }) =>
        apiClient.post<ApiResponse<{ oldEnrollment: Enrollment; newEnrollment: Enrollment; amountCarriedOver: number; concessionAmount: number }>>(
            `/enrollments/${id}/transfer`,
            data
        ),

    // GET /enrollments/student/:studentId
    getByStudentId: (studentId: string) =>
        apiClient.get<ApiResponse<(Enrollment & { outstandingBalance: number })[]>>(`/enrollments/student/${studentId}`),
};

