export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/** Parses ?page & ?limit query params with sane defaults/caps, per each endpoint's documented max. */
export function parsePagination(query: Record<string, unknown>, maxLimit = 100): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(String(query.limit ?? '20'), 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildMeta(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
