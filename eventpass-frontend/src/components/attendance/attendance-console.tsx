"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Search, UserCheck, History, ScanLine, Crown, Users, Undo2, LogIn, ChevronDown } from "lucide-react";
import { useLookupCheckin, useScanCheckin, useManualCheckin, useUndoCheckin, useReentryCheckin, useSearchCheckin, useRecentCheckins } from "@/hooks/queries";
import { useDebounce } from "@/hooks/use-debounce";
import { ApiClientError } from "@/lib/api";
import type { CheckinResult, CheckinLookup, DuplicateCheckinDetails } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { QrScanner } from "@/components/scanner/qr-scanner";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn, formatDateTime, formatTime, initials } from "@/lib/utils";

type ScanFeedback =
  | { kind: "ready"; token: string; data: CheckinLookup }
  | { kind: "success"; data: CheckinResult }
  | { kind: "duplicate"; message: string; details?: DuplicateCheckinDetails }
  | { kind: "error"; message: string };

function lookupToDetails(data: CheckinLookup): DuplicateCheckinDetails {
  return {
    guestId: data.guestId,
    fullName: data.guest.fullName,
    partyName: data.guest.partyName,
    side: data.guest.side,
    isVip: data.guest.isVip,
    rsvpStatus: data.guest.rsvpStatus,
    checkInTime: data.checkInTime,
  };
}

