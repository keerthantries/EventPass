"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { RequireRole } from "@/components/ui/require-role";
import { ReportConsole } from "@/components/reports/report-console";

export default function EventReportsPage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireRole roles={["organizer", "super_admin"]}>
      <div>
        <PageHeader title="Reports" description="Attendance and RSVP breakdowns with CSV / XLSX export." />
        <ReportConsole eventId={params.id} />
      </div>
    </RequireRole>
  );
}