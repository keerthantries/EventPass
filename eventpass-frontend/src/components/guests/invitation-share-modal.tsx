"use client";

import { useState } from "react";
import { Share2, Copy, Check, MessageCircle, Mail, Sparkles, CalendarDays, MapPin, Clock3, Link2 } from "lucide-react";
import { Modal, ModalContent, ModalBody } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatTime, cn } from "@/lib/utils";
import type { Guest, EventDetail } from "@/lib/types";

interface InvitationShareModalProps {
  guest: Guest | null;
  event?: EventDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvitationShareModal({ guest, event, open, onOpenChange }: InvitationShareModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const inviteUrl = guest?.invitationToken ? `${window.location.origin}/invite/${guest.invitationToken}` : "";
  const primary = event?.branding?.primaryColor ?? "#6b78e6";
  const secondary = event?.branding?.secondaryColor ?? "#0f1020";

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

  const shareMessage = [
    `You're invited to ${event?.name ?? "this event"}!`,
    inviteUrl,
    "Let us know if you can make it.",
  ]
    .filter(Boolean)
    .join("\n");

  const openWhatsApp = () => {
    const phone = guest?.phone ? guest.phone.replace(/[^\d]/g, "") : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(shareMessage)}`, "_blank", "noopener");
  };

  const openMail = () => {
    const subject = encodeURIComponent(`You're invited to ${event?.name ?? "this event"}`);
    const body = encodeURIComponent(shareMessage);
    const to = guest?.email ?? "";
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, "_self");
  };

  const openNativeShare = async () => {
    try {
      await navigator.share({ title: `Invitation - ${event?.name ?? "Event"}`, text: shareMessage, url: inviteUrl });
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
    }
  };

  return (
    <Modal open={open && !!guest} onOpenChange={onOpenChange}>
      <ModalContent className="overflow-hidden p-0 sm:max-w-md">
        <div
          className="relative px-5 pb-5 pt-6"
          style={{ background: `linear-gradient(160deg, ${secondary} 0%, #0a0a14 60%)` }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-20 animate-fade-in"
            style={{ background: `radial-gradient(circle at 80% -10%, ${primary}, transparent 55%)` }}
          />
          <div className="relative animate-slide-in">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/90">
                <Sparkles className="size-3" style={{ color: primary }} />
                EventPass invitation
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">{event?.name ?? "You're invited"}</h2>

            <div className="mt-4 space-y-2 text-sm text-white/80">
              {event?.startDate ? (
                <p className="flex items-center gap-2.5">
                  <CalendarDays className="size-4 shrink-0" style={{ color: primary }} />
                  {formatDate(event.startDate)}
                  {event.startTime ? <span className="text-white/50">· {formatTime(event.startTime)}</span> : null}
                </p>
              ) : null}
              {event?.venue ? (
                <p className="flex items-center gap-2.5">
                  <MapPin className="size-4 shrink-0" style={{ color: primary }} />
                  {event.venue}
                </p>
              ) : null}
              {event?.startTime ? (
                <p className="flex items-center gap-2.5">
                  <Clock3 className="size-4 shrink-0" style={{ color: primary }} />
                  {formatTime(event.startTime)}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <ModalBody className="space-y-4 animate-slide-up">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-2/60 p-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full" style={{ background: `${primary}22` }}>
              <Link2 className="size-4" style={{ color: primary }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-fg-muted">Guest</p>
              <p className="truncate text-sm font-semibold text-fg">{guest?.fullName}</p>
            </div>
          </div>

          {inviteUrl ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-black/40 p-2 pl-3">
              <p className="min-w-0 flex-1 truncate text-xs text-fg-muted">{inviteUrl}</p>
              <Button size="sm" variant={copied ? "secondary" : "outline"} onClick={copyLink} className="shrink-0">
                {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-fg-muted">
              This guest has no invitation link yet.
            </div>
          )}

          <div className="grid grid-cols-1 gap-2">
            <Button onClick={openWhatsApp} className="w-full" disabled={!inviteUrl}>
              <MessageCircle className="size-4" />
              Send via WhatsApp
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={openMail} disabled={!inviteUrl}>
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
                  Copy link
                </Button>
              )}
            </div>
          </div>

          <div
            className={cn(
              "flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5",
              "animate-pulse-soft"
            )}
          >
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-fg-secondary">
              Preview only — this will be replaced with the real invitation.
            </p>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}