"use client";

import { useState, type ReactNode } from "react";
import { useImportGuests } from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/components/ui/toast";
import { AlertTriangle, CheckCircle2, Pencil, RotateCcw, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImportResult } from "@/lib/types";

function StatTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-2 py-2.5 text-center">
      <p className={cn("text-lg font-semibold tabular-nums sm:text-xl", value === 0 ? "text-fg-muted" : tone)}>
        {value}
      </p>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-fg-muted sm:text-[11px]">{label}</p>
    </div>
  );
}

function RowList<T extends { row: number }>({ items, render }: { items: T[]; render: (item: T) => ReactNode }) {
  return (
    <ul className="max-h-44 divide-y divide-border overflow-y-auto overscroll-contain rounded-lg border border-border">
      {items.map((item) => (
        <li key={item.row} className="px-3 py-2 text-xs leading-relaxed">
          {render(item)}
        </li>
      ))}
    </ul>
  );
}

function ImportResults({
  result,
  onImportMore,
  onDone,
}: {
  result: ImportResult;
  onImportMore: () => void;
  onDone?: () => void;
}) {
  const failed = result.errors ?? [];
  const skipped = result.skipped ?? [];
  const updatedRows = result.updatedRows ?? [];
  const clean = failed.length === 0 && skipped.length === 0 && updatedRows.length === 0;
  const processed = result.imported + (result.updated ?? 0) + result.skippedDuplicates + result.failed;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="size-5 shrink-0 text-success" />
        <h3 className="text-base font-semibold text-fg">Import complete</h3>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Imported" value={result.imported} tone="text-success" />
        <StatTile label="Tables updated" value={result.updated ?? 0} tone="text-primary" />
        <StatTile label="Unchanged" value={result.skippedDuplicates} tone="text-fg-secondary" />
        <StatTile label="Failed" value={result.failed} tone="text-danger" />
      </div>

      <p className="text-xs text-fg-muted">
        {processed} of {result.totalRows} rows processed.
      </p>

      {clean ? (
        <p className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-fg-muted">
          Every row imported cleanly — nothing was skipped or failed.
        </p>
      ) : null}

      {failed.length > 0 ? (
        <section className="space-y-1.5">
          <h4 className="flex items-center gap-1.5 text-sm font-medium text-danger">
            <AlertTriangle className="size-3.5" />
            Not imported ({failed.length})
          </h4>
          <RowList
            items={failed}
            render={(e) => (
              <>
                <span className="font-medium text-fg">Row {e.row}</span>
                <span className="text-fg-muted"> — {e.reason}</span>
              </>
            )}
          />
        </section>
      ) : null}

      {skipped.length > 0 ? (
        <section className="space-y-1.5">
          <h4 className="flex items-center gap-1.5 text-sm font-medium text-fg-secondary">
            <UserCheck className="size-3.5" />
            Already on the guest list ({skipped.length})
          </h4>
          <RowList
            items={skipped}
            render={(s) => (
              <>
                <span className="font-medium text-fg">
                  Row {s.row} · {s.fullName}
                </span>
                <span className="text-fg-muted"> — {s.reason}</span>
              </>
            )}
          />
        </section>
      ) : null}

      {updatedRows.length > 0 ? (
        <section className="space-y-1.5">
          <h4 className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <Pencil className="size-3.5" />
            Tables updated ({updatedRows.length})
          </h4>
          <RowList
            items={updatedRows}
            render={(u) => (
              <>
                <span className="font-medium text-fg">
                  Row {u.row} · {u.fullName}
                </span>
                <span className="text-fg-muted"> — table set to {u.table}</span>
              </>
            )}
          />
        </section>
      ) : null}

      <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onImportMore}>
          <RotateCcw className="size-4" />
          Import another file
        </Button>
        <Button type="button" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
}

export function GuestImportForm({ eventId, onDone }: { eventId: string; onDone?: () => void }) {
  const { toast } = useToast();
  const importMutation = useImportGuests(eventId);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [uploadKey, setUploadKey] = useState(0);

  const handleImport = async () => {
    if (!file) return;
    try {
      const data = await importMutation.mutateAsync(file);
      setResult(data);
    } catch (err) {
      toast({ title: "Import failed", description: (err as Error).message, variant: "error" });
    }
  };

  if (result) {
    return (
      <ImportResults
        result={result}
        onImportMore={() => {
          setResult(null);
          setFile(null);
          importMutation.reset();
          setUploadKey((k) => k + 1);
        }}
        onDone={onDone}
      />
    );
  }

  return (
    <div className="space-y-4">
      <FileUpload
        key={uploadKey}
        accept=".csv,.xlsx,.xls"
        label="Choose CSV or Excel file"
        hint="Excel (.xlsx) or CSV (comma or tab separated). Columns: fullName, first/last name, email, phone, category, party/family name, side, table, vip, immediate family, notes. Name is required — shared emails are fine, duplicate names are skipped."
        onFile={setFile}
      />
      {importMutation.isError && !importMutation.data ? (
        <p className="flex items-center gap-1.5 text-xs text-danger">
          <AlertTriangle className="size-3.5" />
          {(importMutation.error as Error).message}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onDone}>
          Close
        </Button>
        <Button type="button" onClick={handleImport} loading={importMutation.isPending} disabled={!file}>
          Import guests
        </Button>
      </div>
    </div>
  );
}
