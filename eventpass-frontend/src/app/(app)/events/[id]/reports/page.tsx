"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ReportConsole } from "@/components/reports/report-console";

export default function EventReportsPage() {
  const params = useParams<{ id: string }>();

  return (
    <div>
      <PageHeader title="Reports" description="Attendance and RSVP breakdowns with CSV / XLSX export." />
      <ReportConsole eventId={params.id} />
    </div>
  );
}