export function AttendanceConsole({ eventId }: { eventId: string }) {
  const lookupMutation = useLookupCheckin();
  const scanMutation = useScanCheckin();
  const manualMutation = useManualCheckin();
  const undoMutation = useUndoCheckin(eventId);
  const reentryMutation = useReentryCheckin(eventId);
  const { data: recent, isLoading: recentLoading } = useRecentCheckins(eventId);
  const { toast } = useToast();

  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Keep the result card (and its confirm button) in view on phones, where the
  // square scanner pushes it below the fold.
  useEffect(() => {
    if (!feedback) return;
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [feedback]);

  const flashSuccess = () => {
    setFlash(true);
    window.setTimeout(() => setFlash(false), 1200);
  };

  const runCheckin = async (action: () => Promise<CheckinResult>, duplicateHint: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await action();
      setFeedback({ kind: "success", data: result });
      flashSuccess();
    } catch (err) {
      const e = err as ApiClientError;
      if (e.status === 409) {
        const details = (e.details?.[0] ?? undefined) as DuplicateCheckinDetails | undefined;
        setFeedback({ kind: "duplicate", message: duplicateHint, details });
      } else {
        setFeedback({ kind: "error", message: e.message });
      }
    } finally {
      setBusy(false);
    }
  };

  // Step 1: scan → look up guest only (no attendance change)
  const handleScan = async (token: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const data = await lookupMutation.mutateAsync({ eventId, token });
      if (data.attendanceStatus === "present") {
        setFeedback({
          kind: "duplicate",
          message: "This guest is already checked in. No duplicate entry was created.",
          details: lookupToDetails(data),
        });
      } else {
        setFeedback({ kind: "ready", token, data });
      }
    } catch (err) {
      const e = err as ApiClientError;
      setFeedback({ kind: "error", message: e.message });
    } finally {
      setBusy(false);
    }
  };

  // Step 2: staff presses "Check In Guest" → mark present
  const handleConfirm = async (token: string) => {
    await runCheckin(
      () => scanMutation.mutateAsync({ eventId, token }),
      "This guest is already checked in. No duplicate entry was created."
    );
  };

  const handleManual = async (guestId: string) => {
    await runCheckin(
      () => manualMutation.mutateAsync({ eventId, guestId }),
      "This guest was already checked in. No duplicate entry was created."
    );
  };

  const handleUndo = async (guestId: string) => {
    if (busy || undoMutation.isPending) return;
    setBusy(true);
    try {
      const result = await undoMutation.mutateAsync(guestId);
      setFeedback(null);
      toast({ title: "Check-in undone", description: `${result.fullName} is marked as not arrived.`, variant: "success" });
    } catch (err) {
      toast({ title: "Could not undo check-in", description: (err as Error).message, variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleReentry = async (guestId: string) => {
    if (busy || reentryMutation.isPending) return;
    setBusy(true);
    try {
      const result = await reentryMutation.mutateAsync(guestId);
      setFeedback({ kind: "success", data: { guest: result.guest, attendanceStatus: result.attendanceStatus, checkInTime: result.checkInTime } });
      toast({ title: "Re-entry allowed", description: `${result.guest.fullName} may re-enter.`, variant: "success" });
    } catch (err) {
      toast({ title: "Could not allow re-entry", description: (err as Error).message, variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card className={flash ? "border-success/60 shadow-[0_0_24px_-6px_rgba(47,184,94,0.45)]" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="size-4 text-primary" />
              Scanner
            </CardTitle>
            <CardDescription>Scan a QR code, review the guest, then confirm check-in</CardDescription>
          </CardHeader>
          <CardContent>
            <QrScanner onScan={handleScan} disabled={busy} />
          </CardContent>
        </Card>

        <div ref={resultRef}>
          <ScanResult
            feedback={feedback}
            busy={busy}
            onConfirm={handleConfirm}
            onUndo={handleUndo}
            onReentry={handleReentry}
            acting={undoMutation.isPending || reentryMutation.isPending || scanMutation.isPending}
          />
        </div>

        <ManualSearch eventId={eventId} onCheckIn={handleManual} onUndo={handleUndo} busy={busy} />
      </div>

      <div>
        <RecentFeed loading={recentLoading} items={recent ?? []} />
      </div>
    </div>
  );
}

function GuestChips({ g }: { g: { partyName?: string | null; side?: string; isVip?: boolean; rsvpStatus?: string } }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-fg-secondary">
      {g.partyName && (
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs">
          <Users className="size-3" />
          {g.partyName}
        </span>
      )}
      {g.side && (
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs">
          {g.side}
        </span>
      )}
      {g.isVip && (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs text-yellow-600">
          <Crown className="size-3" />
          VIP
        </span>
      )}
      {g.rsvpStatus && (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs",
            g.rsvpStatus === "accepted" ? "bg-green-500/10 text-green-600" :
            g.rsvpStatus === "declined" ? "bg-red-500/10 text-red-600" :
            "bg-yellow-500/10 text-yellow-600"
          )}
        >
          RSVP: {g.rsvpStatus}
        </span>
      )}
    </div>
  );
}

function ScanResult({
  feedback,
  busy,
  onConfirm,
  onUndo,
  onReentry,
  acting,
}: {
  feedback: ScanFeedback | null;
  busy: boolean;
  onConfirm: (token: string) => void;
  onUndo: (guestId: string) => void;
  onReentry: (guestId: string) => void;
  acting: boolean;
}) {
  if (busy && !feedback) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-8 text-sm text-fg-secondary">
          <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Looking up guest...
        </CardContent>
      </Card>
    );
  }

  if (!feedback) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 text-sm text-fg-muted">
          Scan a QR code to see the result here.
        </CardContent>
      </Card>
    );
  }

  if (feedback.kind === "ready") {
    const data = feedback.data;
    return (
      <Card className="overflow-hidden border-primary/40 animate-scale-in">
        <div className="h-1 w-full bg-gradient-to-r from-primary to-secondary" />
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/15">
                <CheckCircle2 className="size-7 text-primary" />
              </div>
              <span className="absolute -inset-1 rounded-full bg-primary/20 blur-md" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-primary">Valid Wedding Pass</p>
              <p className="truncate text-lg font-semibold text-fg">{data.guest.fullName}</p>
            </div>
            <Badge variant="neutral" className="shrink-0">
              Not Arrived
            </Badge>
          </div>
          <GuestChips g={data.guest} />
          <div className="mt-4">
            <Button size="lg" className="w-full sm:w-auto" onClick={() => onConfirm(feedback.token)} disabled={busy || acting} loading={busy}>
              <UserCheck className="size-4" />
              Check In Guest
            </Button>
          </div>
          <p className="mt-2 text-xs text-fg-muted">
            Review the guest above, then confirm to mark them present.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (feedback.kind === "success") {
    const g = feedback.data.guest;
    return (
      <Card className="overflow-hidden border-success/40 animate-scale-in">
        <div className="h-1 w-full bg-gradient-to-r from-success to-primary" />
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="flex size-12 items-center justify-center rounded-full bg-success/15">
                <CheckCircle2 className="size-7 text-success" />
              </div>
              <span className="absolute -inset-1 rounded-full bg-success/20 blur-md" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-success">✓ Checked In</p>
              <p className="truncate text-lg font-semibold text-fg">{g.fullName}</p>
              <p className="text-xs text-fg-muted">{formatDateTime(feedback.data.checkInTime)}</p>
            </div>
            <Badge variant="success" className="shrink-0">
              Present
            </Badge>
          </div>
          <GuestChips g={g} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden animate-scale-in",
        feedback.kind === "duplicate" ? "border-warning/30" : "border-danger/30"
      )}
    >
      <div
        className={cn(
          "h-1 w-full",
          feedback.kind === "duplicate"
            ? "bg-gradient-to-r from-warning to-secondary"
            : "bg-gradient-to-r from-danger to-secondary"
        )}
      />
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          {feedback.kind === "duplicate" ? (
            <div className="relative shrink-0">
              <div className="flex size-12 items-center justify-center rounded-full bg-warning/15">
                <AlertTriangle className="size-6 text-warning" />
              </div>
            </div>
          ) : (
            <div className="relative shrink-0">
              <div className="flex size-12 items-center justify-center rounded-full bg-danger/15">
                <XCircle className="size-6 text-danger" />
              </div>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-fg-secondary">
              {feedback.kind === "duplicate" ? "Already Checked In" : "Scan Failed"}
            </p>
            {feedback.kind === "duplicate" && feedback.details ? (
              <>
                <p className="truncate text-lg font-semibold text-fg">{feedback.details.fullName}</p>
                <p className="mt-0.5 text-xs text-fg-muted">
                  Originally checked in:{" "}
                  {feedback.details.checkInTime ? formatTime(feedback.details.checkInTime) : "N/A"}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                  {feedback.details.partyName && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5">
                      <Users className="size-3" />
                      {feedback.details.partyName}
                    </span>
                  )}
                  {feedback.details.side && (
                    <span className="rounded-full bg-surface-2 px-2 py-0.5">{feedback.details.side}</span>
                  )}
                  {feedback.details.isVip && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-yellow-600">
                      <Crown className="size-3" />
                      VIP
                    </span>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm font-medium text-fg">{feedback.message}</p>
            )}
            <p className="mt-0.5 text-xs text-fg-muted">
              {feedback.kind === "duplicate"
                ? "No duplicate entry was created."
                : "The QR code could not be validated. Please try again."}
            </p>
          </div>
        </div>
        {feedback.kind === "duplicate" && feedback.details?.guestId && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto" onClick={() => onReentry(feedback.details!.guestId)} disabled={busy || acting}>
              <LogIn className="size-4" />
              Allow Re-entry
            </Button>
            <Button size="lg" variant="secondary" className="w-full sm:w-auto" onClick={() => onUndo(feedback.details!.guestId)} disabled={busy || acting}>
              <Undo2 className="size-4" />
              Undo Check-In
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ManualSearch({
  eventId,
  onCheckIn,
  onUndo,
  busy,
}: {
  eventId: string;
  onCheckIn: (guestId: string) => void;
  onUndo: (guestId: string) => void;
  busy: boolean;
}) {
  const [q, setQ] = useState("");
  const debounced = useDebounce(q, 300);
  const { data, isFetching } = useSearchCheckin(eventId, debounced);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Manual check-in</CardTitle>
        <CardDescription>Search by name, email or phone</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search guests..." className="pl-9" />
        </div>
        {debounced.length < 2 ? (
          <p className="text-xs text-fg-muted">Type at least 2 characters to search.</p>
        ) : isFetching ? (
          <p className="text-xs text-fg-muted">Searching...</p>
        ) : data && data.length === 0 ? (
          <p className="text-xs text-fg-muted">No guests found.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(data ?? []).map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-fg-secondary">
                    {initials(g.fullName)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-fg">{g.fullName}</p>
                      {g.isVip && <Crown className="size-3 shrink-0 text-yellow-500" />}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-fg-muted">
                      {g.category && <span>{g.category}</span>}
                      {g.partyName && <span>· {g.partyName}</span>}
                      {g.side && <span>· {g.side}</span>}
                    </div>
                  </div>
                </div>
                {g.attendanceStatus === "present" ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge variant="success">Present</Badge>
                    <Button size="sm" variant="secondary" onClick={() => onUndo(g.id)} disabled={busy}>
                      <Undo2 className="size-3.5" />
                      Undo
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" onClick={() => onCheckIn(g.id)} disabled={busy}>
                    <UserCheck className="size-3.5" />
                    Check in
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function RecentFeed({ loading, items }: { loading: boolean; items: { guestName: string; checkInTime: string; method: string }[] }) {
  const body = (
    <>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-surface-2" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="No check-ins yet" />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((r, i) => (
            <li key={i} className="flex items-center gap-3 py-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[11px] font-semibold text-fg-secondary">
                {initials(r.guestName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{r.guestName}</p>
                <p className="text-xs capitalize text-fg-muted">{r.method} check-in</p>
              </div>
              <span className="shrink-0 text-xs tabular-nums text-fg-secondary">{formatTime(r.checkInTime)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  return (
    <>
      {/* Mobile: collapsed to keep scanner + result above the fold */}
      <details className="group rounded-lg border border-border bg-surface lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-semibold text-fg [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <History className="size-4" />
            Recent check-ins
          </span>
          <ChevronDown className="size-4 text-fg-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-border p-4">{body}</div>
      </details>

      {/* Desktop: always open */}
      <Card className="hidden lg:block">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-4" />
            Recent check-ins
          </CardTitle>
          <CardDescription>Refreshes automatically</CardDescription>
        </CardHeader>
        <CardContent>{body}</CardContent>
      </Card>
    </>
  );
}
