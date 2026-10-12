"use client";

import { useState } from "react";
import { useImportGuests } from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/components/ui/toast";
import { AlertTriangle } from "lucide-react";

export function GuestImportForm({ eventId, onDone }: { eventId: string; onDone?: () => void }) {
  const { toast } = useToast();
  const importMutation = useImportGuests(eventId);
  const [file, setFile] = useState<File | null>(null);

  const handleImport = async () => {
    if (!file) return;
    try {
      const result = await importMutation.mutateAsync(file);
      const parts = [`${result.imported} imported`];
      if (result.updated) parts.push(`${result.updated} tables updated`);
      parts.push(`${result.skippedDuplicates} unchanged`, `${result.failed} failed`);
      const firstError = result.failed > 0 ? result.errors?.[0] : undefined;
      if (firstError) parts.push(`row ${firstError.row}: ${firstError.reason}`);
      toast({
        title: "Import complete",
        description: parts.join(" · "),
        variant: result.failed > 0 ? "warning" : "success",
      });
      onDone?.();
    } catch (err) {
      toast({ title: "Import failed", description: (err as Error).message, variant: "error" });
    }
  };

  return (
    <div className="space-y-4">
      <FileUpload
        accept=".csv,.xlsx,.xls"
        label="Choose CSV or Excel file"
        hint="Excel (.xlsx) or CSV (comma or tab separated). Columns: fullName, first/last name, email, phone, category, party/family name, side, table, vip, immediate family, notes. Name is required — email duplicates are skipped automatically."
        onFile={setFile}
      />
      {importMutation.isError && !importMutation.data ? (
        <p className="flex items-center gap-1.5 text-xs text-danger">
          <AlertTriangle className="size-3.5" />
          {(importMutation.error as Error).message}
        </p>
      ) : null}
      <div className="flex items-center justify-end gap-2">
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
