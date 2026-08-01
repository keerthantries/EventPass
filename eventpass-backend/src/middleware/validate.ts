import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiError } from '../utils/ApiError';

type Part = 'body' | 'query' | 'params';

/** Validates req[part] against a Zod schema; on failure throws a 400 VALIDATION_ERROR with field-level details. */
export function validate(schema: ZodSchema, part: Part = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(ApiError.badRequest('Validation failed.', details));
    }
    (req as any)[part] = result.data;
    next();
  };
}
