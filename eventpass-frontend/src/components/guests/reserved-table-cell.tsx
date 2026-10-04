"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useUpdateGuest } from "@/hooks/queries";
import { ApiClientError } from "@/lib/api";
import type { Guest } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface ReservedTableCellProps {
  eventId: string;
  guest: Guest;
  canManage?: boolean;
}

export function ReservedTableCell({ eventId, guest, canManage = false }: ReservedTableCellProps) {
  const { toast } = useToast();
  const updateMutation = useUpdateGuest(eventId);
  const [value, setValue] = useState(guest.reservedTable ?? "");
  const [saved, setSaved] = useState(false);

  const save = async () => {
    const next = value.trim();
    const current = (guest.reservedTable ?? "").trim();
    if (next === current) return;
    try {
      await updateMutation.mutateAsync({ id: guest._id, payload: { reservedTable: next } });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      setValue(current);
      toast({
        title: "Could not save table",
        description: err instanceof ApiClientError ? err.message : "Please try again.",
        variant: "error",
      });
    }
  };

  if (!canManage) {
    return <span className="text-fg-secondary">{value || <span className="text-fg-muted">N/A</span>}</span>;
  }

  return (
    <div className="relative flex w-28 max-w-full items-center">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder="—"
        aria-label={`Reserved table for ${guest.fullName}`}
        maxLength={50}
        className="h-8 w-full pr-7 text-xs"
      />
      <span className="pointer-events-none absolute right-2 flex items-center">
        {updateMutation.isPending ? (
          <Loader2 className="size-3.5 animate-spin text-fg-muted" />
        ) : saved ? (
          <Check className="size-3.5 text-success" />
        ) : null}
      </span>
    </div>
  );
}
