"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  archiveEvent,
  updateEventConfig,
  updateBranding,
} from "@/lib/queries/events";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listGuests,
  createGuest,
  updateGuest,
  deleteGuest,
  bulkGuestAction,
  importGuests,
  generateGuestQr,
  approveGuest,
  markGuestSent,
} from "@/lib/queries/guests";
import { getFormSchema, putFormSchema, listFormResponses } from "@/lib/queries/forms";
import {
  scanCheckin,
  manualCheckin,
  searchCheckin,
  recentCheckins,
  getDashboard,
  listAttendanceReport,
  listRsvpReport,
} from "@/lib/queries/checkin";
import {
  getInvitation,
  submitRsvp,
  submitForm,
  listSecurityStaff,
  createSecurityStaff,
  deactivateSecurityStaff,
} from "@/lib/queries/invite";
import type { EventListItem, EventDetail, Guest, Category } from "@/lib/types";

export const qk = {
  events: (params?: Record<string, string>) =>
    params && Object.keys(params).length > 0 ? (["events", params] as const) : (["events"] as const),
  event: (id: string) => ["event", id] as const,
  categories: (eventId: string) => ["categories", eventId] as const,
  guests: (eventId: string, params?: Record<string, string>) =>
    params && Object.keys(params).length > 0 ? (["guests", eventId, params] as const) : (["guests", eventId] as const),
  form: (eventId: string) => ["form", eventId] as const,
  formResponses: (eventId: string, params?: Record<string, string>) =>
    params && Object.keys(params).length > 0 ? (["form-responses", eventId, params] as const) : (["form-responses", eventId] as const),
  checkinSearch: (eventId: string, q: string) => ["checkin-search", eventId, q] as const,
  recent: (eventId: string) => ["recent-checkins", eventId] as const,
  dashboard: (eventId: string) => ["dashboard", eventId] as const,
  attendanceReport: (eventId: string, params?: Record<string, string>) =>
    params && Object.keys(params).length > 0 ? (["attendance-report", eventId, params] as const) : (["attendance-report", eventId] as const),
  rsvpReport: (eventId: string, params?: Record<string, string>) =>
    params && Object.keys(params).length > 0 ? (["rsvp-report", eventId, params] as const) : (["rsvp-report", eventId] as const),
  invitation: (token: string) => ["invitation", token] as const,
  team: () => ["team"] as const,
};

export function useEvents(params?: Record<string, string>) {
  return useQuery({
    queryKey: qk.events(params),
    queryFn: () => listEvents(params ?? {}),
  });
}

export function useEvent(
  id: string,
  options?: Partial<UseQueryOptions<EventDetail, Error, EventDetail, readonly ["event", string]>>
) {
  return useQuery({
    queryKey: qk.event(id),
    queryFn: () => getEvent(id),
    ...options,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createEvent(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.events() }),
  });
}

export function useUpdateEvent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateEvent(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.event(id) });
      qc.invalidateQueries({ queryKey: qk.events() });
    },
  });
}

export function useArchiveEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.events() });
      qc.invalidateQueries({ queryKey: ["event"] });
    },
  });
}

export function useUpdateEventConfig(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateEventConfig(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.event(id) }),
  });
}

export function useUpdateBranding(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateBranding(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.event(id) }),
  });
}

export function useCategories(eventId: string) {
  return useQuery({
    queryKey: qk.categories(eventId),
    queryFn: () => listCategories(eventId),
  });
}

export function useCreateCategory(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; colorTag?: string }) => createCategory(eventId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories(eventId) }),
  });
}

export function useUpdateCategory(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<{ name: string; colorTag?: string }> }) =>
      updateCategory(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories(eventId) }),
  });
}

export function useDeleteCategory(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories(eventId) }),
  });
}

export function useGuests(eventId: string, params?: Record<string, string>) {
  return useQuery({
    queryKey: qk.guests(eventId, params),
    queryFn: () => listGuests(eventId, params ?? {}),
    placeholderData: (prev) => prev,
  });
}

