"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Search, UserCheck, History, UserRound, ScanLine } from "lucide-react";
import { useScanCheckin, useManualCheckin, useSearchCheckin, useRecentCheckins } from "@/hooks/queries";
import { useDebounce } from "@/hooks/use-debounce";
import { ApiClientError } from "@/lib/api";
import type { CheckinResult } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { QrScanner } from "@/components/scanner/qr-scanner";
import { Badge } from "@/components/ui/badge";
import { cn, formatTime, initials } from "@/lib/utils";

type ScanFeedback =
  | { kind: "success"; data: CheckinResult }
  | { kind: "duplicate"; message: string }
  | { kind: "error"; message: string };

export function AttendanceConsole({ eventId }: { eventId: string }) {
  const scanMutation = useScanCheckin();
  const manualMutation = useManualCheckin();
  const { data: recent, isLoading: recentLoading } = useRecentCheckins(eventId);

  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);

  const flashSuccess = () => {
    setFlash(true);
    window.setTimeout(() => setFlash(false), 1200);
  };

  // Serialises check-ins: while one is in flight, further scans/taps are ignored
  // so a double tap or re-scan can never create a duplicate request.
  const runCheckin = async (action: () => Promise<CheckinResult>, duplicateHint: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await action();
      setFeedback({ kind: "success", data: result });
      flashSuccess();
    } catch (err) {
      const e = err as ApiClientError;
      setFeedback(
        e.status === 409
          ? { kind: "duplicate", message: duplicateHint }
          : { kind: "error", message: e.message }
      );
    } finally {
      setBusy(false);
    }
  };

  const handleScan = async (token: string) => {
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

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card className={flash ? "border-success/60 shadow-[0_0_24px_-6px_rgba(47,184,94,0.45)]" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="size-4 text-primary" />
              Scanner
            </CardTitle>
            <CardDescription>Point the camera at a guest QR code</CardDescription>
          </CardHeader>
          <CardContent>
            <QrScanner onScan={handleScan} disabled={busy} />
          </CardContent>
        </Card>

        <ScanResult feedback={feedback} busy={busy} />

        <ManualSearch eventId={eventId} onCheckIn={handleManual} busy={busy} />
      </div>

      <div>
        <RecentFeed loading={recentLoading} items={recent ?? []} />
      </div>
    </div>
  );
}

function ScanResult({ feedback, busy }: { feedback: ScanFeedback | null; busy: boolean }) {
  if (busy && !feedback) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-8 text-sm text-fg-secondary">
          <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Checking guest in…
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

  if (feedback.kind === "success") {
    return (
      <Card className="overflow-hidden border-success/40 animate-scale-in">
        <div className="h-1 w-full bg-gradient-to-r from-success to-primary" />
        <CardContent className="flex items-center gap-4 p-5">
          <div className="relative shrink-0">
            <div className="flex size-12 items-center justify-center rounded-full bg-success/15">
              <CheckCircle2 className="size-7 text-success" />
            </div>
            <span className="absolute -inset-1 rounded-full bg-success/20 blur-md" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-success">Checked in</p>
            <p className="truncate text-lg font-semibold text-fg">{feedback.data.guest.fullName}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-fg-secondary">{feedback.data.guest.category ?? "Uncategorised"}</span>
              <span className="text-xs text-fg-muted">· {formatTime(feedback.data.checkInTime)}</span>
            </div>
          </div>
          <Badge variant="success" className="shrink-0">
            Present
          </Badge>
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
      <CardContent className="flex items-center gap-4 p-5">
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
            {feedback.kind === "duplicate" ? "Already checked in" : "Scan failed"}
          </p>
          <p className="text-sm font-medium text-fg">{feedback.message}</p>
          <p className="mt-0.5 text-xs text-fg-muted">
            {feedback.kind === "duplicate"
              ? "No duplicate entry was created. Move on to the next guest."
              : "The QR code could not be validated. Please try again."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ManualSearch({
  eventId,
  onCheckIn,
  busy,
}: {
  eventId: string;
  onCheckIn: (guestId: string) => void;
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
          <p className="text-xs text-fg-muted">Searching…</p>
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
                    <p className="truncate text-sm font-medium text-fg">{g.fullName}</p>
                    <p className="text-xs text-fg-muted">{g.category ?? "Uncategorised"}</p>
                  </div>
                </div>
                {g.attendanceStatus === "present" ? (
                  <Badge variant="success" className="shrink-0">
                    Present
                  </Badge>
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="size-4" />
          Recent check-ins
        </CardTitle>
        <CardDescription>Refreshes automatically</CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
