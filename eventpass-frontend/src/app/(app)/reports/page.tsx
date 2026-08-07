"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { RequireRole } from "@/components/ui/require-role";
import { PageSkeleton } from "@/components/ui/page-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { EventPicker } from "@/components/events/event-picker";
import { ReportConsole } from "@/components/reports/report-console";
import { CalendarDays } from "lucide-react";

export default function GlobalReportsPage() {
  const [eventId, setEventId] = useState("");
  const [ready, setReady] = useState(false);

  return (
    <RequireRole roles={["organizer", "super_admin"]}>
      <div>
        <PageHeader title="Reports" description="Select an event to view attendance and RSVP reports." />
        <div className="mb-6">
          <EventPicker
            value={eventId}
            onChange={(id) => {
              setEventId(id);
              setReady(true);
            }}
            label="Choose an event"
          />
        </div>
        {!ready ? (
          <Card>
            <EmptyState icon={CalendarDays} title="No event selected" description="Choose an event to see its reports." />
          </Card>
        ) : eventId ? (
          <ReportConsole key={eventId} eventId={eventId} />
        ) : (
          <PageSkeleton rows={3} />
        )}
      </div>
    </RequireRole>
  );
}
