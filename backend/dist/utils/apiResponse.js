"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
exports.sendValidationError = sendValidationError;
function sendSuccess(res, data, statusCode = 200, message, meta) {
    const response = { success: true, data };
    if (message)
        response.message = message;
    if (meta)
        response.meta = meta;
    res.status(statusCode).json(response);
}
function sendError(res, error, statusCode = 500, code, details) {
    const response = { success: false, error };
    if (code)
        response.code = code;
    if (details)
        response.details = details;
    res.status(statusCode).json(response);
}
function sendValidationError(res, details) {
    sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', details);
}
//# sourceMappingURL=apiResponse.js.map