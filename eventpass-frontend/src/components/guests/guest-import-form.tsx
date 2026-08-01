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
      toast({
        title: "Import complete",
        description: `${result.imported} imported · ${result.skippedDuplicates} duplicates skipped · ${result.failed} failed`,
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
        accept=".csv"
        label="Choose CSV file"
        hint="CSV columns: fullName, email, phone, category, notes (fullName required)"
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
