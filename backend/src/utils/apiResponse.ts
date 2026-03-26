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

export function sendSuccess<T>(
    res: Response,
    data: T,
    statusCode = 200,
    message?: string,
    meta?: Record<string, unknown>
): void {
    const response: ApiSuccessResponse<T> = { success: true, data };
    if (message) response.message = message;
    if (meta) response.meta = meta;
    res.status(statusCode).json(response);
}

export function sendError(
    res: Response,
    error: string,
    statusCode = 500,
    code?: string,
    details?: unknown
): void {
    const response: ApiErrorResponse = { success: false, error };
    if (code) response.code = code;
    if (details) response.details = details;
    res.status(statusCode).json(response);
}

export function sendValidationError(res: Response, details: unknown): void {
    sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', details);
}
