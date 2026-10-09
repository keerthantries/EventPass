"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useUpdateEvent } from "@/hooks/queries";
import { formatClock } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

type TimeField = "startTime" | "guestArrivalTime";

const FIELD_CONFIG: Record<
  TimeField,
  {
    placeholder: string;
    changeTitle: string;
    addTitle: string;
    removeTitle: string;
    savedToast: string;
    removedToast: string;
    errorToast: string;
  }
> = {
  startTime: {
    placeholder: "+ EVENT TIME",
    changeTitle: "Change event time",
    addTitle: "Set event time",
    removeTitle: "Remove event time from card",
    savedToast: "Event time updated",
    removedToast: "Event time removed from card",
    errorToast: "Could not update the event time",
  },
  guestArrivalTime: {
    placeholder: "+ GUEST ARRIVAL",
    changeTitle: "Change guest arrival time",
    addTitle: "Set guest arrival time",
    removeTitle: "Remove guest arrival time from card",
    savedToast: "Guest arrival time updated",
    removedToast: "Guest arrival time removed from card",
    errorToast: "Could not update the guest arrival time",
  },
};

function normalizeTime(raw: string | undefined): string {
  const m = raw?.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return "";
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

function toArrivalFormat(hhmm: string): string {
  return formatClock(hhmm).replace(/\s+/g, "");
}

interface EventTimeEditorProps {
  eventId?: string;
  value?: string;
  variant?: "gold" | "dark";
  field?: TimeField;
  prefix?: string;
}

export function EventTimeEditor({
  eventId,
  value,
  variant = "dark",
  field = "startTime",
  prefix = "",
}: EventTimeEditorProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const update = useUpdateEvent(eventId ?? "");
  const config = FIELD_CONFIG[field];

  const canEdit = Boolean(eventId);
  const displayValue = field === "startTime" ? formatClock(value) : value ?? "";
  const text = displayValue ? `${prefix}${displayValue}` : "";

  const openEditor = () => {
    setDraft(normalizeTime(value));
    setEditing(true);
  };

  const save = async () => {
    const hhmm = normalizeTime(draft);
    if (!hhmm) {
      toast({ title: "Pick a time before saving", variant: "error" });
      return;
    }
    const payload: Record<string, string> =
      field === "startTime" ? { startTime: hhmm } : { guestArrivalTime: toArrivalFormat(hhmm) };
    try {
      await update.mutateAsync(payload);
      setEditing(false);
      toast({ title: config.savedToast, variant: "success" });
    } catch {
      toast({ title: config.errorToast, variant: "error" });
    }
  };

  const remove = async () => {
    try {
      await update.mutateAsync({ [field]: "" });
      setEditing(false);
      toast({ title: config.removedToast, variant: "success" });
    } catch {
      toast({ title: config.errorToast, variant: "error" });
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditing(false);
    }
  };

  if (editing) {
    if (variant === "gold") {
      return (
        <div data-field={field} className="flex items-center justify-center gap-1.5">
          <input
            type="time"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus
            aria-label={config.changeTitle}
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
            onClick={() => setEditing(false)}
            title="Cancel"
            className="flex size-5 items-center justify-center rounded border border-[#c59b27] text-[#b58d3d] transition hover:bg-[#c59b27]/15"
          >
            <X className="size-3" />
          </button>
          <button
            type="button"
            onClick={() => void remove()}
            disabled={update.isPending}
            title={config.removeTitle}
            className="flex size-5 items-center justify-center rounded border border-[#c59b27] text-[#b58d3d] transition hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      );
    }
    return (
      <div data-field={field} className="flex items-center justify-center gap-1.5">
        <input
          type="time"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          aria-label={config.changeTitle}
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
          onClick={() => setEditing(false)}
          title="Cancel"
          className="flex size-7 items-center justify-center rounded-md border border-white/25 text-white/70 transition hover:bg-white/10"
        >
          <X className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => void remove()}
          disabled={update.isPending}
          title={config.removeTitle}
          className="flex size-7 items-center justify-center rounded-md border border-white/25 text-white/70 transition hover:border-red-400/50 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    );
  }

  if (!text) {
    if (!canEdit) return null;
    if (variant === "gold") {
      return (
        <div data-field={field} className="flex items-center justify-center">
          <button
            type="button"
            onClick={openEditor}
            title={config.addTitle}
            className="modal-guest-arrival rounded px-1.5 py-1 opacity-50 transition hover:opacity-100"
          >
            {config.placeholder}
          </button>
        </div>
      );
    }
    return (
      <div data-field={field} className="flex items-center justify-center">
        <button
          type="button"
          onClick={openEditor}
          title={config.addTitle}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs italic text-white/40 transition hover:bg-white/10 hover:text-white/70"
        >
          <Plus className="size-3" />
          {config.placeholder.replace("+ ", "")}
        </button>
      </div>
    );
  }

  if (variant === "gold") {
    return (
      <div data-field={field} className="flex items-center justify-center gap-1.5">
        <span className="modal-guest-arrival">{text}</span>
        {canEdit && (
          <button
            type="button"
            onClick={openEditor}
            title={config.changeTitle}
            className="flex size-3.5 items-center justify-center rounded-full text-[#b58d3d] transition hover:bg-[#c59b27]/20"
          >
            <Pencil className="size-2" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div data-field={field} className="flex items-center justify-center gap-1.5">
      <span className="text-xs text-white/60">{text}</span>
      {canEdit && (
        <button
          type="button"
          onClick={openEditor}
          title={config.changeTitle}
          className="flex size-4 items-center justify-center rounded text-white/40 transition hover:bg-white/10 hover:text-white/80"
        >
          <Pencil className="size-2.5" />
        </button>
      )}
    </div>
  );
}
