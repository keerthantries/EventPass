"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { EventPicker } from "@/components/events/event-picker";
import { AttendanceConsole } from "@/components/attendance/attendance-console";
import { ScanLine } from "lucide-react";

export default function GlobalAttendancePage() {
  const [eventId, setEventId] = useState("");
  const [ready, setReady] = useState(false);

  return (
    <div>
      <PageHeader title="Attendance" description="Select an event to start checking guests in." />
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
          <EmptyState icon={ScanLine} title="No event selected" description="Choose an event to open the check-in console." />
        </Card>
      ) : eventId ? (
        <AttendanceConsole key={eventId} eventId={eventId} />
      ) : null}
    </div>
  );
}
