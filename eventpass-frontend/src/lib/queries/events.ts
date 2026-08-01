import { apiRequest } from "@/lib/api";
import type { EventListItem, EventDetail, PaginationMeta } from "@/lib/types";

export interface ListResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export async function listEvents(params: Record<string, string>): Promise<ListResult<EventListItem>> {
  const qs = new URLSearchParams(params).toString();
  const { data, meta } = await apiRequest<EventListItem[]>(`/events?${qs}`);
  return { items: data, meta: meta! };
}

export async function getEvent(id: string): Promise<EventDetail> {
  const { data } = await apiRequest<EventDetail>(`/events/${id}`);
  return data;
}

export async function createEvent(payload: Record<string, unknown>): Promise<EventDetail> {
  const { data } = await apiRequest<EventDetail>("/events", { method: "POST", body: payload });
  return data;
}

export async function updateEvent(id: string, payload: Record<string, unknown>): Promise<EventDetail> {
  const { data } = await apiRequest<EventDetail>(`/events/${id}`, { method: "PATCH", body: payload });
  return data;
}

export async function archiveEvent(id: string): Promise<void> {
  await apiRequest(`/events/${id}`, { method: "DELETE" });
}

export async function updateEventConfig(id: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data } = await apiRequest<Record<string, unknown>>(`/events/${id}/config`, { method: "PATCH", body: payload });
  return data;
}

export async function updateBranding(id: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data } = await apiRequest<Record<string, unknown>>(`/events/${id}/branding`, { method: "PATCH", body: payload });
  return data;
}
