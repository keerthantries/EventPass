import {
  LayoutDashboard,
  CalendarDays,
  ScanLine,
  BarChart3,
  Users,
  Settings,
  Tags,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export const globalNav: NavItem[] = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard, roles: ["super_admin", "organizer", "security"] },
  { href: "/events", label: "Events", icon: CalendarDays, roles: ["super_admin", "organizer", "security"] },
  { href: "/attendance", label: "Attendance", icon: ScanLine, roles: ["super_admin", "organizer", "security"] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["super_admin", "organizer"] },
  { href: "/team", label: "Team", icon: Users, roles: ["super_admin", "organizer"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["super_admin", "organizer", "security"] },
];

export interface EventNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export const eventNav: EventNavItem[] = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard, roles: ["super_admin", "organizer", "security"] },
  { href: "/guests", label: "Guests", icon: Users, roles: ["super_admin", "organizer", "security"] },
  { href: "/categories", label: "Categories", icon: Tags, roles: ["super_admin", "organizer"] },
  { href: "/forms", label: "Forms", icon: ClipboardList, roles: ["super_admin", "organizer"] },
  { href: "/attendance", label: "Attendance", icon: ScanLine, roles: ["super_admin", "organizer", "security"] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["super_admin", "organizer"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["super_admin", "organizer"] },
];

export function allowedNav<T extends { roles: UserRole[] }>(items: T[], role?: UserRole): T[] {
  if (!role) return [];
  return items.filter((i) => i.roles.includes(role));
}
