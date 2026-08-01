"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrScannerProps {
  onScan: (token: string) => void;
}

const CONFIG = {
  fps: 10,
  qrbox: { width: 220, height: 220 },
  aspectRatio: 1.2,
};

export function QrScanner({ onScan }: QrScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "eventpass-qr-reader";

  const startScanner = async () => {
    setError(null);
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" },
        CONFIG,
        (decodedText) => {
          onScan(decodedText.trim());
          // give a moment before scanning the next frame
          window.setTimeout(() => {
            if (scannerRef.current?.isScanning) scannerRef.current.resume();
          }, 800);
        },
        () => {}
      );
      setScanning(true);
    } catch (err) {
      setScanning(false);
      setError(err instanceof Error ? err.message : "Unable to access the camera.");
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
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-lg border border-border bg-black">
        <div id={containerId} className="h-72 w-full" />
        {!scanning && !error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-center">
            <Camera className="size-8 text-fg-muted" />
            <p className="text-sm text-fg-secondary">Camera is off</p>
          </div>
        ) : null}
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 p-4 text-center">
            <CameraOff className="size-8 text-danger" />
            <p className="text-xs text-fg-secondary">{error}</p>
          </div>
        ) : null}
      </div>

      <div className="flex gap-2">
        {!scanning ? (
          <Button onClick={startScanner} className="flex-1">
            <Camera className="size-4" />
            Start camera
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={stopScanner} className="flex-1">
              <RefreshCw className="size-4" />
              Stop
            </Button>
            <Button variant="secondary" onClick={toggleTorch} disabled={!scanning}>
              {torchOn ? "Torch on" : "Torch off"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
