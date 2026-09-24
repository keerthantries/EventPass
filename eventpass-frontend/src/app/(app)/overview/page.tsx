"use client";

import Link from "next/link";
import { Plus, CalendarDays, ArrowRight, Ticket } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEvents } from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton, PageError } from "@/components/ui/page-state";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

const statusVariant: Record<string, "neutral" | "success" | "warning" | "danger" | "primary" | "secondary"> = {
  draft: "neutral",
  published: "success",
  completed: "primary",
  archived: "secondary",
};

export default function OverviewPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useEvents({ page: "1", limit: "6" });
  const canManage = user?.role === "organizer" || user?.role === "super_admin";

  const firstName = user?.name?.split(" ")[0] ?? "there";

  if (isLoading) return <PageSkeleton rows={4} />;
  if (isError) return <PageError message={(error as Error)?.message} onRetry={() => refetch()} />;

  const events = data?.items ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-fg">Welcome back, {firstName}</h2>
          <p className="mt-1 text-sm text-fg-secondary">
            Manage your events, invitations and live attendance from one place.
          </p>
        </div>
        {canManage ? (
          <Button asChild className="w-full sm:w-auto">
            <Link href="/events/new">
              <Plus className="size-4" />
              New event
            </Link>
          </Button>
        ) : null}
      </div>

      {events.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarDays}
            title="No events yet"
            description="Create your first event to start inviting guests, collecting RSVPs and checking people in."
          />
        </Card>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-fg">Recent events</h3>
            <Link href="/events" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover">
              View all
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className="group">
                <Card className="h-full transition-colors group-hover:border-border-strong">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-1 group-hover:text-primary">{event.name}</CardTitle>
                      <Badge variant={statusVariant[event.status] ?? "neutral"}>{event.status}</Badge>
                    </div>
                    <CardDescription>{event.type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-fg-secondary">{formatDate(event.startDate)}</span>
                      <span className="inline-flex items-center gap-1.5 text-fg-muted">
                        <Ticket className="size-3.5" />
                        {event.guestCount} guests
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
