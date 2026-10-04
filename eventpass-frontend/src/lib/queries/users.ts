import { apiRequest } from "@/lib/api";
import type { AdminUser, PaginationMeta } from "@/lib/types";

export interface ListResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export async function listUsers(params: Record<string, string>): Promise<ListResult<AdminUser>> {
  const qs = new URLSearchParams(params).toString();
  const { data, meta } = await apiRequest<AdminUser[]>(`/users?${qs}`);
  return { items: data, meta: meta! };
}
