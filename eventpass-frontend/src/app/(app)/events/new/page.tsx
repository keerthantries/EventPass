"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EventForm } from "@/components/events/event-form";

export default function NewEventPage() {
  return (
    <div>
      <PageHeader title="New event" description="Set up the basics — you can configure modules and branding afterwards." />
      <Card className="mx-auto max-w-2xl">
        <CardContent className="p-6">
          <EventForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