export function useCreateGuest(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createGuest(eventId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.guests(eventId) });
      qc.invalidateQueries({ queryKey: qk.dashboard(eventId) });
    },
  });
}

export function useUpdateGuest(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updateGuest(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.guests(eventId) });
      qc.invalidateQueries({ queryKey: qk.dashboard(eventId) });
    },
  });
}

export function useDeleteGuest(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGuest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.guests(eventId) });
      qc.invalidateQueries({ queryKey: qk.dashboard(eventId) });
    },
  });
}

export function useBulkGuestAction(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
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
    }) => bulkGuestAction(eventId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.guests(eventId) });
      qc.invalidateQueries({ queryKey: qk.dashboard(eventId) });
    },
  });
}

export function useImportGuests(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => importGuests(eventId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.guests(eventId) });
      qc.invalidateQueries({ queryKey: qk.dashboard(eventId) });
    },
  });
}

export function useGenerateGuestQr(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => generateGuestQr(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.guests(eventId) }),
  });
}

export function useApproveGuest(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approved" | "rejected" }) => approveGuest(id, decision),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.guests(eventId) }),
  });
}

export function useMarkGuestSent(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markGuestSent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.guests(eventId) }),
  });
}

export function useFormSchema(eventId: string) {
  return useQuery({
    queryKey: qk.form(eventId),
    queryFn: () => getFormSchema(eventId),
  });
}

export function usePutForm(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fields: import("@/lib/types").FormField[]) => putFormSchema(eventId, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.form(eventId) }),
  });
}

export function useFormResponses(eventId: string, params?: Record<string, string>) {
  return useQuery({
    queryKey: qk.formResponses(eventId, params),
    queryFn: () => listFormResponses(eventId, params ?? {}),
  });
}

export function useScanCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, token }: { eventId: string; token: string }) => scanCheckin(eventId, token),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: qk.dashboard(vars.eventId) });
      qc.invalidateQueries({ queryKey: qk.recent(vars.eventId) });
    },
  });
}

export function useManualCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, guestId }: { eventId: string; guestId: string }) => manualCheckin(eventId, guestId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: qk.dashboard(vars.eventId) });
      qc.invalidateQueries({ queryKey: qk.recent(vars.eventId) });
    },
  });
}

export function useSearchCheckin(eventId: string, q: string) {
  return useQuery({
    queryKey: qk.checkinSearch(eventId, q),
    queryFn: () => searchCheckin(eventId, q),
    enabled: q.length >= 2,
  });
}

export function useRecentCheckins(eventId: string, refetchInterval = 15000) {
  return useQuery({
    queryKey: qk.recent(eventId),
    queryFn: () => recentCheckins(eventId),
    refetchInterval,
  });
}

export function useDashboard(eventId: string) {
  return useQuery({
    queryKey: qk.dashboard(eventId),
    queryFn: () => getDashboard(eventId),
    refetchInterval: 15000,
  });
}

export function useAttendanceReport(eventId: string, params?: Record<string, string>) {
  return useQuery({
    queryKey: qk.attendanceReport(eventId, params),
    queryFn: () => listAttendanceReport(eventId, params ?? {}),
  });
}

export function useRsvpReport(eventId: string, params?: Record<string, string>) {
  return useQuery({
    queryKey: qk.rsvpReport(eventId, params),
    queryFn: () => listRsvpReport(eventId, params ?? {}),
  });
}

export function useInvitation(token: string) {
  return useQuery({
    queryKey: qk.invitation(token),
    queryFn: () => getInvitation(token),
  });
}

export function useSubmitRsvp(token: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (response: string) => submitRsvp(token, response),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.invitation(token) }),
  });
}

export function useSubmitForm(token: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (answers: Record<string, unknown>) => submitForm(token, answers),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.invitation(token) }),
  });
}

export function useTeam() {
  return useQuery({
    queryKey: qk.team(),
    queryFn: () => listSecurityStaff(),
  });
}

export function useCreateSecurityStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; email: string; password: string }) => createSecurityStaff(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.team() }),
  });
}

export function useDeactivateSecurityStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateSecurityStaff(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.team() }),
  });
}

export type { EventListItem, Guest, Category };
