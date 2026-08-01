"use client";

import { useState } from "react";
import { FileSpreadsheet, Download } from "lucide-react";
import { useAttendanceReport, useRsvpReport, useCategories } from "@/hooks/queries";
import { downloadFile } from "@/lib/api";
import { PageSkeleton, PageError } from "@/components/ui/page-state";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn } from "@/components/ui/datatable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { rsvpBadge, attendanceBadge } from "@/components/guests/guest-badges";
import { formatDateTime } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export function ReportConsole({ eventId }: { eventId: string }) {
  return (
    <Tabs defaultValue="attendance">
      <TabsList>
        <TabsTrigger value="attendance">Attendance</TabsTrigger>
        <TabsTrigger value="rsvp">RSVP</TabsTrigger>
      </TabsList>
      <TabsContent value="attendance">
        <AttendanceReportTab eventId={eventId} />
      </TabsContent>
      <TabsContent value="rsvp">
        <RsvpReportTab eventId={eventId} />
      </TabsContent>
    </Tabs>
  );
}

function AttendanceReportTab({ eventId }: { eventId: string }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const { data: categories } = useCategories(eventId);
  const { toast } = useToast();

  const paramsObj: Record<string, string> = { page: String(page), limit: "20" };
  if (status !== "all") paramsObj.attendanceStatus = status;
  if (category !== "all") paramsObj.category = category;

  const { data, isLoading, isError, error, refetch } = useAttendanceReport(eventId, paramsObj);

  const columns: DataTableColumn<import("@/lib/types").AttendanceReportRow>[] = [
    { key: "guestName", header: "Guest", primary: true, cell: (r) => <span className="font-medium text-fg">{r.guestName}</span> },
    { key: "category", header: "Category", cell: (r) => <span className="text-fg-secondary">{r.category ?? "—"}</span> },
    { key: "rsvpStatus", header: "RSVP", cell: (r) => <Badge variant={rsvpBadge(r.rsvpStatus).variant}>{rsvpBadge(r.rsvpStatus).label}</Badge> },
    { key: "attendanceStatus", header: "Attendance", cell: (r) => <Badge variant={attendanceBadge(r.attendanceStatus).variant}>{attendanceBadge(r.attendanceStatus).label}</Badge> },
    { key: "checkInTime", header: "Checked in", cell: (r) => <span className="text-fg-secondary">{r.checkInTime ? formatDateTime(r.checkInTime) : "—"}</span> },
  ];

  const exportReport = (format: "csv" | "xlsx") => {
    downloadFile(`/events/${eventId}/reports/attendance/export?format=${format}`, `attendance-${eventId}.${format}`).catch((e) =>
      toast({ title: "Export failed", description: (e as Error).message, variant: "error" })
    );
  };

  if (isLoading) return <PageSkeleton />;
  if (isError) return <PageError message={(error as Error)?.message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm">
              <FileSpreadsheet className="size-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Attendance report</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => exportReport("csv")}>CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportReport("xlsx")}>XLSX</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => exportReport("csv")}>
              <Download className="size-4" />
              Download
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {data?.items.length === 0 ? (
        <Card>
          <EmptyState title="No guests" description="Add guests to this event to view the attendance report." />
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          getRowId={(r) => `${r.guestName}-${r.checkInTime ?? r.rsvpStatus}`}
          meta={data?.meta}
          onPageChange={setPage}
          toolbar={
            <>
              <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Attendance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories?.map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
          titleAccessor={(r) => r.guestName}
          subtitleAccessor={(r) => r.category ?? "Uncategorised"}
        />
      )}
    </div>
  );
}

function RsvpReportTab({ eventId }: { eventId: string }) {
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  const { data, isLoading, isError, error, refetch } = useRsvpReport(eventId, { page: String(page), limit: "20" });

  const columns: DataTableColumn<import("@/lib/types").RsvpReportRow>[] = [
    { key: "guestName", header: "Guest", primary: true, cell: (r) => <span className="font-medium text-fg">{r.guestName}</span> },
    { key: "category", header: "Category", cell: (r) => <span className="text-fg-secondary">{r.category ?? "—"}</span> },
    { key: "rsvpStatus", header: "RSVP", cell: (r) => <Badge variant={rsvpBadge(r.rsvpStatus).variant}>{rsvpBadge(r.rsvpStatus).label}</Badge> },
    { key: "rsvpRespondedAt", header: "Responded", cell: (r) => <span className="text-fg-secondary">{r.rsvpRespondedAt ? formatDateTime(r.rsvpRespondedAt) : "—"}</span> },
  ];

  const exportReport = (format: "csv" | "xlsx") => {
    downloadFile(`/events/${eventId}/reports/rsvp/export?format=${format}`, `rsvp-${eventId}.${format}`).catch((e) =>
      toast({ title: "Export failed", description: (e as Error).message, variant: "error" })
    );
  };

  if (isLoading) return <PageSkeleton />;
  if (isError) return <PageError message={(error as Error)?.message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm">
              <FileSpreadsheet className="size-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>RSVP report</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => exportReport("csv")}>CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportReport("xlsx")}>XLSX</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {data?.items.length === 0 ? (
        <Card>
          <EmptyState title="No guests" description="Add guests to this event to view the RSVP report." />
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          getRowId={(r) => `${r.guestName}-${r.rsvpRespondedAt ?? ""}`}
          meta={data?.meta}
          onPageChange={setPage}
          titleAccessor={(r) => r.guestName}
          subtitleAccessor={(r) => r.category ?? "Uncategorised"}
        />
      )}
    </div>
  );
}
