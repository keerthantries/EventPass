"use client";

import { cn } from "@/lib/utils";
import type { BadgeVariant } from "@/components/ui/badge";
import type { RsvpStatus, AttendanceStatus, ApprovalStatus } from "@/lib/types";

export function rsvpBadge(status: RsvpStatus): { label: string; variant: BadgeVariant } {
  switch (status) {
    case "accepted":
      return { label: "Accepted", variant: "success" };
    case "declined":
      return { label: "Declined", variant: "danger" };
    case "maybe":
      return { label: "Maybe", variant: "warning" };
    default:
      return { label: "Pending", variant: "neutral" };
  }
}

export function attendanceBadge(status: AttendanceStatus): { label: string; variant: BadgeVariant } {
  return status === "present" ? { label: "Present", variant: "success" } : { label: "Absent", variant: "neutral" };
}

export function approvalBadge(status: ApprovalStatus): { label: string; variant: BadgeVariant } {
  switch (status) {
    case "approved":
      return { label: "Approved", variant: "success" };
    case "rejected":
      return { label: "Rejected", variant: "danger" };
    case "pending":
      return { label: "Pending approval", variant: "warning" };
    default:
      return { label: "Not required", variant: "neutral" };
  }
}

export function statusBadge(status: string): { label: string; variant: BadgeVariant } {
  switch (status) {
    case "accepted":
    case "present":
    case "approved":
    case "published":
    case "success":
      return { label: status, variant: "success" };
    case "declined":
    case "rejected":
    case "danger":
      return { label: status, variant: "danger" };
    case "pending":
    case "maybe":
    case "draft":
    case "warning":
      return { label: status, variant: "warning" };
    default:
      return { label: status, variant: "neutral" };
  }
}

export function CategoryDot({ color, name }: { color?: string; name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", !color && "bg-fg-muted")} style={color ? { background: color } : undefined} />
      {name}
    </span>
  );
}
