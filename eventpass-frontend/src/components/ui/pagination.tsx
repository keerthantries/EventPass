import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaginationMeta } from "@/lib/types";

interface PaginationProps {
  meta?: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
}

function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

export function Pagination({ meta, onPageChange, className }: PaginationProps) {
  if (!meta || meta.totalPages <= 1) return null;
  const { page, totalPages } = meta;

  return (
    <nav className={cn("flex items-center justify-between gap-2", className)} aria-label="Pagination">
      <p className="text-xs text-fg-muted">
        {meta.total} results · page {page}/{totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex size-10 items-center justify-center rounded-md border border-border text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg disabled:pointer-events-none disabled:opacity-40 sm:size-8"
        >
          <ChevronLeft className="size-4" />
          <span className="sr-only">Previous</span>
        </button>
        <div className="hidden items-center gap-1 sm:flex">
          {pageWindow(page, totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`e-${i}`} className="flex size-8 items-center justify-center text-fg-muted">
                <MoreHorizontal className="size-4" />
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-md text-sm transition-colors",
                  p === page
                    ? "bg-primary text-primary-fg font-medium"
                    : "border border-border text-fg-secondary hover:bg-surface-2 hover:text-fg"
                )}
              >
                {p}
              </button>
            )
          )}
        </div>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex size-10 items-center justify-center rounded-md border border-border text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg disabled:pointer-events-none disabled:opacity-40 sm:size-8"
        >
          <ChevronRight className="size-4" />
          <span className="sr-only">Next</span>
        </button>
      </div>
    </nav>
  );
}
