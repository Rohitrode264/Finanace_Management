import apiClient from '../client';
import type { Payment, PaymentMode, ProcessPaymentResult, ApiResponse } from '../../types';

export interface CreatePaymentDto {
    enrollmentId: string;
    amount: number;
    paymentMode: PaymentMode;   // 'CASH' | 'UPI' | 'CARD' | 'CHEQUE' | 'BANK_TRANSFER'
    transactionRef?: string;
    bankName?: string;
    chequeNumber?: string;
    chequeDate?: string;
    fingerprintVerified?: boolean;
}

export const paymentService = {
    // POST /payments — returns { payment, receipt, receiptNumber, allocation }
    create: (data: CreatePaymentDto) =>
        apiClient.post<ApiResponse<ProcessPaymentResult>>('/payments', data),

    // GET /payments/:id
    getById: (id: string) =>
        apiClient.get<ApiResponse<Payment>>(`/payments/${id}`),

    // POST /payments/:id/cancel — body: { reason }
    cancel: (id: string, reason: string) =>
        apiClient.post<ApiResponse<{ success: boolean; message: string }>>(`/payments/${id}/cancel`, { reason }),
};
