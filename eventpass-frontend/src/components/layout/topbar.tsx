"use client";

import { usePathname } from "next/navigation";
import { Menu, LogOut, ChevronDown } from "lucide-react";
import { initials } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopbarProps {
  onOpenMobileNav: () => void;
}

const routeTitles: Record<string, string> = {
  "/overview": "Overview",
  "/events": "Events",
  "/attendance": "Attendance",
  "/reports": "Reports",
  "/team": "Team",
  "/settings": "Settings",
};

const eventSegmentTitles: Record<string, string> = {
  overview: "Overview",
  guests: "Guests",
  categories: "Categories",
  forms: "Forms",
  invitations: "Invitations",
  attendance: "Check-In",
  reports: "Reports",
  settings: "Settings",
};

function titleFor(pathname: string): string {
  const exact = routeTitles[pathname];
  if (exact) return exact;
  const eventMatch = pathname.match(/^\/events\/[^/]+(?:\/([^/]+))?/);
  if (eventMatch) {
    const segment = eventMatch[1];
    if (!segment) return "Guests";
    return eventSegmentTitles[segment] ?? "Event";
  }
  if (pathname.startsWith("/events")) return "Events";
  return "EventPass";
}

export function Topbar({ onOpenMobileNav }: TopbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const title = titleFor(pathname);

  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center gap-3 border-b border-border bg-bg/80 px-4 pb-1 pt-[max(0.25rem,env(safe-area-inset-top))] backdrop-blur md:pb-1 md:pt-1">
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="inline-flex size-11 items-center justify-center rounded-md text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold text-fg">{title}</h1>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              {user ? initials(user.name) : "?"}
            </span>
            <span className="hidden text-sm text-fg sm:block">{user?.name}</span>
            <ChevronDown className="hidden size-3.5 text-fg-muted sm:block" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => logout()}>
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
