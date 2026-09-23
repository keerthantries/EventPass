export type UserRole = "super_admin" | "organizer" | "security";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizerId?: string | null;
  isActive?: boolean;
}

export interface AuthSession {
  token: string;
  user: User;
}

export type EventStatus = "draft" | "published" | "completed" | "archived";
export type RsvpMode = "disabled" | "accept_only" | "accept_decline" | "accept_decline_maybe";
export type WorkflowKey = "add_qr_checkin" | "invite_rsvp" | "invite_rsvp_form_qr" | "invite_form_approval_qr";
export type QrTiming = "on_add" | "on_rsvp_accept" | "on_approval";

export interface EventModules {
  invitation: boolean;
  rsvp: boolean;
  dynamicForm: boolean;
  qrCheckin: boolean;
  csvImport: boolean;
  reports: boolean;
}

export interface EventConfig {
  _id: string;
  eventId: string;
  modules: EventModules;
  rsvpMode: RsvpMode;
  rsvpDeadline?: string | null;
  rsvpMessages?: { confirmation?: string; thankYou?: string };
  workflow: WorkflowKey;
  qrGenerationTiming: QrTiming;
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventListItem {
  id: string;
  name: string;
  type: string;
  status: EventStatus;
  startDate: string;
  guestCount: number;
}

export interface EventDetail extends EventListItem {
  description?: string;
  venue?: string;
  venueAddress?: string;
  mapLink?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  guestArrivalTime?: string;
  timezone: string;
  bannerImage?: string;
  coverImage?: string;
  logo?: string;
  branding: { primaryColor?: string; secondaryColor?: string };
  brideName?: string;
  groomName?: string;
  dressCode?: string;
  weddingWebsiteUrl?: string;
  invitationBackgroundImage?: string;
  invitationMessage?: string;
  bismillahImageUrl?: string;
  quranVerse?: string;
  quranReference?: string;
  createdAt: string;
  updatedAt: string;
  config?: EventConfig;
  stats?: { totalGuests: number; present: number; rsvpAccepted: number };
}

export interface Category {
  _id: string;
  eventId: string;
  name: string;
  colorTag?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Party {
  _id: string;
  eventId: string;
  name: string;
  side?: string;
  contactEmail?: string;
  contactPhone?: string;
  token: string;
  createdAt: string;
  updatedAt: string;
}

export type RsvpStatus = "pending" | "accepted" | "declined" | "maybe";
export type AttendanceStatus = "absent" | "present";
export type ApprovalStatus = "not_required" | "pending" | "approved" | "rejected";
export type InvitationStatus = "not_sent" | "sent" | "opened";

export interface Guest {
  _id: string;
  eventId: string;
  categoryId?: string | null;
  partyId?: string | null;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  notes?: string;
  side?: string;
  isVip?: boolean;
  isImmediateFamily?: boolean;
  invitationToken?: string;
  invitationStatus: InvitationStatus;
  invitationSentAt?: string | null;
  invitationOpenedAt?: string | null;
  rsvpStatus: RsvpStatus;
  rsvpRespondedAt?: string | null;
  approvalStatus: ApprovalStatus;
  qrToken?: string;
  qrGeneratedAt?: string | null;
  attendanceStatus: AttendanceStatus;
  checkInTime?: string | null;
  checkedInBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type FormFieldType =
  | "short_text"
  | "long_text"
  | "number"
  | "email"
  | "phone"
  | "date"
  | "time"
  | "dropdown"
  | "radio"
  | "checkbox"
  | "multi_choice"
  | "yes_no";

export interface FormField {
  key: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  defaultValue?: unknown;
  description?: string;
  options?: string[];
}

export interface FormResponseRow {
  guestId: string;
  guestName: string;
  answers: Record<string, unknown>;
  submittedAt: string;
}

export interface CheckinResult {
  guest: {
    fullName: string;
    firstName?: string;
    category: string | null;
    partyName?: string | null;
    side?: string;
    isVip?: boolean;
    rsvpStatus?: RsvpStatus;
  };
  attendanceStatus: AttendanceStatus;
  checkInTime: string;
}

export interface CheckinSearchResult {
  id: string;
  fullName: string;
  firstName?: string;
  category: string | null;
  partyName?: string | null;
  side?: string;
  isVip?: boolean;
  rsvpStatus?: RsvpStatus;
  attendanceStatus: AttendanceStatus;
}

export interface RecentCheckin {
  guestName: string;
  checkInTime: string;
  method: "camera" | "manual";
}

export interface DashboardData {
  summary: {
    totalGuests: number;
    invitationsSent: number;
    rsvpAccepted: number;
    rsvpDeclined: number;
    pendingResponses: number;
    presentGuests: number;
    absentGuests: number;
    attendancePercentage: number;
  };
  attendanceTrend: { hour: string; count: number }[];
  rsvpDistribution: { status: string; count: number }[];
  recentActivity: { type: string; guestName: string; at: string }[];
  liveCheckins: { guestName: string; category: string | null; checkInTime: string }[];
}

export interface AttendanceReportRow {
  guestName: string;
  category: string | null;
  rsvpStatus: RsvpStatus;
  attendanceStatus: AttendanceStatus;
  checkInTime: string | null;
}

export interface RsvpReportRow {
  guestName: string;
  category: string | null;
  rsvpStatus: RsvpStatus;
  rsvpRespondedAt: string | null;
}

export interface ImportResult {
  totalRows: number;
  imported: number;
  skippedDuplicates: number;
  failed: number;
  errors: { row: number; reason: string }[];
}

export interface SecurityStaff {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export interface Invitation {
  event: {
    name: string;
    brideName?: string;
    groomName?: string;
    dressCode?: string;
    weddingWebsiteUrl?: string;
    banner?: string;
    invitationBackgroundImage?: string;
    venue?: string;
    venueAddress?: string;
    mapLink?: string;
    startDate: string;
    startTime?: string;
    endTime?: string;
    guestArrivalTime?: string;
    branding?: { primaryColor?: string; secondaryColor?: string };
    invitationMessage?: string;
    bismillahImageUrl?: string;
    quranVerse?: string;
    quranReference?: string;
  };
  guest: {
    firstName?: string;
    lastName?: string;
    fullName: string;
    rsvpStatus: RsvpStatus;
    qrToken?: string;
    partyName?: string;
    side?: string;
    invitationToken?: string;
  };
  config: { modules: EventModules; rsvpMode: RsvpMode };
  formSchema: FormField[];
}

export interface InvitationSubmitResult {
  rsvpStatus: RsvpStatus;
  rsvpRespondedAt: string;
  nextStep: "form" | "qr" | "done";
}

export interface FormSubmitResult {
  submitted: boolean;
  approvalStatus: ApprovalStatus;
  qrToken: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorBody {
  error?: {
    code?: string;
    message: string;
    details?: unknown[];
  };
  message?: string;
}
