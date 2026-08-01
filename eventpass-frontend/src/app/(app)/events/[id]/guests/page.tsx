"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  QrCode,
  Link2,
  Download,
  Upload,
  UserCheck,
  X,
} from "lucide-react";
import {
  useGuests,
  useCategories,
  useDeleteGuest,
  useBulkGuestAction,
  useGenerateGuestQr,
  useApproveGuest,
  useEvent,
} from "@/hooks/queries";
import { useDebounce } from "@/hooks/use-debounce";
import { downloadFile, ApiClientError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Guest } from "@/lib/types";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody } from "@/components/ui/modal";
import { GuestForm } from "@/components/guests/guest-form";
import { GuestImportForm } from "@/components/guests/guest-import-form";
import { rsvpBadge, attendanceBadge, approvalBadge, CategoryDot } from "@/components/guests/guest-badges";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/utils";

export default function GuestsPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const canManage = user?.role === "organizer" || user?.role === "super_admin";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [rsvp, setRsvp] = useState("all");
  const [attendance, setAttendance] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("-createdAt");
  const [selected, setSelected] = useState<string[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignCategory, setReassignCategory] = useState("");

  const debouncedSearch = useDebounce(search, 300);

  const paramsObj: Record<string, string> = { page: String(page), limit: "10" };
  if (rsvp !== "all") paramsObj.rsvpStatus = rsvp;
  if (attendance !== "all") paramsObj.attendanceStatus = attendance;
  if (category !== "all") paramsObj.category = category;
  if (debouncedSearch) paramsObj.q = debouncedSearch;
  if (sort) paramsObj.sort = sort;

  const { data, isLoading, isError, error, refetch } = useGuests(eventId, paramsObj);
  const { data: categories } = useCategories(eventId);
  const { data: event } = useEvent(eventId);

  const deleteMutation = useDeleteGuest(eventId);
  const bulkMutation = useBulkGuestAction(eventId);
  const qrMutation = useGenerateGuestQr(eventId);
  const approveMutation = useApproveGuest(eventId);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories?.forEach((c) => map.set(c._id, c.name));
    return map;
  }, [categories]);

  const columns = useMemo<DataTableColumn<Guest>[]>(() => {
    const cols: DataTableColumn<Guest>[] = [
      {
        key: "fullName",
        header: "Guest",
        primary: true,
        sortable: true,
        sortKey: "fullName",
        cell: (g) => (
          <div className="min-w-0">
            <p className="font-medium text-fg">{g.fullName}</p>
            {canManage && g.email ? <p className="text-xs text-fg-muted">{g.email}</p> : null}
          </div>
        ),
      },
      {
        key: "categoryId",
        header: "Category",
        cell: (g) =>
          g.categoryId ? <CategoryDot color={categories?.find((c) => c._id === g.categoryId)?.colorTag} name={categoryMap.get(g.categoryId) ?? "—"} /> : <span className="text-fg-muted">—</span>,
      },
      { key: "rsvpStatus", header: "RSVP", cell: (g) => <Badge variant={rsvpBadge(g.rsvpStatus).variant}>{rsvpBadge(g.rsvpStatus).label}</Badge> },
      {
        key: "attendanceStatus",
        header: "Attendance",
        cell: (g) => <Badge variant={attendanceBadge(g.attendanceStatus).variant}>{attendanceBadge(g.attendanceStatus).label}</Badge>,
      },
      ...(event?.config?.requiresApproval
        ? [{ key: "approvalStatus", header: "Approval", cell: (g: Guest) => <Badge variant={approvalBadge(g.approvalStatus).variant}>{approvalBadge(g.approvalStatus).label}</Badge> }]
        : []),
      {
        key: "checkInTime",
        header: "Checked in",
        cell: (g) => <span className="text-fg-secondary">{g.checkInTime ? formatDateTime(g.checkInTime) : "—"}</span>,
      },
    ];
    return cols;
  }, [canManage, categories, categoryMap, event?.config?.requiresApproval]);

  const handleDelete = async (guest: Guest) => {
    if (!window.confirm(`Delete ${guest.fullName}? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(guest._id);
      toast({ title: "Guest deleted", variant: "success" });
    } catch (err) {
      toast({ title: "Could not delete guest", description: (err as Error).message, variant: "error" });
    }
  };

  const handleGenerateQr = async (guest: Guest) => {
    try {
      await qrMutation.mutateAsync(guest._id);
      toast({ title: "QR code generated", variant: "success" });
    } catch (err) {
      toast({ title: "Could not generate QR", description: (err as Error).message, variant: "error" });
    }
  };

  const handleApprove = async (guest: Guest, decision: "approved" | "rejected") => {
    try {
      await approveMutation.mutateAsync({ id: guest._id, decision });
      toast({ title: decision === "approved" ? "Guest approved" : "Guest rejected", variant: "success" });
    } catch (err) {
      toast({ title: "Approval failed", description: (err as Error).message, variant: "error" });
    }
  };

  const handleCopyInvite = async (guest: Guest) => {
    if (!guest.invitationToken) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/invite/${guest.invitationToken}`);
      toast({ title: "Invitation link copied", variant: "success" });
    } catch {
      toast({ title: "Could not copy link", variant: "error" });
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.length} guests?`)) return;
    try {
      await bulkMutation.mutateAsync({ guestIds: selected, action: "delete" });
      toast({ title: "Guests deleted", variant: "success" });
      setSelected([]);
    } catch (err) {
      toast({ title: "Bulk delete failed", description: (err as Error).message, variant: "error" });
    }
  };

  const handleBulkReassign = async () => {
    if (!reassignCategory) return;
    try {
      await bulkMutation.mutateAsync({ guestIds: selected, action: "reassignCategory", categoryId: reassignCategory });
      toast({ title: "Category reassigned", variant: "success" });
      setSelected([]);
      setReassignOpen(false);
    } catch (err) {
      toast({ title: "Reassignment failed", description: (err as Error).message, variant: "error" });
    }
  };

  const handleDownload = (url: string) => {
    downloadFile(url, "download").catch((e) =>
      toast({ title: "Download failed", description: e instanceof ApiClientError ? e.message : "Try again", variant: "error" })
    );
  };

  if (isLoading) return <PageSkeleton />;
  if (isError) return <PageError message={(error as Error)?.message} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader
        title="Guests"
        description={`${data?.meta?.total ?? 0} guests · invitation, RSVP and check-in status`}
        actions={
          canManage ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
                <Upload className="size-4" />
                Import
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm">
                    <Download className="size-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Export guests</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleDownload(`/events/${eventId}/guests/export?format=csv`)}>CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload(`/events/${eventId}/guests/export?format=xlsx`)}>XLSX</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDownload(`/events/${eventId}/guests/qr/download-all`)}>
                    <QrCode className="size-4" />
                    Download all QR codes (ZIP)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                Add guest
              </Button>
            </>
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        getRowId={(g) => g._id}
        meta={data?.meta}
        onPageChange={setPage}
        sort={sort}
        onSortChange={setSort}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email or phone..."
        selected={canManage ? selected : undefined}
        onSelectionChange={canManage ? setSelected : undefined}
        bulkBar={
          canManage ? (
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="secondary" onClick={() => setReassignOpen(true)}>
                Reassign
              </Button>
              <Button size="sm" variant="danger" onClick={handleBulkDelete}>
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </div>
          ) : undefined
        }
        toolbar={
          <>
            <Select
              value={rsvp}
              onValueChange={(v) => {
                setRsvp(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="RSVP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All RSVP</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="maybe">Maybe</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={attendance}
              onValueChange={(v) => {
                setAttendance(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Attendance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All attendance</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories?.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        titleAccessor={(g) => g.fullName}
        subtitleAccessor={(g) => {
          const b = rsvpBadge(g.rsvpStatus);
          return `${b.label} · ${attendanceBadge(g.attendanceStatus).label}`;
        }}
        rowActions={
          canManage
            ? (g) => [
                ...(g.approvalStatus === "pending"
                  ? [
                      { label: (<span className="inline-flex items-center gap-2"><UserCheck className="size-3.5" />Approve</span>), onClick: () => handleApprove(g, "approved") },
                      { label: (<span className="inline-flex items-center gap-2"><X className="size-3.5" />Reject</span>), onClick: () => handleApprove(g, "rejected"), destructive: true },
                    ]
                  : []),
                { label: (<span className="inline-flex items-center gap-2"><Pencil className="size-3.5" />Edit</span>), onClick: () => setEditing(g) },
                ...(g.invitationToken
                  ? [{ label: (<span className="inline-flex items-center gap-2"><Link2 className="size-3.5" />Copy invitation link</span>), onClick: () => handleCopyInvite(g) }]
                  : []),
                g.qrToken
                  ? { label: (<span className="inline-flex items-center gap-2"><Download className="size-3.5" />Download QR</span>), onClick: () => handleDownload(`/guests/${g._id}/qr/download`) }
                  : { label: (<span className="inline-flex items-center gap-2"><QrCode className="size-3.5" />Generate QR</span>), onClick: () => handleGenerateQr(g) },
                { label: (<span className="inline-flex items-center gap-2"><Trash2 className="size-3.5" />Delete</span>), onClick: () => handleDelete(g), destructive: true },
              ]
            : undefined
        }
      />

      <Modal open={createOpen} onOpenChange={setCreateOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Add guest</ModalTitle>
            <ModalDescription>Invitation tokens and QR codes are generated automatically.</ModalDescription>
          </ModalHeader>
          <ModalBody>
            <GuestForm eventId={eventId} mode="create" onSuccess={() => setCreateOpen(false)} onCancel={() => setCreateOpen(false)} />
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Edit guest</ModalTitle>
          </ModalHeader>
          <ModalBody>
            {editing ? <GuestForm eventId={eventId} mode="edit" guest={editing} onSuccess={() => setEditing(null)} onCancel={() => setEditing(null)} /> : null}
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal open={importOpen} onOpenChange={setImportOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Import guests</ModalTitle>
            <ModalDescription>Upload a CSV with columns: fullName, email, phone, category, notes.</ModalDescription>
          </ModalHeader>
          <ModalBody>
            <GuestImportForm eventId={eventId} onDone={() => setImportOpen(false)} />
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal open={reassignOpen} onOpenChange={setReassignOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Reassign category</ModalTitle>
            <ModalDescription>{selected.length} selected guests</ModalDescription>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-fg-secondary">Category</p>
              <Select value={reassignCategory} onValueChange={setReassignCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setReassignOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkReassign} disabled={!reassignCategory} loading={bulkMutation.isPending}>
                Reassign
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
