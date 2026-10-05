"use client";

import { useEffect } from "react";
import { AlertTriangle, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // React forwards non-Error throws (e.g. strings from libraries) as-is,
  // so `error.message` can be empty — fall back to the raw value.
  const raw = error as unknown;
  const detail =
    typeof raw === "string"
      ? raw
      : raw instanceof Error
        ? raw.message
        : raw
          ? JSON.stringify(raw)
          : "";
  const digest = (raw as { digest?: string })?.digest;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg p-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-danger/10">
        <AlertTriangle className="size-7 text-danger" />
      </span>
      <div className="space-y-1.5">
        <h1 className="text-lg font-semibold text-fg">This page couldn&apos;t load</h1>
        <p className="mx-auto max-w-md text-sm text-fg-secondary">
          Something went wrong while loading this screen. Your check-in data is
          safe — try again.
        </p>
        {detail ? (
          <p className="mx-auto max-w-lg break-words rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs text-fg-muted">
            {detail}
          </p>
        ) : null}
        <p className="text-xs text-fg-muted">Error code: {digest ?? "UNKNOWN"}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={() => unstable_retry()}>
          <AlertTriangle className="size-4" />
          Try again
        </Button>
        <Button variant="secondary" onClick={() => (window.location.href = "/attendance")}>
          <ScanLine className="size-4" />
          Back to Attendance
        </Button>
      </div>
    </div>
  );
}
