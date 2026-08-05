"use client";

import { PageHeader } from "@/components/ui/page-header";
import { EventWizard } from "@/components/events/event-wizard";

export default function NewEventPage() {
  return (
    <div>
      <PageHeader
        title="Create an event"
        description="A few steps to set up your event — workflow, modules and visibility."
      />
      <EventWizard />
    </div>
  );
}
