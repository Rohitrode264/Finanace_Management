import { Response } from 'express';
export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
    message?: string;
    meta?: Record<string, unknown>;
}
export interface ApiErrorResponse {
    success: false;
    error: string;
    code?: string;
    details?: unknown;
}
export declare function sendSuccess<T>(res: Response, data: T, statusCode?: number, message?: string, meta?: Record<string, unknown>): void;
export declare function sendError(res: Response, error: string, statusCode?: number, code?: string, details?: unknown): void;
export declare function sendValidationError(res: Response, details: unknown): void;
//# sourceMappingURL=apiResponse.d.ts.map