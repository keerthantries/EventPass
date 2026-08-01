import { Request, Response, NextFunction, RequestHandler } from 'express';

/** Wraps async controllers so thrown/rejected errors reach the central errorHandler. */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
