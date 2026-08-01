import { apiRequest } from "@/lib/api";
import type { FormField, FormResponseRow } from "@/lib/types";
import type { ListResult } from "./events";

export async function getFormSchema(eventId: string): Promise<{ eventId: string; fields: FormField[] }> {
  const { data } = await apiRequest<{ eventId: string; fields: FormField[] }>(`/events/${eventId}/form`);
  return data;
}

export async function putFormSchema(eventId: string, fields: FormField[]): Promise<{ fields: FormField[] }> {
  const { data } = await apiRequest<{ fields: FormField[] }>(`/events/${eventId}/form`, {
    method: "PUT",
    body: { fields },
  });
  return data;
}

export async function listFormResponses(eventId: string, params: Record<string, string>): Promise<ListResult<FormResponseRow>> {
  const qs = new URLSearchParams(params).toString();
  const { data, meta } = await apiRequest<FormResponseRow[]>(`/events/${eventId}/form/responses?${qs}`);
  return { items: data, meta: meta! };
}
