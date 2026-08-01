"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Search, UserCheck, History } from "lucide-react";
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
import { formatTime } from "@/lib/utils";

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

  const flashSuccess = () => {
    setFlash(true);
    window.setTimeout(() => setFlash(false), 1200);
  };

  const handleScan = async (token: string) => {
    try {
      const result = await scanMutation.mutateAsync({ eventId, token });
      setFeedback({ kind: "success", data: result });
      flashSuccess();
    } catch (err) {
      const e = err as ApiClientError;
      if (e.status === 409) {
        setFeedback({ kind: "duplicate", message: e.message });
      } else {
        setFeedback({ kind: "error", message: e.message });
      }
    }
  };

  const handleManual = async (guestId: string) => {
    try {
      const result = await manualMutation.mutateAsync({ eventId, guestId });
      setFeedback({ kind: "success", data: result });
      flashSuccess();
    } catch (err) {
      setFeedback({ kind: "error", message: (err as ApiClientError).message });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card className={flash ? "border-success" : ""}>
          <CardHeader>
            <CardTitle>Scanner</CardTitle>
            <CardDescription>Point the camera at a guest QR code</CardDescription>
          </CardHeader>
          <CardContent>
            <QrScanner onScan={handleScan} />
          </CardContent>
        </Card>

        <ScanResult feedback={feedback} />

        <ManualSearch eventId={eventId} onCheckIn={handleManual} />
      </div>

      <div>
        <RecentFeed loading={recentLoading} items={recent ?? []} />
      </div>
    </div>
  );
}

function ScanResult({ feedback }: { feedback: ScanFeedback | null }) {
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
      <Card className="border-success/50 bg-success/5">
        <CardContent className="flex items-center gap-4 p-5">
          <CheckCircle2 className="size-10 shrink-0 text-success" />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-fg">{feedback.data.guest.fullName}</p>
            <p className="text-sm text-fg-secondary">{feedback.data.guest.category ?? "Uncategorised"}</p>
            <p className="mt-1 text-xs text-success">Checked in · {formatTime(feedback.data.checkInTime)}</p>
          </div>
          <Badge variant="success">Present</Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={feedback.kind === "duplicate" ? "border-warning/50 bg-warning/5" : "border-danger/50 bg-danger/5"}>
      <CardContent className="flex items-center gap-4 p-5">
        {feedback.kind === "duplicate" ? (
          <AlertTriangle className="size-10 shrink-0 text-warning" />
        ) : (
          <XCircle className="size-10 shrink-0 text-danger" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-fg">{feedback.message}</p>
          <p className="mt-0.5 text-xs text-fg-secondary">
            {feedback.kind === "duplicate" ? "This guest has already been checked in." : "The QR code could not be validated."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ManualSearch({ eventId, onCheckIn }: { eventId: string; onCheckIn: (guestId: string) => void }) {
  const [q, setQ] = useState("");
  const debounced = useDebounce(q, 300);
  const { data, isFetching } = useSearchCheckin(eventId, debounced);

  return (
    <Card>
      <CardHeader>
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
              <li key={g.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">{g.fullName}</p>
                  <p className="text-xs text-fg-muted">{g.category ?? "Uncategorised"}</p>
                </div>
                {g.attendanceStatus === "present" ? (
                  <Badge variant="success">Present</Badge>
                ) : (
                  <Button size="sm" onClick={() => onCheckIn(g.id)}>
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
              <li key={i} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">{r.guestName}</p>
                  <p className="text-xs text-fg-muted capitalize">{r.method} check-in</p>
                </div>
                <span className="shrink-0 text-xs text-fg-secondary">{formatTime(r.checkInTime)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
