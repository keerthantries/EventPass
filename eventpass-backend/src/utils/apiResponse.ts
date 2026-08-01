import { Response } from 'express';

interface Meta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

/** Wraps every successful response in the standard { success, data, meta? } envelope (API spec §1.1). */
export function sendSuccess(res: Response, data: unknown, statusCode = 200, meta?: Meta): Response {
  const body: Record<string, unknown> = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}
