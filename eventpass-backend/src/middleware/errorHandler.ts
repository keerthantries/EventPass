import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

/** Central error handler — converts any thrown error into the standard error envelope (API spec §1.1). */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  // Mongoose duplicate key error
  if (typeof err === 'object' && err !== null && (err as any).code === 11000) {
    return res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'A resource with these unique fields already exists.', details: [] },
    });
  }

  // Mongoose CastError — invalid ObjectId in a URL param
  if (typeof err === 'object' && err !== null && (err as any).name === 'CastError') {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Resource not found.', details: [] },
    });
  }

  logger.error({ err }, 'Unhandled error');
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.', details: [] },
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} does not exist.`, details: [] },
  });
}
