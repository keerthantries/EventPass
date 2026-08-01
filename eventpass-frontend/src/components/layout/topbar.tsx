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

export function Topbar({ onOpenMobileNav }: TopbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const title = routeTitles[pathname] ?? "EventPass";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur">
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="inline-flex size-9 items-center justify-center rounded-md text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg md:hidden"
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
