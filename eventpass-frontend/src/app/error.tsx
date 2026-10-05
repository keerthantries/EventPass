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
        <p className="text-xs text-fg-muted">Error code: {error.digest ?? "UNKNOWN"}</p>
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
