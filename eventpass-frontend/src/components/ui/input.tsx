import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-md border border-border bg-surface px-3 text-base text-fg placeholder:text-fg-muted sm:h-9 sm:text-sm",
        "transition-colors duration-150 focus:border-border-strong focus:outline-none focus:ring-2 focus:ring-ring/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
