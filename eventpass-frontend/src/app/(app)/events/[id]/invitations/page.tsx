"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Mail,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  Share2,
  Copy,
  MessageCircle,
  Users,
  Crown,
  Search,
  Download,
} from "lucide-react";
import { useGuests, useEvent, useBulkGuestAction, useMarkGuestSent } from "@/hooks/queries";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton, PageError } from "@/components/ui/page-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { cn, formatDate, formatTime, initials } from "@/lib/utils";
import type { Guest, EventDetail } from "@/lib/types";

export default function InvitationsPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const canManage = user?.role === "organizer" || user?.role === "super_admin";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [side, setSide] = useState("all");
  const [invitationStatus, setInvitationStatus] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [shareGuest, setShareGuest] = useState<Guest | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const paramsObj: Record<string, string> = { page: String(page), limit: "25" };
  if (side !== "all") paramsObj.side = side;
  if (invitationStatus !== "all") paramsObj.invitationStatus = invitationStatus;
  if (debouncedSearch) paramsObj.q = debouncedSearch;

  const { data, isLoading, isError, error, refetch } = useGuests(eventId, paramsObj);
  const { data: event } = useEvent(eventId);
  const bulkMutation = useBulkGuestAction(eventId);
  const markSentMutation = useMarkGuestSent(eventId);

  const stats = useMemo(() => {
    const items = data?.items ?? [];
    return {
      total: data?.meta?.total ?? items.length,
      notSent: items.filter((g) => g.invitationStatus === "not_sent").length,
      sent: items.filter((g) => g.invitationStatus === "sent").length,
      opened: items.filter((g) => g.invitationStatus === "opened").length,
    };
  }, [data]);

  const handleBulkMarkSent = async () => {
    if (selected.length === 0) return;
    try {
      await bulkMutation.mutateAsync({ guestIds: selected, action: "markSent" });
      toast({ title: `${selected.length} invitations marked as sent`, variant: "success" });
      setSelected([]);
    } catch (err) {
      toast({ title: "Failed to mark invitations", description: (err as Error).message, variant: "error" });
    }
  };

  const handleBulkGenerateQr = async () => {
    if (selected.length === 0) return;
    try {
      await bulkMutation.mutateAsync({ guestIds: selected, action: "generateBulkQr" });
      toast({ title: `QR codes generated for ${selected.length} guests`, variant: "success" });
      setSelected([]);
    } catch (err) {
      toast({ title: "Failed to generate QR codes", description: (err as Error).message, variant: "error" });
    }
  };

  if (isLoading) return <PageSkeleton />;
  if (isError) return <PageError message={(error as Error)?.message} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader
        title="Invitations"
        description="Manage and share wedding invitations with your guests."
        actions={
          canManage ? (
            <Button variant="secondary" size="sm">
              <Download className="size-4" />
              Export
            </Button>
          ) : undefined
        }
      />

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Guests", value: stats.total, icon: Users, color: "text-fg-secondary" },
          { label: "Not Sent", value: stats.notSent, icon: Mail, color: "text-fg-muted" },
          { label: "Sent", value: stats.sent, icon: Send, color: "text-blue-500" },
          { label: "Opened", value: stats.opened, icon: Eye, color: "text-green-500" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn("flex size-9 items-center justify-center rounded-lg bg-surface-2", s.color)}>
                <s.icon className="size-4" />
              </div>
              <div>
                <p className="text-lg font-semibold text-fg">{s.value}</p>
                <p className="text-xs text-fg-muted">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + Bulk Actions */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search guests..."
            className="pl-9"
          />
        </div>
        <Select value={side} onValueChange={(v) => { setSide(v); setPage(1); }}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Side" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sides</SelectItem>
            <SelectItem value="Bride">Bride</SelectItem>
            <SelectItem value="Groom">Groom</SelectItem>
          </SelectContent>
        </Select>
        <Select value={invitationStatus} onValueChange={(v) => { setInvitationStatus(v); setPage(1); }}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="not_sent">Not Sent</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="opened">Opened</SelectItem>
          </SelectContent>
        </Select>

        {selected.length > 0 && canManage && (
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-xs text-fg-muted">{selected.length} selected</span>
            <Button size="sm" variant="secondary" onClick={handleBulkGenerateQr}>
              Generate QR
            </Button>
            <Button size="sm" onClick={handleBulkMarkSent}>
              <Send className="size-3.5" />
              Mark Sent
            </Button>
          </div>
        )}
      </div>

      {/* Guest List */}
      {data?.items && data.items.length > 0 ? (
        <div className="space-y-2">
          {data.items.map((guest) => (
            <InvitationRow
              key={guest._id}
              guest={guest}
              event={event}
              canManage={canManage}
              isSelected={selected.includes(guest._id)}
              onToggleSelect={() => {
                setSelected((prev) =>
                  prev.includes(guest._id) ? prev.filter((id) => id !== guest._id) : [...prev, guest._id]
                );
              }}
              onShare={() => setShareGuest(guest)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No guests found"
          description="Import guests or add them manually to start sending invitations."
        />
      )}

      {/* Pagination */}
      {data?.meta && data.meta.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-3 text-sm text-fg-muted">
            Page {page} of {data.meta.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
            disabled={page >= data.meta.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Share Modal */}
      <InvitationShareInline
        guest={shareGuest}
        event={event}
        open={!!shareGuest}
        onOpenChange={(o) => !o && setShareGuest(null)}
        onMarkSent={markSentMutation.mutateAsync}
      />
    </div>
  );
}

function InvitationRow({
  guest,
  event,
  canManage,
  isSelected,
  onToggleSelect,
  onShare,
}: {
  guest: Guest;
  event?: EventDetail;
  canManage: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onShare: () => void;
}) {
  const statusConfig = {
    not_sent: { label: "Not Sent", variant: "neutral" as const, icon: Mail },
    sent: { label: "Sent", variant: "primary" as const, icon: Send },
    opened: { label: "Opened", variant: "success" as const, icon: Eye },
  };
  const status = statusConfig[guest.invitationStatus] || statusConfig.not_sent;
  const StatusIcon = status.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-surface-2/50",
        isSelected && "border-primary/40 bg-primary/5"
      )}
    >
      {canManage && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="size-4 shrink-0 rounded border-border"
        />
      )}

      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold text-fg-secondary">
        {guest.invitationToken ? initials(guest.fullName) : <XCircle className="size-4 text-fg-muted" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-fg">{guest.fullName}</p>
          {guest.isVip && <Crown className="size-3 shrink-0 text-yellow-500" />}
        </div>
        <div className="flex items-center gap-2 text-xs text-fg-muted">
          {guest.side && <span>{guest.side}</span>}
          {guest.partyId && typeof guest.partyId === "object" && <span>· {(guest.partyId as { name: string }).name}</span>}
        </div>
      </div>

      <Badge variant={status.variant} className="shrink-0">
        <StatusIcon className="mr-1 size-3" />
        {status.label}
      </Badge>

      {guest.invitationToken && (
        <Button size="sm" variant="secondary" onClick={onShare} className="shrink-0">
          <Share2 className="size-3.5" />
          Share
        </Button>
      )}
    </div>
  );
}

function InvitationShareInline({
  guest,
  event,
  open,
  onOpenChange,
  onMarkSent,
}: {
  guest: Guest | null;
  event?: EventDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkSent?: (guestId: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isMarkingSent, setIsMarkingSent] = useState(false);

  if (!guest) return null;

  const inviteUrl = guest.invitationToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/i/${guest.invitationToken}`
    : "";

  const primary = event?.branding?.primaryColor ?? "#8b5cf6";
  const secondary = event?.branding?.secondaryColor ?? "#1a1a2e";

  const copyLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast({ title: "Invitation link copied", variant: "success" });
    } catch {
      toast({ title: "Could not copy link", variant: "error" });
    }
  };

  const handleMarkSent = async () => {
    if (!onMarkSent || isMarkingSent) return;
    setIsMarkingSent(true);
    try {
      await onMarkSent(guest._id);
      toast({ title: "Invitation marked as sent", variant: "success" });
    } catch {
      toast({ title: "Could not mark as sent", variant: "error" });
    } finally {
      setIsMarkingSent(false);
    }
  };

  const shareText = [
    `You're invited to ${event?.brideName || event?.name} & ${event?.groomName || ""}'s wedding!`,
    "",
    event?.startDate ? `Date: ${formatDate(event.startDate)}` : "",
    event?.startTime ? `Time: ${formatTime(event.startTime)}` : "",
    event?.venue ? `Venue: ${event.venue}` : "",
    "",
    "RSVP here:",
    inviteUrl,
  ].filter(Boolean).join("\n");

  const openSms = () => {
    window.open(`sms:?body=${encodeURIComponent(shareText)}`, "_self");
    handleMarkSent();
  };

  const openEmail = () => {
    const subject = encodeURIComponent(`You're invited to ${event?.brideName || event?.name} & ${event?.groomName || ""}'s Wedding`);
    const body = encodeURIComponent(shareText);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
    handleMarkSent();
  };

  const openWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener");
    handleMarkSent();
  };

  const openNativeShare = async () => {
    try {
      await navigator.share({
        title: `${event?.brideName || event?.name} & ${event?.groomName || ""} Wedding`,
        text: shareText,
        url: inviteUrl,
      });
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
    }
    handleMarkSent();
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-md">
        <ModalHeader>
          <ModalTitle>Share Invitation</ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-4">
          {/* Preview Card */}
          <div
            className="overflow-hidden rounded-xl border text-white"
            style={{
              borderColor: "rgba(255,255,255,0.12)",
              background: `linear-gradient(165deg, ${secondary} 0%, #0a0a14 65%)`,
            }}
          >
            <div className="px-5 py-6 text-center">
              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/50">Together with their families</p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                {event?.brideName || "Ikram"} & {event?.groomName || "Nebil"}
              </h3>
              <div className="my-3 flex items-center justify-center gap-2">
                <span className="h-px w-8 bg-white/20" />
                <span className="text-xs" style={{ color: primary }}>&#10022;</span>
                <span className="h-px w-8 bg-white/20" />
              </div>
              <p className="text-sm text-white/70">{guest.fullName}</p>
              {event?.startDate && (
                <p className="mt-1 text-xs text-white/50">{formatDate(event.startDate)}</p>
              )}
            </div>
          </div>

          {/* Share URL */}
          <div className="flex items-center gap-2 rounded-lg border bg-surface-2/60 p-2 pl-3">
            <p className="min-w-0 flex-1 truncate text-xs text-fg-muted">{inviteUrl || "No link"}</p>
            <Button size="sm" variant={copied ? "secondary" : "outline"} onClick={copyLink} disabled={!inviteUrl}>
              {copied ? <CheckCircle2 className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={openSms} disabled={!inviteUrl}>
              <MessageCircle className="size-4" />
              Text Message
            </Button>
            <Button onClick={openWhatsApp} variant="secondary" disabled={!inviteUrl}>
              <MessageCircle className="size-4" />
              WhatsApp
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={openEmail} disabled={!inviteUrl}>
              <Mail className="size-4" />
              Email
            </Button>
            {typeof navigator !== "undefined" && typeof navigator.share === "function" ? (
              <Button variant="secondary" onClick={openNativeShare} disabled={!inviteUrl}>
                <Share2 className="size-4" />
                More
              </Button>
            ) : (
              <Button variant="secondary" onClick={copyLink} disabled={!inviteUrl}>
                <Copy className="size-4" />
                Copy Link
              </Button>
            )}
          </div>

          <p className="text-center text-xs text-fg-muted">
            Send this to <strong>{guest.fullName}</strong> to invite them.
          </p>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
