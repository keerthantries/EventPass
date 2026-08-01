"use client";

import { ShieldCheck, User, CalendarDays } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";

const roleLabels: Record<string, string> = {
  super_admin: "Super admin",
  organizer: "Organizer",
  security: "Security staff",
};

export default function AccountSettingsPage() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader title="Settings" description="Your account details." />

      <div className="mx-auto max-w-xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Account information for {user?.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary">
                {user ? initials(user.name) : "?"}
              </span>
              <div>
                <p className="text-base font-medium text-fg">{user?.name}</p>
                <Badge variant="primary" className="mt-1">
                  <ShieldCheck className="size-3" />
                  {user ? roleLabels[user.role] ?? user.role : ""}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-border bg-surface-2 p-3">
                <p className="flex items-center gap-1.5 text-xs text-fg-muted">
                  <User className="size-3.5" />
                  Email
                </p>
                <p className="mt-1 text-sm text-fg">{user?.email}</p>
              </div>
              <div className="rounded-md border border-border bg-surface-2 p-3">
                <p className="flex items-center gap-1.5 text-xs text-fg-muted">
                  <CalendarDays className="size-3.5" />
                  Role
                </p>
                <p className="mt-1 text-sm text-fg">{user ? roleLabels[user.role] ?? user.role : ""}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
