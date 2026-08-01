"use client";

import { useEvents } from "@/hooks/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EventPickerProps {
  value: string;
  onChange: (id: string) => void;
  label?: string;
}

export function EventPicker({ value, onChange, label = "Select event" }: EventPickerProps) {
  const { data, isLoading } = useEvents({ limit: "100" });
  const events = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="h-9 w-full max-w-xs animate-pulse rounded-md border border-border bg-surface" />
    );
  }

  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="max-w-xs">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {events.length === 0 ? (
          <div className="px-3 py-2 text-sm text-fg-muted">No events yet</div>
        ) : (
          events.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
