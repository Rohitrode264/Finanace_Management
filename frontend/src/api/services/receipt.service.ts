import apiClient from '../client';
import type { Receipt, ApiResponse } from '../../types';

export const receiptService = {
    // GET /receipts/:id
    getById: (id: string) =>
        apiClient.get<ApiResponse<Receipt>>(`/receipts/${id}`),

    // POST /receipts/authorize-print — body: { receiptId, fingerprintToken }
    authorizePrint: (receiptId: string, fingerprintToken: string) =>
        apiClient.post<ApiResponse<{ authorized: boolean; receipt: Receipt }>>(
            '/receipts/authorize-print',
            { receiptId, fingerprintToken }
        ),
};
