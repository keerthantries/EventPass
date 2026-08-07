"use client";

import { useEffect, useState } from "react";
import { Share2, Download, QrCode, Loader2, RefreshCw, Sparkles, Ticket } from "lucide-react";
import { Modal, ModalContent, ModalTitle, ModalBody } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { downloadFile, tokenStore, API_URL } from "@/lib/api";
import type { Guest, EventDetail } from "@/lib/types";

interface GuestQrModalProps {
  guest: Guest | null;
  event?: EventDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare: (guest: Guest) => void;
  onRegenerate?: (guest: Guest) => void;
  regenerating?: boolean;
}

function useQrImage(guestId: string, open: boolean, downloadUrl: string) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API_URL}/guests/${guestId}/qr/download`, {
      headers: tokenStore.get() ? { Authorization: `Bearer ${tokenStore.get()}` } : undefined,
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not load QR code.");
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [guestId, open, downloadUrl]);

  return { src, loading, error };
}

const QR_FILE_URL = "/guests/${id}/qr/download";

export function GuestQrModal({ guest, event, open, onOpenChange, onShare, onRegenerate, regenerating }: GuestQrModalProps) {
  const downloadUrl = guest ? QR_FILE_URL.replace("${id}", guest._id) : "";
  const { src, loading, error } = useQrImage(guest?._id ?? "", open, downloadUrl);
  const primary = event?.branding?.primaryColor ?? "#6b78e6";
  const secondary = event?.branding?.secondaryColor ?? "#0f1020";

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="overflow-hidden p-0 sm:max-w-sm">
        <ModalBody className="p-0">
          {guest ? (
            <>
              {/* Ticket header */}
              <div
                className="relative px-5 pb-6 pt-5 text-center"
                style={{ background: `linear-gradient(160deg, ${secondary} 0%, #0a0a14 60%)` }}
              >
                <div
                  className="pointer-events-none absolute inset-0 animate-fade-in"
                  style={{ background: `radial-gradient(circle at 50% -20%, ${primary}66, transparent 60%)` }}
                />
                <div className="relative">
                  <div className="flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/70">
                    <Sparkles className="size-3" style={{ color: primary }} />
                    Entry pass
                  </div>
                  <h3 className="mt-2 truncate text-lg font-semibold tracking-tight text-white">{event?.name ?? "EventPass"}</h3>
                </div>
              </div>

              {/* Perforation divider */}
              <div className="relative h-0">
                <div className="absolute -top-1.5 left-0 z-10 size-3 -translate-y-1/2 rounded-full border border-border bg-surface" />
                <div className="absolute -top-1.5 right-0 z-10 size-3 -translate-y-1/2 rounded-full border border-border bg-surface" />
              </div>
              <div className="border-t-2 border-dashed border-border" />

              {/* Ticket body */}
              <div className="space-y-5 px-5 py-5 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Ticket className="size-4" style={{ color: primary }} />
                  <p className="text-sm font-medium text-fg">{guest.fullName}</p>
                </div>

                <div className="relative mx-auto aspect-square w-56">
                  {loading ? (
                    <div className="flex h-full items-center justify-center rounded-2xl border border-border bg-surface-2">
                      <Loader2 className="size-6 animate-spin text-primary" />
                    </div>
                  ) : error ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface-2 p-4 text-center">
                      <p className="text-xs text-fg-muted">{error}</p>
                      <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
                        Retry
                      </Button>
                    </div>
                  ) : src ? (
                    <div className="rounded-2xl border border-border bg-white p-2.5 shadow-lg">
                      <img src={src} alt={`Entry QR for ${guest.fullName}`} className="h-full w-full object-contain" />
                    </div>
                  ) : null}

                  {/* corner ornaments */}
                  {src ? (
                    <>
                      <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 rounded-tl-md border-l-2 border-t-2" style={{ borderColor: primary }} />
                      <span className="pointer-events-none absolute right-2 top-2 h-4 w-4 rounded-tr-md border-r-2 border-t-2" style={{ borderColor: primary }} />
                      <span className="pointer-events-none absolute bottom-2 left-2 h-4 w-4 rounded-bl-md border-b-2 border-l-2" style={{ borderColor: primary }} />
                      <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 rounded-br-md border-b-2 border-r-2" style={{ borderColor: primary }} />
                    </>
                  ) : null}
                </div>

                <p className="text-xs text-fg-muted">Show this code at the venue entrance to check in.</p>

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => downloadFile(downloadUrl, `${guest.fullName.replace(/\s+/g, "_")}-qr.png`)}
                  >
                    <Download className="size-4" />
                    Download
                  </Button>
                  <Button className="flex-1" onClick={() => onShare(guest)}>
                    <Share2 className="size-4" />
                    Share
                  </Button>
                </div>

                {onRegenerate ? (
                  <Button variant="ghost" size="sm" className="mx-auto" onClick={() => onRegenerate(guest)} loading={regenerating}>
                    <RefreshCw className="size-3.5" />
                    Regenerate QR
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}