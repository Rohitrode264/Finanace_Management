import apiClient from '../client';
import type { DailyReport, LedgerEntry, ApiResponse } from '../../types';

export const reportService = {
    // GET /reports/daily?date=YYYY-MM-DD&endDate=YYYY-MM-DD
    daily: (date: string, endDate?: string) =>
        apiClient.get<ApiResponse<DailyReport>>('/reports/daily', { params: { date, ...(endDate ? { endDate } : {}) } }),

    // GET /reports/enrollment/:enrollmentId/ledger
    enrollmentLedger: (enrollmentId: string) =>
        apiClient.get<ApiResponse<{ ledger: LedgerEntry[] }>>(`/reports/enrollment/${enrollmentId}/ledger`),
};
