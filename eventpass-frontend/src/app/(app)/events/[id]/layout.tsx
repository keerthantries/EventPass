"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { allowedNav, eventNav } from "@/lib/nav";
import type { UserRole } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useEvent } from "@/hooks/queries";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton, PageError } from "@/components/ui/page-state";

const statusVariant: Record<string, "neutral" | "success" | "warning" | "danger" | "primary" | "secondary"> = {
  draft: "neutral",
  published: "success",
  completed: "primary",
  archived: "secondary",
};

export default function EventLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const { user } = useAuth();

  const { data: event, isLoading, isError, error, refetch } = useEvent(params.id);
  const items = allowedNav(eventNav, user?.role as UserRole | undefined);

  if (isLoading) return <PageSkeleton />;
  if (isError) return <PageError message={(error as Error)?.message} onRetry={() => refetch()} />;
  if (!event) return <PageSkeleton />;

  const active = (href: string) =>
    pathname === `/events/${params.id}${href}` || pathname.startsWith(`/events/${params.id}${href}/`);

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/events"
          className="inline-flex items-center gap-1 text-sm text-fg-secondary transition-colors hover:text-fg"
        >
          <ArrowLeft className="size-3.5" />
          Events
        </Link>
      </div>

      <div className="mb-4 flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-fg">{event.name}</h2>
          <Badge variant={statusVariant[event.status] ?? "neutral"}>{event.status}</Badge>
        </div>
        <p className="text-sm text-fg-secondary">
          {event.type}
          {event.venue ? ` · ${event.venue}` : ""}
        </p>
      </div>

      <div className="sticky top-14 z-20 -mx-4 mb-6 flex gap-1 overflow-x-auto border-y border-border bg-surface/95 px-4 py-1 backdrop-blur sm:mx-0 sm:rounded-lg sm:border sm:px-1">
        {items.map((item) => {
          const isActive = active(item.href);
          return (
            <Link
              key={item.href}
              href={`/events/${params.id}${item.href}`}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors sm:py-1.5",
                isActive ? "bg-surface-2 text-fg" : "text-fg-secondary hover:text-fg"
              )}
            >
              <item.icon className="size-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
