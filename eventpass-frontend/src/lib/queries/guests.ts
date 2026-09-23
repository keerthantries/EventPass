import { apiRequest } from "@/lib/api";
import type { Category, Guest, ImportResult, Party } from "@/lib/types";
import type { ListResult } from "./events";

export async function listCategories(eventId: string): Promise<Category[]> {
  const { data } = await apiRequest<Category[]>(`/events/${eventId}/categories`);
  return data;
}

export async function createCategory(eventId: string, payload: { name: string; colorTag?: string }): Promise<Category> {
  const { data } = await apiRequest<Category>(`/events/${eventId}/categories`, { method: "POST", body: payload });
  return data;
}

export async function updateCategory(id: string, payload: Partial<{ name: string; colorTag?: string }>): Promise<Category> {
  const { data } = await apiRequest<Category>(`/categories/${id}`, { method: "PATCH", body: payload });
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiRequest(`/categories/${id}`, { method: "DELETE" });
}

export async function listGuests(eventId: string, params: Record<string, string>): Promise<ListResult<Guest>> {
  const qs = new URLSearchParams(params).toString();
  const { data, meta } = await apiRequest<Guest[]>(`/events/${eventId}/guests?${qs}`);
  return { items: data, meta: meta! };
}

export async function createGuest(eventId: string, payload: Record<string, unknown>): Promise<Guest> {
  const { data } = await apiRequest<Guest>(`/events/${eventId}/guests`, { method: "POST", body: payload });
  return data;
}

export async function updateGuest(id: string, payload: Record<string, unknown>): Promise<Guest> {
  const { data } = await apiRequest<Guest>(`/guests/${id}`, { method: "PATCH", body: payload });
  return data;
}

export async function deleteGuest(id: string): Promise<void> {
  await apiRequest(`/guests/${id}`, { method: "DELETE" });
}

export async function bulkGuestAction(
  eventId: string,
  payload: {
    guestIds: string[];
    action:
      | "reassignCategory"
      | "delete"
      | "setSide"
      | "setVip"
      | "setImmediateFamily"
      | "assignParty"
      | "generateBulkQr"
      | "markSent";
    categoryId?: string;
    side?: string;
    isVip?: boolean;
    isImmediateFamily?: boolean;
    partyId?: string;
    channel?: "email" | "sms" | "whatsapp" | "other";
  }
): Promise<{ updated: number }> {
  const { data } = await apiRequest<{ updated: number }>(`/events/${eventId}/guests/bulk`, { method: "PATCH", body: payload });
  return data;
}

export async function importGuests(eventId: string, file: File): Promise<ImportResult> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiRequest<ImportResult>(`/events/${eventId}/guests/import`, {
    method: "POST",
    body: form,
  });
  return data;
}

export async function generateGuestQr(id: string): Promise<{ qrToken: string; qrGeneratedAt: string }> {
  const { data } = await apiRequest<{ qrToken: string; qrGeneratedAt: string }>(`/guests/${id}/qr`, { method: "POST" });
  return data;
}

export async function approveGuest(id: string, decision: "approved" | "rejected"): Promise<void> {
  await apiRequest(`/guests/${id}/approve`, { method: "POST", body: { decision } });
}

export async function markGuestSent(id: string, channel?: "email" | "sms" | "whatsapp" | "other"): Promise<void> {
  await apiRequest(`/guests/${id}/mark-sent`, { method: "POST", body: channel ? { channel } : {} });
}

export async function listParties(eventId: string): Promise<Party[]> {
  const { data } = await apiRequest<Party[]>(`/events/${eventId}/parties`);
  return data;
}
