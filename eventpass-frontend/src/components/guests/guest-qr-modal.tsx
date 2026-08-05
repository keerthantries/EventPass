"use client";

import { useEffect, useState } from "react";
import { Share2, Download, QrCode, Loader2, RefreshCw } from "lucide-react";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { downloadFile, tokenStore, API_URL } from "@/lib/api";
import type { Guest } from "@/lib/types";

interface GuestQrModalProps {
  guest: Guest | null;
  eventName?: string;
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

export function GuestQrModal({ guest, eventName, open, onOpenChange, onShare, onRegenerate, regenerating }: GuestQrModalProps) {
  const downloadUrl = guest ? QR_FILE_URL.replace("${id}", guest._id) : "";
  const { src, loading, error } = useQrImage(guest?._id ?? "", open, downloadUrl);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-sm">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <QrCode className="size-4 text-primary" />
            Entry QR code
          </ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-5">
          {guest ? (
            <>
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-lg font-semibold text-fg">{guest.fullName}</p>
                {eventName ? <p className="text-xs text-fg-muted">{eventName}</p> : null}
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
                  <div className="rounded-xl border border-border bg-white p-2.5 shadow-lg">
                    <img src={src} alt={`Entry QR for ${guest.fullName}`} className="h-full w-full object-contain" />
                  </div>
                ) : null}
              </div>

              <p className="text-center text-xs text-fg-muted">Scan this code at the venue entrance to check in.</p>

              <div className="flex gap-2">
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
            </>
          ) : null}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}