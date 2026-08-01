"use client";

import * as React from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchInput } from "@/components/ui/search-input";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { PaginationMeta } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  accessor?: (row: T) => React.ReactNode;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortKey?: string;
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
  primary?: boolean;
  hideOnMobile?: boolean;
}

export interface RowAction<T> {
  label: React.ReactNode;
  onClick: (row: T) => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  sort?: string;
  onSortChange?: (sort: string) => void;
  search?: string;
  onSearchChange?: (q: string) => void;
  searchPlaceholder?: string;
  toolbar?: React.ReactNode;
  rowActions?: (row: T) => RowAction<T>[];
  selected?: string[];
  onSelectionChange?: (ids: string[]) => void;
  bulkBar?: React.ReactNode;
  empty?: { title: string; description?: string };
  loading?: boolean;
  titleAccessor?: (row: T) => React.ReactNode;
  subtitleAccessor?: (row: T) => React.ReactNode;
}

function SortIndicator({ active, direction }: { active: boolean; direction: "asc" | "desc" }) {
  if (!active) return <ChevronsUpDown className="size-3.5 text-fg-muted" />;
  return direction === "asc" ? (
    <ChevronUp className="size-3.5 text-primary" />
  ) : (
    <ChevronDown className="size-3.5 text-primary" />
  );
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  meta,
  onPageChange,
  sort,
  onSortChange,
  search,
  onSearchChange,
  searchPlaceholder,
  toolbar,
  rowActions,
  selected,
  onSelectionChange,
  bulkBar,
  empty,
  loading,
  titleAccessor,
  subtitleAccessor,
}: DataTableProps<T>) {
  const visibleColumns = React.useMemo(
    () => columns.filter((c) => !c.hideOnMobile),
    [columns]
  );

  const sortKey = sort?.replace(/^-/, "") ?? "";
  const sortDir: "asc" | "desc" = sort?.startsWith("-") ? "desc" : "asc";

  const handleSort = (key: string) => {
    if (!onSortChange) return;
    if (sortKey === key) {
      onSortChange(sortDir === "asc" ? `-${key}` : key);
    } else {
      onSortChange(key);
    }
  };

  const allSelected =
    data.length > 0 && selected && selected.length === data.length && data.every((r) => selected.includes(getRowId(r)));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) onSelectionChange([]);
    else onSelectionChange(data.map((r) => getRowId(r)));
  };

  const toggleRow = (id: string) => {
    if (!onSelectionChange) return;
    if (selected?.includes(id)) onSelectionChange(selected.filter((x) => x !== id));
    else onSelectionChange([...(selected ?? []), id]);
  };

  const renderCell = (row: T, col: DataTableColumn<T>) => {
    if (col.cell) return col.cell(row);
    if (col.accessor) return col.accessor(row);
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-full max-w-xs" />
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface">
        {(onSearchChange || toolbar) && (
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
            {onSearchChange ? (
              <SearchInput value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder={searchPlaceholder} />
            ) : null}
            {toolbar ? <div className="sm:ml-auto">{toolbar}</div> : null}
          </div>
        )}
        <EmptyState title={empty?.title ?? "No results"} description={empty?.description} />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface">
      {(onSearchChange || toolbar || bulkBar) && (
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {onSearchChange ? (
              <SearchInput value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder={searchPlaceholder} />
            ) : null}
            {toolbar ? <div className="flex flex-wrap items-center gap-2">{toolbar}</div> : null}
          </div>
          {selected && selected.length > 0 && bulkBar ? (
            <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs text-fg">
              {selected.length} selected
              {bulkBar}
            </div>
          ) : null}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-fg-muted">
              {onSelectionChange ? (
                <th className="w-10 px-4 py-3">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                </th>
              ) : null}
              {visibleColumns.map((col) => (
                <th key={col.key} className={cn("px-4 py-3 font-medium", col.headerClassName)}>
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.sortKey ?? col.key)}
                      className="inline-flex items-center gap-1 transition-colors hover:text-fg"
                    >
                      {col.header}
                      <SortIndicator active={sortKey === (col.sortKey ?? col.key)} direction={sortDir} />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
              {rowActions ? <th className="w-12 px-4 py-3" /> : null}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const id = getRowId(row);
              return (
                <tr key={id} className="border-b border-border last:border-0 transition-colors hover:bg-surface-2/50">
                  {onSelectionChange ? (
                    <td className="px-4 py-3">
                      <Checkbox checked={selected?.includes(id)} onCheckedChange={() => toggleRow(id)} aria-label="Select row" />
                    </td>
                  ) : null}
                  {visibleColumns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3 text-fg", col.cellClassName)}>
                      {renderCell(row, col)}
                    </td>
                  ))}
                  {rowActions ? (
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex size-8 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
                            aria-label="Row actions"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {rowActions(row).map((a, i) => (
                            <DropdownMenuItem
                              key={i}
                              onClick={() => a.onClick(row)}
                              disabled={a.disabled}
                              className={cn(a.destructive && "text-danger focus:bg-danger/10")}
                            >
                              {a.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-border md:hidden">
        {data.map((row) => {
          const id = getRowId(row);
          return (
            <div key={id} className="flex items-start gap-3 p-4">
              {onSelectionChange ? (
                <Checkbox checked={selected?.includes(id)} onCheckedChange={() => toggleRow(id)} className="mt-1" aria-label="Select row" />
              ) : null}
              <div className="min-w-0 flex-1 space-y-2">
                {titleAccessor ? (
                  <div className="text-sm font-medium text-fg">{titleAccessor(row)}</div>
                ) : null}
                {subtitleAccessor ? <div className="text-xs text-fg-muted">{subtitleAccessor(row)}</div> : null}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {visibleColumns.map((col) => (
                    <div key={col.key} className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wide text-fg-muted">{col.header}</div>
                      <div className="truncate text-xs text-fg-secondary">{renderCell(row, col)}</div>
                    </div>
                  ))}
                </div>
              </div>
              {rowActions ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
                      aria-label="Row actions"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {rowActions(row).map((a, i) => (
                      <DropdownMenuItem key={i} onClick={() => a.onClick(row)} className={cn(a.destructive && "text-danger")}>
                        {a.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          );
        })}
      </div>

      {onPageChange && meta ? (
        <div className="border-t border-border p-4">
          <Pagination meta={meta} onPageChange={onPageChange} />
        </div>
      ) : null}
    </div>
  );
}
