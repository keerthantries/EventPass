/**
 * Standard application error. Thrown anywhere in controllers/services;
 * caught centrally by the errorHandler middleware and mapped to the
 * standard error envelope defined in the API spec (§1.1).
 */
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details: unknown[];

  constructor(statusCode: number, code: string, message: string, details: unknown[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, details: unknown[] = []) {
    return new ApiError(400, 'VALIDATION_ERROR', message, details);
  }
  static unauthorized(message = 'Authentication required.') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }
  static forbidden(message = 'You do not have permission to perform this action.') {
    return new ApiError(403, 'FORBIDDEN', message);
  }
  static notFound(message = 'Resource not found.') {
    return new ApiError(404, 'NOT_FOUND', message);
  }
  static conflict(message: string, details: unknown[] = []) {
    return new ApiError(409, 'CONFLICT', message, details);
  }
  static moduleDisabled(message = 'This module is disabled for this event.') {
    return new ApiError(422, 'MODULE_DISABLED', message);
  }
  static unprocessable(code: string, message: string, details: unknown[] = []) {
    return new ApiError(422, code, message, details);
  }
  static gone(code: string, message: string) {
    return new ApiError(410, code, message);
  }
  static rateLimited(message = 'Too many requests, please try again later.') {
    return new ApiError(429, 'RATE_LIMITED', message);
  }
  static internal(message = 'Something went wrong.') {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}
