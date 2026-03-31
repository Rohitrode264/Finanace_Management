import apiClient from '../client';
import type { Role, Permission, ApiResponse } from '../../types';

export const rbacService = {
    // ── Roles ─────────────────────────────────────────────────────────────────
    // GET /rbac/roles
    listRoles: () =>
        apiClient.get<ApiResponse<Role[]>>('/rbac/roles'),

    // POST /rbac/roles — body: { name, description }
    createRole: (data: { name: string; description: string }) =>
        apiClient.post<ApiResponse<Role>>('/rbac/roles', data),

    // GET /rbac/roles/:id/permissions
    getRolePermissions: (roleId: string) =>
        apiClient.get<ApiResponse<Permission[]>>(`/rbac/roles/${roleId}/permissions`),

    // POST /rbac/roles/:id/permissions — body: { permissionId }
    grantPermission: (roleId: string, permissionId: string) =>
        apiClient.post<ApiResponse<null>>(`/rbac/roles/${roleId}/permissions`, { permissionId }),

    // DELETE /rbac/roles/:id/permissions/:permId
    revokePermission: (roleId: string, permissionId: string) =>
        apiClient.delete<ApiResponse<null>>(`/rbac/roles/${roleId}/permissions/${permissionId}`),

    // ── Permissions ───────────────────────────────────────────────────────────
    // GET /rbac/permissions
    listPermissions: () =>
        apiClient.get<ApiResponse<Permission[]>>('/rbac/permissions'),
};
