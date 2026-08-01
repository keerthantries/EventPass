"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { AttendanceConsole } from "@/components/attendance/attendance-console";

export default function EventAttendancePage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const isSecurity = user?.role === "security";

  return (
    <div>
      <PageHeader
        title="Attendance"
        description={isSecurity ? "Scan guest QR codes to record attendance." : "Scan QR codes or check guests in manually."}
      />
      <AttendanceConsole eventId={params.id} />
    </div>
  );
}
