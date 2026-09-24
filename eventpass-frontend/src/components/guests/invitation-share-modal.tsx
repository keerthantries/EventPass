"use client";

import { useState } from "react";
import { Share2, Copy, Check, MessageCircle, Mail, Send } from "lucide-react";
import { Modal, ModalContent, ModalBody } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { Guest, EventDetail, InvitationChannel } from "@/lib/types";

interface InvitationShareModalProps {
  guest: Guest | null;
  event?: EventDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkSent?: (guestId: string, channel?: InvitationChannel) => Promise<void>;
}

function formatDateParts(dateString: string): { dayName: string; month: string; dayNumber: number; year: number } {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { dayName: "", month: "", dayNumber: 0, year: 0 };
  }
  const dayName = date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }).toUpperCase();
  const month = date.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" }).toUpperCase();
  const dayNumber = date.getUTCDate();
  const year = date.getUTCFullYear();
  return { dayName, month, dayNumber, year };
}

export function InvitationShareModal({ guest, event, open, onOpenChange, onMarkSent }: InvitationShareModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isMarkingSent, setIsMarkingSent] = useState(false);

  const inviteUrl = guest?.invitationToken ? `${window.location.origin}/i/${guest.invitationToken}` : "";

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

  const handleMarkSent = async (channel?: InvitationChannel) => {
    if (!guest || !onMarkSent || isMarkingSent) return;
    setIsMarkingSent(true);
    try {
      await onMarkSent(guest._id, channel);
      toast({ title: "Invitation marked as sent", variant: "success" });
    } catch {
      toast({ title: "Could not mark as sent", variant: "error" });
    } finally {
      setIsMarkingSent(false);
    }
  };

  const brideName = event?.brideName || "Ikram Halane";
  const groomName = event?.groomName || "Nebil Yusuf";
  const venue = event?.venue || "Woodbine Banquet Hall";
  const venueAddress = event?.venueAddress || "30 Vice Regent Blvd, Etobicoke, ON M9W 7A4";
  const guestArrivalTime = event?.guestArrivalTime || "6:00PM";
  const dressCode = event?.dressCode || "Traditional Clothing / Black Tie";
  const quranVerse = event?.quranVerse || "\"AND WE CREATED YOU IN PAIRS.\"";
  const quranReference = event?.quranReference || "QURAN 78:8";
  const bismillahImageUrl = event?.bismillahImageUrl || "https://res.cloudinary.com/cvuqo9hg/image/upload/v1789584106/Gemini_Generated_Image_7xmguy7xmguy7xmg-removebg-preview.png";
  const invitationMessage = event?.invitationMessage || "TOGETHER WITH OUR FAMILIES, WE REQUEST THE HONOUR OF YOUR PRESENCE TO CELEBRATE THE WEDDING OF";

  const { dayName, month, dayNumber, year } = event?.startDate
    ? formatDateParts(event.startDate)
    : { dayName: "", month: "", dayNumber: 0, year: 0 };

  const shareParts: string[] = [`You're invited to ${brideName} & ${groomName}'s wedding!`];
  shareParts.push("", "RSVP here:", inviteUrl);
  const shareMessage = shareParts.filter(Boolean).join("\n");

  const openWhatsApp = () => {
    const phone = guest?.phone ? guest.phone.replace(/[^\d]/g, "") : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(shareMessage)}`, "_blank", "noopener");
    handleMarkSent("whatsapp");
  };

  const openMail = () => {
    const subject = encodeURIComponent(`You're invited to ${brideName} & ${groomName}'s Wedding`);
    const body = encodeURIComponent(shareMessage);
    const to = guest?.email ?? "";
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, "_self");
    handleMarkSent("email");
  };

  const openNativeShare = async () => {
    try {
      await navigator.share({ title: `${brideName} & ${groomName} Wedding`, text: shareMessage, url: inviteUrl });
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
    }
    handleMarkSent("other");
  };

  return (
    <Modal open={open && !!guest} onOpenChange={onOpenChange}>
      <ModalContent className="overflow-hidden p-0 sm:max-w-sm">
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap"
          rel="stylesheet"
        />

        <style>{`
          .modal-gold-text {
            color: #b58d3d;
            background: linear-gradient(135deg, #9a7428 0%, #d4af37 40%, #8a641c 70%, #c59b27 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .modal-card {
            background-color: #fcfbfa;
            width: 100%;
            max-width: 340px;
            margin: 0 auto;
            padding: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
          }
          .modal-card-inner {
            border: 2px solid #c59b27;
            padding: 12px 14px;
            position: relative;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            gap: 6px;
          }
          .modal-card-inner::before {
            content: "";
            position: absolute;
            top: 2px;
            left: 2px;
            right: 2px;
            bottom: 2px;
            border: 2px solid #c59b27;
            pointer-events: none;
          }
          .modal-bismillah {
            max-width: 100px;
            width: 100%;
            height: auto;
          }
          .modal-quran {
            font-family: "Cinzel", serif;
            font-size: 5.5px;
            letter-spacing: 0.8px;
            font-weight: 600;
          }
          .modal-quran-ref {
            font-family: "Cinzel", serif;
            font-size: 5px;
            letter-spacing: 0.6px;
            font-weight: 600;
          }
          .modal-invite-text {
            font-family: "Cinzel", serif;
            font-size: 5.5px;
            letter-spacing: 0.8px;
            line-height: 1.5;
            max-width: 220px;
            font-weight: 600;
          }
          .modal-name {
            font-family: "Alex Brush", cursive;
            font-size: 28px;
            line-height: 1.05;
            text-transform: capitalize;
          }
          .modal-ampersand {
            font-family: "Alex Brush", cursive;
            font-size: 18px;
            margin: 1px 0;
            display: block;
          }
          .modal-day-name {
            font-family: "Cinzel", serif;
            font-size: 6.5px;
            letter-spacing: 1.5px;
            font-weight: 600;
          }
          .modal-date-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          }
          .modal-date-block {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 55px;
          }
          .modal-date-block span {
            font-family: "Cinzel", serif;
            font-size: 6.5px;
            letter-spacing: 1.5px;
            font-weight: 600;
            padding: 1px 0;
          }
          .modal-date-line {
            width: 100%;
            height: 1px;
            background-color: #c59b27;
          }
          .modal-day-number {
            font-family: "Playfair Display", serif;
            font-size: 24px;
            font-weight: 400;
            line-height: 1;
          }
          .modal-guest-arrival {
            font-family: "Cinzel", serif;
            font-size: 5.5px;
            letter-spacing: 1px;
            font-weight: 600;
          }
          .modal-venue-name {
            font-family: "Alex Brush", cursive;
            font-size: 16px;
            margin-bottom: 1px;
          }
          .modal-venue-address {
            font-family: "Playfair Display", serif;
            font-style: italic;
            font-size: 7px;
            letter-spacing: 0.3px;
            line-height: 1.2;
          }
          .modal-guest-label {
            font-family: "Cinzel", serif;
            font-size: 5px;
            letter-spacing: 1px;
            font-weight: 600;
          }
          .modal-guest-name {
            font-family: "Alex Brush", cursive;
            font-size: 16px;
          }
        `}</style>

        <div className="px-4 pt-4 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-fg-muted">Invitation preview</p>
          <p className="mt-1 text-xs text-fg-muted">
            To change field names (names, venue, dress code, message), edit them in{" "}
            <a href={`/events/${event?.id}/settings`} className="font-medium text-primary hover:text-primary-hover hover:underline">
              Settings
            </a>
            .
          </p>
        </div>

        {/* Gold Card Preview */}
        <div className="p-4">
          <div className="modal-card">
            <div className="modal-card-inner">
              {/* Header Image & Verse */}
              <div>
                {bismillahImageUrl && (
                  <div className="mb-1 w-full flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={bismillahImageUrl} alt="bismillah" className="modal-bismillah" />
                  </div>
                )}
                <div className="modal-quran modal-gold-text">
                  -IN THE NAME OF ALLAH, THE MOST BENEFICENT AND THE MOST MERCIFUL
                </div>
                <br />
                <div className="modal-quran modal-gold-text">{quranVerse}</div>
                <div className="modal-quran-ref modal-gold-text">{quranReference}</div>
              </div>

              {/* Invitation Text */}
              <div className="modal-invite-text modal-gold-text">{invitationMessage}</div>

              {/* Couple Names */}
              <div>
                <div className="modal-name modal-gold-text">{brideName}</div>
                <span className="modal-ampersand modal-gold-text">&</span>
                <div className="modal-name modal-gold-text">{groomName}</div>
              </div>

              {/* Date Section */}
              <div className="modal-gold-text">
                <div className="modal-day-name">{dayName}</div>
                <div className="modal-date-row">
                  <div className="modal-date-block">
                    <div className="modal-date-line" />
                    <span>{month}</span>
                    <div className="modal-date-line" />
                  </div>
                  <div className="modal-day-number">{dayNumber}</div>
                  <div className="modal-date-block">
                    <div className="modal-date-line" />
                    <span>{year}</span>
                    <div className="modal-date-line" />
                  </div>
                </div>
                {guestArrivalTime && (
                  <div className="modal-guest-arrival">GUEST ARRIVAL {guestArrivalTime}</div>
                )}
              </div>

              {/* Venue Section */}
              <div>
                <div className="modal-venue-name modal-gold-text">{venue}</div>
                {venueAddress && (
                  <div className="modal-venue-address modal-gold-text">{venueAddress}</div>
                )}
                {dressCode && (
                  <div className="modal-guest-arrival modal-gold-text" style={{ marginTop: 3 }}>
                    DRESS CODE: {dressCode}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Guest Name */}
          {guest && (
            <div className="mt-3 text-center">
              <div className="modal-guest-label modal-gold-text">PREPARED FOR</div>
              <div className="modal-guest-name modal-gold-text">{guest.fullName}</div>
            </div>
          )}
        </div>

        <ModalBody className="space-y-3 px-4 pb-4">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2/60 p-2 pl-3">
            <p className="min-w-0 flex-1 truncate text-xs text-fg-muted">{inviteUrl || "No invitation link yet"}</p>
            <Button size="sm" variant={copied ? "secondary" : "outline"} onClick={copyLink} className="shrink-0" disabled={!inviteUrl}>
              {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

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

          <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
            <Send className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-fg-secondary">
              Send this card to <strong>{guest?.fullName}</strong> to invite them to the event.
            </p>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
