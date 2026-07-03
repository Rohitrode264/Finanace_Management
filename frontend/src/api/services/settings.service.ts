import apiClient from '../client';
import type { ApiResponse } from '../../types';

export const settingsService = {
    getCETPrograms: () => apiClient.get<ApiResponse<{ programs: string[] }>>('/settings/cet/programs'),
    updateCETPrograms: (programs: string[]) => apiClient.put<ApiResponse<{ programs: string[] }>>('/settings/cet/programs', { programs }),
};
