import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover shadow-sm",
  secondary: "bg-secondary text-secondary-fg hover:bg-secondary-hover border border-border",
  ghost: "text-fg-secondary hover:bg-surface-2 hover:text-fg",
  danger: "bg-danger/10 text-danger hover:bg-danger/20 border border-danger/30",
  outline: "border border-border-strong text-fg hover:bg-surface-2",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-xs gap-1.5 sm:h-8",
  md: "h-11 px-4 text-sm gap-2 sm:h-9",
  lg: "h-12 px-5 text-sm gap-2 sm:h-11",
  icon: "h-11 w-11 sm:h-9 sm:w-9",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, asChild, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors duration-150",
          "disabled:pointer-events-none disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        <Slottable>{children}</Slottable>
      </Comp>
    );
  }
);
Button.displayName = "Button";
