"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, ScanLine, Zap, ZapOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QrScannerProps {
  onScan: (token: string) => void;
  disabled?: boolean;
}

const CONFIG = {
  fps: 10,
  qrbox: (width: number, height: number) => {
    const side = Math.max(120, Math.floor(Math.min(width, height) * 0.75));
    return { width: side, height: side };
  },
  aspectRatio: 1.0,
};

export function QrScanner({ onScan, disabled = false }: QrScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "eventpass-qr-reader";

  // Pause frame processing while a check-in is in flight to avoid a double-scan.
  useEffect(() => {
    if (disabled && scannerRef.current?.isScanning) scannerRef.current.pause();
    if (!disabled && scannerRef.current?.isScanning) scannerRef.current.resume();
  }, [disabled]);

  const startScanner = async () => {
    setStarting(true);
    setError(null);
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" },
        CONFIG,
        (decodedText) => {
          if (disabled) return;
          setTorchOn(false);
          onScan(decodedText.trim());
          // give a moment before scanning the next frame
          window.setTimeout(() => {
            if (scannerRef.current?.isScanning) scannerRef.current.resume();
          }, 900);
        },
        () => {}
      );
      setScanning(true);
    } catch (err) {
      setScanning(false);
      setError(err instanceof Error ? err.message : "Unable to access the camera.");
    } finally {
      setStarting(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // ignore
      }
    }
    scannerRef.current = null;
    setScanning(false);
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    try {
      await scannerRef.current?.applyVideoConstraints({
        advanced: [{ torch: !torchOn } as unknown as MediaTrackConstraintSet],
      });
      setTorchOn((t) => !t);
    } catch {
      // torch unsupported
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-black shadow-inner">
      <div className="relative aspect-square w-full">
        <div id={containerId} className="absolute inset-0 h-full w-full" />

        {/* Viewfinder overlay */}
        {scanning && (
          <div className="pointer-events-none absolute inset-0">
            {/* corner brackets */}
            <span className="absolute left-4 top-4 h-8 w-8 rounded-tl-lg border-l-2 border-t-2 border-primary" />
            <span className="absolute right-4 top-4 h-8 w-8 rounded-tr-lg border-r-2 border-t-2 border-primary" />
            <span className="absolute bottom-4 left-4 h-8 w-8 rounded-bl-lg border-b-2 border-l-2 border-primary" />
            <span className="absolute bottom-4 right-4 h-8 w-8 rounded-br-lg border-b-2 border-r-2 border-primary" />

            {/* scan line */}
            <div className="absolute inset-x-6 top-0 flex justify-center">
              <div className="h-px w-3/5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_2px_rgba(107,120,230,0.75)] animate-scanline" />
            </div>

            {/* live chip */}
            <div className="absolute left-1/2 top-5 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-black/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-fg backdrop-blur">
                <span className="size-1.5 animate-pulse-soft rounded-full bg-danger" />
                Live
              </span>
            </div>
          </div>
        )}

        {/* Idle overlay */}
        {!scanning && !error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-surface-2">
                <ScanLine className="size-8 text-primary" />
              </div>
              <span className="absolute -inset-2 -z-10 rounded-3xl bg-primary/10 blur-lg" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-fg">Ready to scan</p>
              <p className="mt-0.5 text-xs text-fg-muted">Align a guest QR code with the frame</p>
            </div>
          </div>
        ) : null}

        {/* Error overlay */}
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center">
            <Camera className="size-8 text-danger" />
            <p className="text-xs text-fg-secondary">{error}</p>
            <Button variant="secondary" size="sm" onClick={() => void startScanner()}>
              Try again
            </Button>
          </div>
        ) : null}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2 border-t border-border bg-surface px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-[11px] text-fg-muted">
          {scanning ? (
            <>
              <span className="size-1.5 rounded-full bg-success" />
              <span className="animate-pulse-soft">{disabled ? "Checking in…" : "Scanning"}</span>
            </>
          ) : (
            <span>Scanner idle</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {scanning ? (
            <>
              <Button variant="secondary" size="icon" className="size-10" onClick={toggleTorch} title="Toggle flashlight" aria-label="Toggle flashlight">
                <Zap className={cn("size-4", torchOn && "text-warning")} />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => void stopScanner()}>
                Stop
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => void startScanner()} loading={starting}>
              <Camera className="size-4" />
              Start camera
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}