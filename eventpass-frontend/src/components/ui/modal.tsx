import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Modal = DialogPrimitive.Root;
export const ModalTrigger = DialogPrimitive.Trigger;
export const ModalClose = DialogPrimitive.Close;

export const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 animate-fade-in" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 flex flex-col rounded-lg border border-border bg-surface shadow-modal animate-scale-in",
        "left-0 right-0 bottom-0 w-full max-h-[90dvh] rounded-b-none rounded-t-xl pb-[env(safe-area-inset-bottom)] sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-[calc(100vw-2rem)] sm:max-w-lg sm:max-h-[85dvh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-b-lg sm:rounded-t-lg sm:pb-0",
        className
      )}
      {...props}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      <DialogPrimitive.Close className="absolute right-3 top-3 rounded-md p-2 text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
        <X className="size-5" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
ModalContent.displayName = "ModalContent";

export const ModalHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1 border-b border-border p-4 pb-3", className)} {...props} />
  )
);
ModalHeader.displayName = "ModalHeader";

export const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("pr-8 text-base font-semibold text-fg", className)}
    {...props}
  />
));
ModalTitle.displayName = "ModalTitle";

export const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-fg-secondary", className)} {...props} />
));
ModalDescription.displayName = "ModalDescription";

export const ModalFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center justify-end gap-2 border-t border-border p-4", className)} {...props} />
  )
);
ModalFooter.displayName = "ModalFooter";

export const ModalBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-4", className)} {...props} />
);
ModalBody.displayName = "ModalBody";
