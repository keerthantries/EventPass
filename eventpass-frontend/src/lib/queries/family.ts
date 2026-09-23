import { apiRequest } from "@/lib/api";

export interface FamilyPageData {
  party: { name: string; side?: string };
  event: {
    name: string;
    brideName?: string;
    groomName?: string;
    startDate: string;
    startTime?: string;
    venue?: string;
    branding?: { primaryColor?: string; secondaryColor?: string };
  };
  guests: {
    firstName?: string;
    lastName?: string;
    fullName: string;
    invitationToken?: string;
    attendanceStatus: string;
  }[];
}

export async function getFamily(token: string): Promise<FamilyPageData> {
  const { data } = await apiRequest<FamilyPageData>(`/public/family/${encodeURIComponent(token)}`);
  return data;
}
