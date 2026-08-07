"use client";

import { PageHeader } from "@/components/ui/page-header";
import { EventWizard } from "@/components/events/event-wizard";
import { RequireRole } from "@/components/ui/require-role";

export default function NewEventPage() {
  return (
    <RequireRole roles={["organizer", "super_admin"]}>
      <div>
        <PageHeader
          title="Create an event"
          description="A few steps to set up your event — workflow, modules and visibility."
        />
        <EventWizard />
      </div>
    </RequireRole>
  );
}
