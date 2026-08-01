import { apiRequest } from "@/lib/api";
import type {
  CheckinResult,
  CheckinSearchResult,
  RecentCheckin,
  DashboardData,
  AttendanceReportRow,
  RsvpReportRow,
} from "@/lib/types";
import type { ListResult } from "./events";

export async function scanCheckin(eventId: string, token: string): Promise<CheckinResult> {
  const { data } = await apiRequest<CheckinResult>(`/checkin/scan`, { method: "POST", body: { token } });
  return data;
}

export async function manualCheckin(eventId: string, guestId: string): Promise<CheckinResult> {
  const { data } = await apiRequest<CheckinResult>(`/checkin/manual/${guestId}`, { method: "POST" });
  return data;
}

export async function searchCheckin(eventId: string, q: string): Promise<CheckinSearchResult[]> {
  const { data } = await apiRequest<CheckinSearchResult[]>(`/events/${eventId}/checkin/search?q=${encodeURIComponent(q)}`);
  return data;
}

export async function recentCheckins(eventId: string): Promise<RecentCheckin[]> {
  const { data } = await apiRequest<RecentCheckin[]>(`/events/${eventId}/checkin/recent`);
  return data;
}

export async function getDashboard(eventId: string): Promise<DashboardData> {
  const { data } = await apiRequest<DashboardData>(`/events/${eventId}/dashboard`);
  return data;
}

export async function listAttendanceReport(
  eventId: string,
  params: Record<string, string>
): Promise<ListResult<AttendanceReportRow>> {
  const qs = new URLSearchParams(params).toString();
  const { data, meta } = await apiRequest<AttendanceReportRow[]>(`/events/${eventId}/reports/attendance?${qs}`);
  return { items: data, meta: meta! };
}

export async function listRsvpReport(
  eventId: string,
  params: Record<string, string>
): Promise<ListResult<RsvpReportRow>> {
  const qs = new URLSearchParams(params).toString();
  const { data, meta } = await apiRequest<RsvpReportRow[]>(`/events/${eventId}/reports/rsvp?${qs}`);
  return { items: data, meta: meta! };
}
