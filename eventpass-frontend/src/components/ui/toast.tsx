"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (toast: Omit<ToastData, "id">) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

let counter = 0;

const variantIcons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="size-4 text-success" />,
  error: <XCircle className="size-4 text-danger" />,
  warning: <AlertTriangle className="size-4 text-warning" />,
  info: <Info className="size-4 text-primary" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const toast = React.useCallback((t: Omit<ToastData, "id">) => {
    const id = `toast-${Date.now()}-${counter++}`;
    setToasts((prev) => [...prev, { ...t, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 5000);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            className="grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-lg border border-border bg-surface-2 p-3 shadow-popover animate-slide-in"
            onOpenChange={(open) => {
              if (!open) dismiss(t.id);
            }}
          >
            <div className="pt-0.5">{variantIcons[t.variant]}</div>
            <div className="min-w-0">
              <ToastPrimitive.Title className="text-sm font-medium text-fg">{t.title}</ToastPrimitive.Title>
              {t.description ? (
                <ToastPrimitive.Description className="mt-0.5 text-xs text-fg-secondary">{t.description}</ToastPrimitive.Description>
              ) : null}
            </div>
            <ToastPrimitive.Close className="rounded-md p-1 text-fg-muted transition-colors hover:text-fg">
              <X className="size-3.5" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[60] flex w-full max-w-sm flex-col gap-2 p-4 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
