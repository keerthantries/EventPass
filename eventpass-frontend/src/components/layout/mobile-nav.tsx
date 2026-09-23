"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { allowedNav, globalNav } from "@/lib/nav";
import type { UserRole } from "@/lib/types";
import { useAuth } from "@/lib/auth";

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const items = allowedNav(globalNav, user?.role as UserRole | undefined);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Mobile navigation"
    >
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-1 whitespace-nowrap py-2.5 text-[10px] font-medium transition-colors",
              active ? "text-primary" : "text-fg-muted"
            )}
          >
            <item.icon className="size-5 shrink-0" />
            <span className="max-w-full truncate px-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
