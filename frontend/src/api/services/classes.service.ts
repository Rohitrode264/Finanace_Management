import apiClient from '../client';
import type { AcademicClass, ClassTemplate, Board, ApiResponse } from '../../types';

export const classesService = {
    // ── Class Templates ──────────────────────────────────────────────────────
    // GET /classes/templates — list all templates
    listTemplates: () =>
        apiClient.get<ApiResponse<ClassTemplate[]>>('/classes/templates'),

    // POST /classes/templates — body: { grade, stream, board }
    createTemplate: (data: { grade: string; stream?: string | null; board: Board }) =>
        apiClient.post<ApiResponse<ClassTemplate>>('/classes/templates', data),

    // ── Academic Classes ─────────────────────────────────────────────────────
    // GET /classes?year=<academicYear>
    listClasses: (academicYear: string) =>
        apiClient.get<ApiResponse<AcademicClass[]>>('/classes', { params: { year: academicYear } }),

    // GET /classes/:id
    getClass: (id: string) =>
        apiClient.get<ApiResponse<AcademicClass>>(`/classes/${id}`),

    // POST /classes — body: { templateId, academicYear, section, totalFee, installmentPlan }
    createClass: (data: {
        templateId: string;
        academicYear: string;
        section: string;
        totalFee: number;
        installmentPlan: Array<{ installmentNo: number; dueDate: string; amount: number }>;
    }) => apiClient.post<ApiResponse<AcademicClass>>('/classes', data),
};

