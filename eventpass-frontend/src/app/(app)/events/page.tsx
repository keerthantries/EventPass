"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Archive } from "lucide-react";
import { useEvents, useArchiveEvent } from "@/hooks/queries";
import { useDebounce } from "@/hooks/use-debounce";
import type { EventListItem, EventDetail } from "@/lib/types";
import { DataTable, type DataTableColumn } from "@/components/ui/datatable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton, PageError } from "@/components/ui/page-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody } from "@/components/ui/modal";
import { EventForm } from "@/components/events/event-form";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const statusVariant: Record<string, "neutral" | "success" | "warning" | "danger" | "primary" | "secondary"> = {
  draft: "neutral",
  published: "success",
  completed: "primary",
  archived: "secondary",
};

export default function EventsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const canManage = user?.role === "organizer" || user?.role === "super_admin";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [sort, setSort] = useState("-createdAt");
  const [editing, setEditing] = useState<EventDetail | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const params: Record<string, string> = { page: String(page), limit: "10" };
  if (status !== "all") params.status = status;
  if (debouncedSearch) params.q = debouncedSearch;
  if (sort) params.sort = sort;

  const { data, isLoading, isError, error, refetch } = useEvents(params);
  const archiveMutation = useArchiveEvent();

  const columns: DataTableColumn<EventListItem>[] = [
    {
      key: "name",
      header: "Event",
      primary: true,
      sortable: true,
      sortKey: "name",
      cell: (e) => (
        <div className="min-w-0">
          <p className="font-medium text-fg">{e.name}</p>
          <p className="text-xs text-fg-muted">{e.type}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (e) => <Badge variant={statusVariant[e.status] ?? "neutral"}>{e.status}</Badge>,
    },
    {
      key: "startDate",
      header: "Start date",
      sortable: true,
      sortKey: "startDate",
      cell: (e) => <span className="text-fg-secondary">{formatDate(e.startDate)}</span>,
    },
    {
      key: "guestCount",
      header: "Guests",
      cell: (e) => <span className="text-fg-secondary">{e.guestCount}</span>,
    },
  ];

  const handleArchive = async (event: EventListItem) => {
    if (!window.confirm(`Archive "${event.name}"? This event can no longer receive responses or check-ins.`)) return;
    try {
      await archiveMutation.mutateAsync(event.id);
      toast({ title: "Event archived", variant: "success" });
      refetch();
    } catch (err) {
      toast({ title: "Could not archive event", description: (err as Error).message, variant: "error" });
    }
  };

  if (isLoading) return <PageSkeleton />;
  if (isError) return <PageError message={(error as Error)?.message} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader
        title="Events"
        description="Create and manage your events."
        actions={
          canManage ? (
            <Button asChild>
              <Link href="/events/new">
                <Plus className="size-4" />
                New event
              </Link>
            </Button>
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        getRowId={(e) => e.id}
        meta={data?.meta}
        onPageChange={setPage}
        onRowClick={(e) => router.push(`/events/${e.id}`)}
        sort={sort}
        onSortChange={setSort}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search events..."
        toolbar={
          <Select value={status} onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        }
        titleAccessor={(e) => e.name}
        subtitleAccessor={(e) => `${e.type} · ${formatDate(e.startDate)}`}
        rowActions={canManage ? (e) => [
          { label: (<span className="inline-flex items-center gap-2"><Pencil className="size-3.5" />Edit</span>), onClick: () => setEditing(e as EventDetail) },
          ...(e.status !== "archived" ? [{ label: (<span className="inline-flex items-center gap-2"><Archive className="size-3.5" />Archive</span>), onClick: () => handleArchive(e), destructive: true }] : []),
        ] : undefined}
      />

      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Edit event</ModalTitle>
            <ModalDescription>Update the details of this event.</ModalDescription>
          </ModalHeader>
          <ModalBody>
            {editing ? (
              <div className="max-h-[60vh] overflow-y-auto pr-1">
                <EventForm mode="edit" event={editing} onCancel={() => setEditing(null)} />
              </div>
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
