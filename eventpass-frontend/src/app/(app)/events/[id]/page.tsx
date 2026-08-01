"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Users,
  TicketCheck,
  CheckCircle2,
  Clock,
  Plus,
  Download,
  ArrowRight,
  UserCheck,
  UserX,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useDashboard, useEvent } from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageSkeleton, PageError } from "@/components/ui/page-state";
import { Button } from "@/components/ui/button";
import { AttendanceTrendChart, RsvpDonutChart } from "@/components/dashboard/charts";
import { EmptyState } from "@/components/ui/empty-state";
import { formatTime } from "@/lib/utils";

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold text-fg">{value}</p>
          {hint ? <p className="mt-0.5 text-xs text-fg-muted">{hint}</p> : null}
        </div>
        <div className="flex size-9 items-center justify-center rounded-md" style={{ background: `${accent}1a`, color: accent }}>
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function EventOverviewPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === "organizer" || user?.role === "super_admin";

  const { data: event, isLoading, isError, error, refetch } = useEvent(params.id);
  const {
    data: dash,
    isLoading: dashLoading,
    isError: dashError,
    error: dashErrorObj,
    refetch: dashRefetch,
  } = useDashboard(params.id);

  if (isLoading) return <PageSkeleton />;
  if (isError) return <PageError message={(error as Error)?.message} onRetry={() => refetch()} />;
  if (!event) return <PageSkeleton />;

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{event.name}</CardTitle>
            <CardDescription>
              {event.type} · {event.status}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-fg-muted">Start date</p>
              <p className="text-sm text-fg">{new Date(event.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-fg-muted">Venue</p>
              <p className="text-sm text-fg">{event.venue ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-fg-muted">Guests</p>
              <p className="text-sm text-fg">{event.stats?.totalGuests ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href={`/events/${params.id}/attendance`}>
                <UserCheck className="size-4" />
                Check in guests
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (dashLoading) return <PageSkeleton />;
  if (dashError) return <PageError message={(dashErrorObj as Error)?.message} onRetry={() => dashRefetch()} />;
  if (!dash) return <PageSkeleton />;

  const s = dash.summary;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Total guests" value={s.totalGuests} icon={Users} accent="#6b78e6" />
        <SummaryCard label="Attendance" value={`${s.attendancePercentage}%`} hint={`${s.presentGuests} present`} icon={TicketCheck} accent="#2fb85e" />
        <SummaryCard label="RSVP accepted" value={s.rsvpAccepted} hint={`${s.rsvpDeclined} declined`} icon={CheckCircle2} accent="#6b78e6" />
        <SummaryCard label="Pending RSVP" value={s.pendingResponses} icon={Clock} accent="#e0a83c" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm">
          <Link href={`/events/${params.id}/guests`}>
            <Plus className="size-4" />
            Add guests
          </Link>
        </Button>
        <Button asChild size="sm" variant="secondary">
          <Link href={`/events/${params.id}/attendance`}>
            <UserCheck className="size-4" />
            Open scanner
          </Link>
        </Button>
        <Button asChild size="sm" variant="secondary">
          <Link href={`/events/${params.id}/reports`}>
            <Download className="size-4" />
            Reports
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance trend</CardTitle>
            <CardDescription>Check-ins by hour</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceTrendChart data={dash.attendanceTrend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>RSVP distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <RsvpDonutChart data={dash.rsvpDistribution} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Live check-ins</CardTitle>
            <CardDescription>Most recent arrivals</CardDescription>
          </CardHeader>
          <CardContent>
            {dash.liveCheckins.length === 0 ? (
              <EmptyState icon={UserX} title="No check-ins yet" description="Guests you check in will appear here in real time." />
            ) : (
              <ul className="divide-y divide-border">
                {dash.liveCheckins.map((l, i) => (
                  <li key={i} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium text-fg">{l.guestName}</p>
                      <p className="text-xs text-fg-muted">{l.category ?? "Uncategorised"}</p>
                    </div>
                    <span className="text-xs text-fg-secondary">{formatTime(l.checkInTime)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {dash.recentActivity.length === 0 ? (
              <EmptyState title="No activity yet" description="Invitation and check-in activity will show up here." />
            ) : (
              <ul className="divide-y divide-border">
                {dash.recentActivity.map((a, i) => (
                  <li key={i} className="flex items-center justify-between py-2.5">
                    <p className="text-sm text-fg">{a.guestName} <span className="text-fg-muted">checked in</span></p>
                    <Link href={`/events/${params.id}/guests`} className="text-xs text-fg-secondary hover:text-primary">
                      View <ArrowRight className="inline size-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
