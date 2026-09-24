"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  QrCode,
  Download,
  Upload,
  UserCheck,
  X,
  Share2,
  Crown,
  Send,
  Undo2,
  Link2,
  Copy,
  Mail,
  MessageSquare,
  SlidersHorizontal,
  MoreHorizontal,
} from "lucide-react";
import {
  useGuests,
  useCategories,
  useDeleteGuest,
  useBulkGuestAction,
  useGenerateGuestQr,
  useApproveGuest,
  useEvent,
  useMarkGuestSent,
  useManualCheckin,
  useUndoCheckin,
  useParties,
} from "@/hooks/queries";
import { useDebounce } from "@/hooks/use-debounce";
import { downloadFile, ApiClientError, API_URL, tokenStore } from "@/lib/api";
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
import { GuestQrModal } from "@/components/guests/guest-qr-modal";
import { InvitationShareModal } from "@/components/guests/invitation-share-modal";
import { rsvpBadge, attendanceBadge, approvalBadge, CategoryDot } from "@/components/guests/guest-badges";
import { useToast } from "@/components/ui/toast";
import { formatDateTime, smsHref } from "@/lib/utils";

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
  const [sideFilter, setSideFilter] = useState("all");
  const [vipFilter, setVipFilter] = useState("all");
  const [immediateFilter, setImmediateFilter] = useState("all");
  const [inviteFilter, setInviteFilter] = useState("all");
  const [sort, setSort] = useState("-createdAt");
  const [selected, setSelected] = useState<string[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [familyOpen, setFamilyOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignCategory, setReassignCategory] = useState("");
  const [qrGuest, setQrGuest] = useState<Guest | null>(null);
  const [inviteGuest, setInviteGuest] = useState<Guest | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const paramsObj: Record<string, string> = { page: String(page), limit: "25" };
  if (rsvp !== "all") paramsObj.rsvpStatus = rsvp;
  if (attendance !== "all") paramsObj.attendanceStatus = attendance;
  if (category !== "all") paramsObj.category = category;
  if (sideFilter !== "all") paramsObj.side = sideFilter;
  if (vipFilter !== "all") paramsObj.isVip = vipFilter;
  if (immediateFilter !== "all") paramsObj.isImmediateFamily = immediateFilter;
  if (inviteFilter !== "all") paramsObj.invitationStatus = inviteFilter;
  if (debouncedSearch) paramsObj.q = debouncedSearch;
  if (sort) paramsObj.sort = sort;

  const { data, isLoading, isError, error, refetch } = useGuests(eventId, paramsObj);
  const { data: categories } = useCategories(eventId);
  const { data: event } = useEvent(eventId);
  const { data: parties } = useParties(eventId);

  const deleteMutation = useDeleteGuest(eventId);
  const bulkMutation = useBulkGuestAction(eventId);
  const qrMutation = useGenerateGuestQr(eventId);
  const approveMutation = useApproveGuest(eventId);
  const markSentMutation = useMarkGuestSent(eventId);
  const checkinMutation = useManualCheckin(eventId);
  const undoMutation = useUndoCheckin(eventId);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories?.forEach((c) => map.set(c._id, c.name));
    return map;
  }, [categories]);

  const inviteBadge = (status: Guest["invitationStatus"]) =>
    status === "opened"
      ? { label: "Opened", variant: "success" as const }
      : status === "sent"
        ? { label: "Sent", variant: "primary" as const }
        : { label: "Not Sent", variant: "neutral" as const };

  const columns = useMemo<DataTableColumn<Guest>[]>(() => {
    const cols: DataTableColumn<Guest>[] = [
      {
        key: "fullName",
        header: "Guest",
        primary: true,
        sortable: true,
        sortKey: "fullName",
        hideOnMobile: true,
        cell: (g) => (
          <div className="min-w-0">
            <p className="font-medium text-fg">{g.fullName}</p>
            {g.isVip ? (
              <p className="text-xs text-yellow-600">VIP</p>
            ) : g.isImmediateFamily ? (
              <p className="text-xs text-fg-muted">Immediate Family</p>
            ) : null}
          </div>
        ),
      },
      {
        key: "partyName",
        header: "Party",
        hideOnMobile: true,
        cell: (g) =>
          g.partyName ? (
            <span className="text-fg-secondary">{g.partyName}</span>
          ) : g.side ? (
            <span className="text-fg-muted">{g.side}&apos;s Family</span>
          ) : (
            <span className="text-fg-muted">N/A</span>
          ),
      },
      {
        key: "categoryId",
        header: "Category",
        hideOnMobile: true,
        cell: (g) =>
          g.categoryId ? <CategoryDot color={categories?.find((c) => c._id === g.categoryId)?.colorTag} name={categoryMap.get(g.categoryId) ?? "N/A"} /> : <span className="text-fg-muted">N/A</span>,
      },
      {
        key: "contact",
        header: "Contact",
        cell: (g) => {
          const email = canManage ? g.email : undefined;
          const phone = canManage ? g.phone : undefined;
          if (!email && !phone) return <span className="text-fg-muted">N/A</span>;
          return (
            <div className="min-w-0 text-xs text-fg-secondary">
              {email ? (
                <a href={`mailto:${email}`} className="block truncate hover:text-primary hover:underline">
                  {email}
                </a>
              ) : null}
              {phone ? (
                <a href={`tel:${phone}`} className="block truncate hover:text-primary hover:underline">
                  {phone}
                </a>
              ) : null}
            </div>
          );
        },
      },
      {
        key: "side",
        header: "Side",
        hideOnMobile: true,
        cell: (g) => g.side ? <Badge variant={g.side === "Bride" ? "primary" : "secondary"}>{g.side}</Badge> : <span className="text-fg-muted">N/A</span>,
      },
      {
        key: "isVip",
        header: "VIP",
        hideOnMobile: true,
        className: "w-16 text-center",
        headerClassName: "text-center",
        cell: (g) => g.isVip ? <Crown className="size-4 mx-auto text-yellow-500" /> : <span className="text-fg-muted">N/A</span>,
      },
      {
        key: "invitationStatus",
        header: "Invite",
        sortable: true,
        sortKey: "invitationStatus",
        cell: (g) => {
          const b = inviteBadge(g.invitationStatus);
          return <Badge variant={b.variant}>{b.label}</Badge>;
        },
      },
      {
        key: "invitationOpenedAt",
        header: "Opened",
        cell: (g) =>
          g.invitationOpenedAt ? (
            <span className="text-xs text-fg-secondary">{formatDateTime(g.invitationOpenedAt)}</span>
          ) : (
            <span className="text-fg-muted">N/A</span>
          ),
      },
      ...(event?.config?.modules.rsvp
        ? [{ key: "rsvpStatus", header: "RSVP", hideOnMobile: true, cell: (g: Guest) => <Badge variant={rsvpBadge(g.rsvpStatus).variant}>{rsvpBadge(g.rsvpStatus).label}</Badge> }]
        : []),
      ...(event?.config?.modules.qrCheckin
        ? [
            {
              key: "attendanceStatus",
              header: "Attendance",
              hideOnMobile: true,
              cell: (g: Guest) => <Badge variant={attendanceBadge(g.attendanceStatus).variant}>{attendanceBadge(g.attendanceStatus).label}</Badge>,
            },
          ]
        : []),
      ...(event?.config?.requiresApproval
        ? [{ key: "approvalStatus", header: "Approval", hideOnMobile: true, cell: (g: Guest) => <Badge variant={approvalBadge(g.approvalStatus).variant}>{approvalBadge(g.approvalStatus).label}</Badge> }]
        : []),
      {
        key: "checkInTime",
        header: "Check-in",
        hideOnMobile: true,
        cell: (g) => <span className="text-fg-secondary">{g.checkInTime ? formatDateTime(g.checkInTime) : "N/A"}</span>,
      },
      ...(canManage
        ? [
            {
              key: "share",
              header: "Share",
              hideOnMobile: true,
              className: "w-14 text-center",
              headerClassName: "text-center",
              cell: (g: Guest) => (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInviteGuest(g);
                  }}
                  title="Share invitation"
                  aria-label="Share invitation"
                  className="inline-flex size-9 items-center justify-center rounded-md border border-transparent transition-colors hover:border-primary/40 hover:bg-primary/10"
                >
                  <Share2 className="size-4 text-primary" />
                </button>
              ),
            },
          ]
        : []),
      {
        key: "qr",
        header: "QR",
        hideOnMobile: true,
        className: "w-14 text-center",
        headerClassName: "text-center",
        cell: (g) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              g.qrToken ? setQrGuest(g) : handleGenerateQr(g);
            }}
            title={g.qrToken ? "View QR code" : "Generate QR code"}
            aria-label={g.qrToken ? "View QR code" : "Generate QR code"}
            className="inline-flex size-9 items-center justify-center rounded-md border border-transparent transition-colors hover:border-primary/40 hover:bg-primary/10"
          >
            {g.qrToken ? <QrCode className="size-4 text-primary" /> : <QrCode className="size-4 text-fg-muted" />}
          </button>
        ),
      },
    ];
    return cols;
  }, [canManage, categories, categoryMap, event]);

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
      setQrGuest({ ...guest, qrToken: guest.qrToken ?? "pending", qrGeneratedAt: new Date().toISOString() });
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

  const handleMarkSent = async (guest: Guest) => {
    try {
      await markSentMutation.mutateAsync({ id: guest._id });
      toast({ title: "Invitation marked as sent", variant: "success" });
    } catch (err) {
      toast({ title: "Could not mark as sent", description: (err as Error).message, variant: "error" });
    }
  };

  const handleMarkPresent = async (guest: Guest) => {
    try {
      await checkinMutation.mutateAsync({ eventId, guestId: guest._id });
      toast({ title: `${guest.fullName} checked in`, variant: "success" });
    } catch (err) {
      toast({ title: "Check-in failed", description: (err as Error).message, variant: "error" });
    }
  };

  const inviteUrlFor = (guest: Guest) =>
    guest.invitationToken ? `${window.location.origin}/i/${guest.invitationToken}` : "";

  const inviteMessageFor = (guest: Guest) => {
    const url = inviteUrlFor(guest);
    return [
      `${event?.brideName || "Ikram Halane"} & ${event?.groomName || "Nebil Yusuf"} request the pleasure of your company as they celebrate their marriage.`,
      "",
      "Your personalized invitation and wedding pass:",
      url,
      "",
      event?.venue ? `Venue: ${event.venue}` : "Venue: Woodbine Banquet Hall",
      event?.dressCode ? `Dress Code: ${event.dressCode}` : "Dress Code: Traditional Clothing / Black Tie",
      "",
      "For additional wedding information:",
      event?.weddingWebsiteUrl || "https://withjoy.com/ikramhalane-and-nebilyusuf",
    ].join("\n");
  };

  const handleResendEmail = async (guest: Guest) => {
    if (!guest.email) {
      toast({ title: "No email on file", description: `Add an email for ${guest.fullName} first.`, variant: "error" });
      return;
    }
    const url = inviteUrlFor(guest);
    if (!url) return;
    const subject = encodeURIComponent(
      `You're invited to ${event?.brideName || "Ikram Halane"} & ${event?.groomName || "Nebil Yusuf"}'s Wedding`
    );
    const body = encodeURIComponent(inviteMessageFor(guest));
    window.open(`mailto:${guest.email}?subject=${subject}&body=${body}`, "_self");
    try {
      await markSentMutation.mutateAsync({ id: guest._id, channel: "email" });
      toast({ title: "Email opened & marked as sent", variant: "success" });
    } catch {
      toast({ title: "Could not mark as sent", variant: "error" });
    }
  };

  const handleResendSms = async (guest: Guest) => {
    if (!guest.phone) {
      toast({ title: "No phone on file", description: `Add a phone number for ${guest.fullName} first.`, variant: "error" });
      return;
    }
    const url = inviteUrlFor(guest);
    if (!url) return;
    const phone = guest.phone;
    window.open(smsHref(phone, inviteMessageFor(guest)), "_self");
    try {
      await markSentMutation.mutateAsync({ id: guest._id, channel: "sms" });
      toast({ title: "SMS opened & marked as sent", variant: "success" });
    } catch {
      toast({ title: "Could not mark as sent", variant: "error" });
    }
  };

  const handleUndoCheckin = async (guest: Guest) => {
    try {
      await undoMutation.mutateAsync(guest._id);
      toast({ title: `Check-in undone for ${guest.fullName}`, variant: "success" });
    } catch (err) {
      toast({ title: "Could not undo check-in", description: (err as Error).message, variant: "error" });
    }
  };

  const handleShareQr = async (guest: Guest) => {
    if (!guest.qrToken) return;
    const eventName = event?.name ?? "this event";

    const openWhatsApp = () => {
      const phone = guest.phone ? guest.phone.replace(/[^\d]/g, "") : "";
      const message = [
        `You're invited to ${eventName}!`,
        guest.invitationToken ? `${window.location.origin}/i/${guest.invitationToken}` : "",
        "Show your QR code at the entrance to check in.",
      ]
        .filter(Boolean)
        .join("\n");
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
    };

    try {
      const res = await fetch(`${API_URL}/guests/${guest._id}/qr/download`, {
        headers: tokenStore.get() ? { Authorization: `Bearer ${tokenStore.get()}` } : undefined,
        credentials: "include",
      });
      if (!res.ok) throw new ApiClientError("Could not fetch QR code.", res.status);

      const blob = await res.blob();
      const file = new File([blob], `${guest.fullName.replace(/\s+/g, "_")}-qr.png`, { type: "image/png" });
      const shareData: ShareData = {
        files: [file],
        title: `Entry QR - ${guest.fullName}`,
        text: `${guest.fullName}'s entry QR for ${eventName}`,
      };

      const canShare =
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare(shareData);

      if (canShare) {
        await navigator.share(shareData);
        return;
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
    }

    openWhatsApp();
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

  const activeFilterCount = [rsvp, attendance, category, sideFilter, vipFilter, immediateFilter, inviteFilter].filter(
    (v) => v !== "all"
  ).length;

  const clearFilters = () => {
    setRsvp("all");
    setAttendance("all");
    setCategory("all");
    setSideFilter("all");
    setVipFilter("all");
    setImmediateFilter("all");
    setInviteFilter("all");
    setPage(1);
  };

  const filterControls = (
    <>
      {event?.config?.modules.rsvp ? (
        <Select
          value={rsvp}
          onValueChange={(v) => {
            setRsvp(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
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
      ) : null}
      {event?.config?.modules.qrCheckin ? (
        <Select
          value={attendance}
          onValueChange={(v) => {
            setAttendance(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Attendance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All attendance</SelectItem>
            <SelectItem value="present">Present</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
          </SelectContent>
        </Select>
      ) : null}
      {categories && categories.length > 0 ? (
        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-36 text-xs">
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
      ) : null}
      <Select
        value={sideFilter}
        onValueChange={(v) => {
          setSideFilter(v);
          setPage(1);
        }}
      >
        <SelectTrigger className="h-8 w-28 text-xs">
          <SelectValue placeholder="Side" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sides</SelectItem>
          <SelectItem value="Bride">Bride</SelectItem>
          <SelectItem value="Groom">Groom</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={vipFilter}
        onValueChange={(v) => {
          setVipFilter(v);
          setPage(1);
        }}
      >
        <SelectTrigger className="h-8 w-28 text-xs">
          <SelectValue placeholder="VIP" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All guests</SelectItem>
          <SelectItem value="true">VIP only</SelectItem>
          <SelectItem value="false">Non-VIP</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={immediateFilter}
        onValueChange={(v) => {
          setImmediateFilter(v);
          setPage(1);
        }}
      >
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue placeholder="Immediate" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All families</SelectItem>
          <SelectItem value="true">Immediate Family</SelectItem>
          <SelectItem value="false">Non-immediate</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={inviteFilter}
        onValueChange={(v) => {
          setInviteFilter(v);
          setPage(1);
        }}
      >
        <SelectTrigger className="h-8 w-32 text-xs">
          <SelectValue placeholder="Invite" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All invites</SelectItem>
          <SelectItem value="not_sent">Not Sent</SelectItem>
          <SelectItem value="sent">Sent</SelectItem>
          <SelectItem value="opened">Opened</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  const headerActions = canManage ? (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <Button size="sm" onClick={() => setCreateOpen(true)} className="min-w-0 flex-1 sm:flex-none">
        <Plus className="size-4" />
        Add guest
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)} className="min-w-0 flex-1 sm:flex-none">
        <Upload className="size-4" />
        Import
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" className="shrink-0">
            <MoreHorizontal className="size-4" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setFamilyOpen(true)}>
            <Link2 className="size-4" />
            Family links
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Export</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleDownload(`/events/${eventId}/guests/export?format=csv`)}>CSV</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDownload(`/events/${eventId}/guests/export?format=xlsx`)}>XLSX</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDownload(`/events/${eventId}/guests/qr/download-all`)}>
            <QrCode className="size-4" />
            All QR codes (ZIP)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ) : undefined;

  return (
    <div>
      <PageHeader
        title="Guests"
        description={`${data?.meta?.total ?? 0} guests · invitation, RSVP and check-in status`}
        actions={headerActions}
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        getRowId={(g) => g._id}
        meta={data?.meta}
        onPageChange={setPage}
        sort={sort}
        onSortChange={(s) => {
          setSort(s);
          setPage(1);
        }}
        search={search}
        onSearchChange={(q) => {
          setSearch(q);
          setPage(1);
        }}
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
            <div className="hidden flex-wrap items-center gap-2 sm:flex">{filterControls}</div>
            <Button variant="secondary" size="sm" className="sm:hidden" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal className="size-4" />
              Filters
              {activeFilterCount > 0 ? (
                <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
          </>
        }
        titleAccessor={(g) => g.fullName}
        subtitleAccessor={(g) => {
          const parts: string[] = [];
          if (g.partyName) parts.push(g.partyName);
          else if (g.side) parts.push(`${g.side}'s family`);
          if (g.isVip) parts.push("VIP");
          if (g.isImmediateFamily) parts.push("Immediate Family");
          parts.push(inviteBadge(g.invitationStatus).label);
          const b = rsvpBadge(g.rsvpStatus);
          parts.push(b.label, attendanceBadge(g.attendanceStatus).label);
          return parts.join(" · ");
        }}
        mobileEndContent={(g) => (
          <>
            {canManage ? (
              <button
                type="button"
                onClick={() => setInviteGuest(g)}
                title="Share invitation"
                aria-label="Share invitation"
                className="inline-flex size-9 items-center justify-center rounded-md border border-border-strong text-fg-secondary transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
              >
                <Share2 className="size-4 text-primary" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => (g.qrToken ? setQrGuest(g) : handleGenerateQr(g))}
              title={g.qrToken ? "View QR code" : "Generate QR code"}
              aria-label={g.qrToken ? "View QR code" : "Generate QR code"}
              className="inline-flex size-9 items-center justify-center rounded-md border border-border-strong text-fg-secondary transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
            >
              {g.qrToken ? <QrCode className="size-4 text-primary" /> : <QrCode className="size-4" />}
            </button>
          </>
        )}
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
                { label: (<span className="inline-flex items-center gap-2"><Share2 className="size-3.5" />Share invitation</span>), onClick: () => setInviteGuest(g) },
                { label: (<span className="inline-flex items-center gap-2"><Mail className="size-3.5" />Resend by Email</span>), onClick: () => handleResendEmail(g) },
                { label: (<span className="inline-flex items-center gap-2"><MessageSquare className="size-3.5" />Resend by SMS</span>), onClick: () => handleResendSms(g) },
                { label: (<span className="inline-flex items-center gap-2"><Send className="size-3.5" />Mark as sent</span>), onClick: () => handleMarkSent(g) },
                ...(event?.config?.modules.qrCheckin
                  ? g.attendanceStatus === "absent"
                    ? [{ label: (<span className="inline-flex items-center gap-2"><UserCheck className="size-3.5" />Mark present</span>), onClick: () => handleMarkPresent(g) }]
                    : [{ label: (<span className="inline-flex items-center gap-2"><Undo2 className="size-3.5" />Undo check-in</span>), onClick: () => handleUndoCheckin(g) }]
                  : []),
                ...(g.qrToken
                  ? [
                      { label: (<span className="inline-flex items-center gap-2"><Share2 className="size-3.5" />Share QR</span>), onClick: () => handleShareQr(g) },
                      { label: (<span className="inline-flex items-center gap-2"><Download className="size-3.5" />Download QR</span>), onClick: () => handleDownload(`/guests/${g._id}/qr/download`) },
                    ]
                  : [{ label: (<span className="inline-flex items-center gap-2"><QrCode className="size-3.5" />Generate QR</span>), onClick: () => handleGenerateQr(g) }]),
                { label: (<span className="inline-flex items-center gap-2"><Trash2 className="size-3.5" />Delete</span>), onClick: () => handleDelete(g), destructive: true },
              ]
            : undefined
        }
      />

      <Modal open={filtersOpen} onOpenChange={setFiltersOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Filters</ModalTitle>
            <ModalDescription>Narrow down the guest list.</ModalDescription>
          </ModalHeader>
          <ModalBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filterControls}
            <Button variant="ghost" className="justify-start sm:col-span-2" onClick={clearFilters}>
              Clear all filters
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>

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
            <ModalDescription>Upload a CSV with columns: first name, last name, email, phone, category, party/family id, party/family name, side, vip, immediate family, notes.</ModalDescription>
          </ModalHeader>
          <ModalBody>
            <GuestImportForm eventId={eventId} onDone={() => setImportOpen(false)} />
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal open={familyOpen} onOpenChange={setFamilyOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Family links</ModalTitle>
            <ModalDescription>Share a family page listing every member&apos;s individual invitation pass.</ModalDescription>
          </ModalHeader>
          <ModalBody className="space-y-2">
            {!parties || parties.length === 0 ? (
              <p className="text-sm text-fg-muted">No families found. Import guests with a Party/Family name to create families.</p>
            ) : (
              parties.map((p) => {
                const familyUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/family/${p.token}`;
                return (
                  <div key={p._id} className="flex items-center gap-3 rounded-lg border bg-surface-2/50 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">{p.name}</p>
                      <p className="text-xs text-fg-muted">
                        {p.guestCount ?? 0} guests{p.side ? ` · ${p.side}` : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(familyUrl);
                          toast({ title: `Family link copied for ${p.name}`, variant: "success" });
                        } catch {
                          toast({ title: "Could not copy link", variant: "error" });
                        }
                      }}
                    >
                      <Copy className="size-3.5" />
                      Copy link
                    </Button>
                  </div>
                );
              })
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal open={reassignOpen} onOpenChange={setReassignOpen}>        <ModalContent>
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

      <GuestQrModal
        guest={qrGuest}
        event={event}
        open={!!qrGuest}
        onOpenChange={(o) => !o && setQrGuest(null)}
        onShare={handleShareQr}
        onRegenerate={handleGenerateQr}
        regenerating={qrMutation.isPending}
      />

      <InvitationShareModal
        guest={inviteGuest}
        event={event}
        open={!!inviteGuest}
        onOpenChange={(o) => !o && setInviteGuest(null)}
        onMarkSent={(id, channel) => markSentMutation.mutateAsync({ id, channel })}
      />
    </div>
  );
}
