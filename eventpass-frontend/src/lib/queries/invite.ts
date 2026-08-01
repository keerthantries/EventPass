import { apiRequest } from "@/lib/api";
import type { Invitation, InvitationSubmitResult, FormSubmitResult, SecurityStaff } from "@/lib/types";

export async function getInvitation(token: string): Promise<Invitation> {
  const { data } = await apiRequest<Invitation>(`/public/invite/${encodeURIComponent(token)}`);
  return data;
}

export async function submitRsvp(token: string, response: string): Promise<InvitationSubmitResult> {
  const { data } = await apiRequest<InvitationSubmitResult>(`/public/invite/${encodeURIComponent(token)}/rsvp`, {
    method: "POST",
    body: { response },
  });
  return data;
}

export async function submitForm(token: string, answers: Record<string, unknown>): Promise<FormSubmitResult> {
  const { data } = await apiRequest<FormSubmitResult>(`/public/invite/${encodeURIComponent(token)}/form`, {
    method: "POST",
    body: { answers },
  });
  return data;
}

export async function listSecurityStaff(): Promise<SecurityStaff[]> {
  const { data } = await apiRequest<SecurityStaff[]>("/auth/security-staff");
  return data;
}

export async function createSecurityStaff(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<SecurityStaff> {
  const { data } = await apiRequest<SecurityStaff>("/auth/security-staff", { method: "POST", body: payload });
  return data;
}

export async function deactivateSecurityStaff(id: string): Promise<void> {
  await apiRequest(`/auth/security-staff/${id}`, { method: "DELETE" });
}
