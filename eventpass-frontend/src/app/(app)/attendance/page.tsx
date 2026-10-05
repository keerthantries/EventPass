"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { EventPicker } from "@/components/events/event-picker";
import { AttendanceConsole } from "@/components/attendance/attendance-console";
import { useEvents } from "@/hooks/queries";
import { useAuth } from "@/lib/auth";
import { ScanLine } from "lucide-react";

export default function GlobalAttendancePage() {
  const [eventId, setEventId] = useState("");
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { data: events } = useEvents({ limit: "100" });

  // Team members always work a single event: skip the picker and take them
  // straight to that event's check-in console.
  const isSecurity = user?.role === "security";
  const autoEventId =
    isSecurity && events && events.items.length === 1 ? events.items[0].id : null;

  useEffect(() => {
    if (autoEventId) router.replace(`/events/${autoEventId}/attendance`);
  }, [autoEventId, router]);

  return (
    <div>
      <PageHeader
        title="Attendance"
        description={
          autoEventId
            ? "Opening the check-in console..."
            : "Select an event to start checking guests in."
        }
      />
      {autoEventId ? (
        <Card>
          <EmptyState
            icon={ScanLine}
            title="Opening console"
            description="Taking you to your event's check-in console."
          />
        </Card>
      ) : (
        <>
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
              <EmptyState
                icon={ScanLine}
                title="No event selected"
                description="Choose an event to open the check-in console."
              />
            </Card>
          ) : eventId ? (
            <AttendanceConsole key={eventId} eventId={eventId} />
          ) : null}
        </>
      )}
    </div>
  );
}
