"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { useUpdateEvent } from "@/hooks/queries";
import { cn, formatClock } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface EventTimeEditorProps {
  eventId?: string;
  value?: string;
  variant?: "gold" | "dark";
}

function normalizeTime(raw: string | undefined): string {
  const m = raw?.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return "";
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

export function EventTimeEditor({ eventId, value, variant = "dark" }: EventTimeEditorProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const update = useUpdateEvent(eventId ?? "");

  const canEdit = Boolean(eventId);
  const display = formatClock(value);

  const openEditor = () => {
    setDraft(normalizeTime(value));
    setEditing(true);
  };

  const cancel = () => setEditing(false);

  const save = async () => {
    const startTime = normalizeTime(draft);
    if (!startTime) {
      toast({ title: "Pick a time before saving", variant: "error" });
      return;
    }
    try {
      await update.mutateAsync({ startTime });
      setEditing(false);
      toast({ title: "Event time updated", variant: "success" });
    } catch {
      toast({ title: "Could not update the event time", variant: "error" });
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  if (editing) {
    if (variant === "gold") {
      return (
        <div className="flex items-center justify-center gap-1.5">
          <input
            type="time"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus
            aria-label="Event time"
            className="h-6 w-24 rounded border border-[#c59b27] bg-white px-1.5 text-[11px] font-semibold text-[#3a2f10] outline-none [-webkit-text-fill-color:#3a2f10] [color-scheme:light]"
          />
          <button
            type="button"
            onClick={() => void save()}
            disabled={update.isPending}
            title="Save time"
            className="flex size-5 items-center justify-center rounded border border-[#c59b27] text-[#b58d3d] transition hover:bg-[#c59b27]/15 disabled:opacity-50"
          >
            <Check className="size-3" />
          </button>
          <button
            type="button"
            onClick={cancel}
            title="Cancel"
            className="flex size-5 items-center justify-center rounded border border-[#c59b27] text-[#b58d3d] transition hover:bg-[#c59b27]/15"
          >
            <X className="size-3" />
          </button>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center gap-1.5">
        <input
          type="time"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          aria-label="Event time"
          className="h-7 w-28 rounded-md border border-white/25 bg-black/40 px-2 text-xs font-medium text-white outline-none focus:border-white/50"
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={update.isPending}
          title="Save time"
          className="flex size-7 items-center justify-center rounded-md border border-white/25 text-white/70 transition hover:bg-white/10 disabled:opacity-50"
        >
          <Check className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={cancel}
          title="Cancel"
          className="flex size-7 items-center justify-center rounded-md border border-white/25 text-white/70 transition hover:bg-white/10"
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  if (variant === "gold") {
    return (
      <div className="flex items-center justify-center gap-1.5">
        <span className={cn("modal-guest-arrival", !display && "opacity-60")}>
          {display || "TIME TBA"}
        </span>
        {canEdit && (
          <button
            type="button"
            onClick={openEditor}
            title="Change event time"
            className="flex size-3.5 items-center justify-center rounded-full text-[#b58d3d] transition hover:bg-[#c59b27]/20"
          >
            <Pencil className="size-2" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1.5">
      <span className={cn("text-xs text-white/60", !display && "italic text-white/40")}>
        {display || "Time TBA"}
      </span>
      {canEdit && (
        <button
          type="button"
          onClick={openEditor}
          title="Change event time"
          className="flex size-4 items-center justify-center rounded text-white/40 transition hover:bg-white/10 hover:text-white/80"
        >
          <Pencil className="size-2.5" />
        </button>
      )}
    </div>
  );
}
