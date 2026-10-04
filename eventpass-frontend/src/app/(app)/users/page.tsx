"use client";

import { useState } from "react";
import { useUsers } from "@/hooks/queries";
import { useDebounce } from "@/hooks/use-debounce";
import type { AdminUser, UserRole } from "@/lib/types";
import { DataTable, type DataTableColumn } from "@/components/ui/datatable";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { RequireRole } from "@/components/ui/require-role";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/utils";

const roleVariant: Record<UserRole, "neutral" | "success" | "primary" | "secondary"> = {
  super_admin: "primary",
  organizer: "success",
  security: "secondary",
};

const roleLabel: Record<UserRole, string> = {
  super_admin: "Admin",
  organizer: "Organizer",
  security: "Security",
};

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const debouncedSearch = useDebounce(search, 300);

  const params: Record<string, string> = { page: String(page), limit: "20" };
  if (role !== "all") params.role = role;
  if (debouncedSearch) params.q = debouncedSearch;

  const { data, isLoading, isError, error, refetch } = useUsers(params);

  const columns: DataTableColumn<AdminUser>[] = [
    {
      key: "name",
      header: "User",
      primary: true,
      cell: (u) => (
        <div className="min-w-0">
          <p className="font-medium text-fg">{u.name}</p>
          <p className="text-xs text-fg-muted">{u.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (u) => <Badge variant={roleVariant[u.role] ?? "neutral"}>{roleLabel[u.role] ?? u.role}</Badge>,
    },
    {
      key: "organizerName",
      header: "Organizer",
      hideOnMobile: true,
      cell: (u) => <span className="text-fg-secondary">{u.organizerName ?? "N/A"}</span>,
    },
    {
      key: "isActive",
      header: "Status",
      cell: (u) =>
        u.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>,
    },
    {
      key: "createdAt",
      header: "Joined",
      hideOnMobile: true,
      cell: (u) => <span className="text-fg-secondary">{formatDateTime(u.createdAt)}</span>,
    },
  ];

  return (
    <RequireRole roles={["super_admin"]}>
      <div>
        <PageHeader
          title="Users"
          description="All organizer, security, and admin accounts on the platform."
        />
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          getRowId={(u) => u.id}
          meta={data?.meta}
          onPageChange={setPage}
          search={search}
          onSearchChange={(q) => {
            setSearch(q);
            setPage(1);
          }}
          searchPlaceholder="Search name or email…"
          loading={isLoading}
          empty={{ title: "No users found", description: "Try a different search or role filter." }}
          toolbar={
            <div className="w-full sm:w-40">
              <Select
                value={role}
                onValueChange={(v) => {
                  setRole(v);
                  setPage(1);
                }}
              >
                <SelectTrigger aria-label="Filter by role">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="super_admin">Admin</SelectItem>
                  <SelectItem value="organizer">Organizer</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
        {isError ? (
          <p className="mt-3 text-sm text-danger">
            {(error as Error)?.message}{" "}
            <button type="button" className="underline" onClick={() => refetch()}>
              Retry
            </button>
          </p>
        ) : null}
      </div>
    </RequireRole>
  );
}
