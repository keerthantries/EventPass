import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, value, onChange, ...props }, ref) => (
    <div className={cn("relative w-full max-w-xs", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
      <input
        ref={ref}
        value={value}
        onChange={onChange}
        className={cn(
          "h-9 w-full rounded-md border border-border bg-surface pl-9 pr-8 text-sm text-fg placeholder:text-fg-muted",
          "transition-colors focus:border-border-strong focus:outline-none focus:ring-2 focus:ring-ring/40"
        )}
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-fg-muted transition-colors hover:text-fg"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
);
SearchInput.displayName = "SearchInput";
