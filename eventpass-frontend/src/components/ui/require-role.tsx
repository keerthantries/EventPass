"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldX } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface RequireRoleProps {
  roles: UserRole[];
  children: ReactNode;
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !roles.includes(user.role)) {
      router.replace("/events");
    }
  }, [loading, user, roles, router]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !roles.includes(user.role)) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-danger/10">
          <ShieldX className="size-6 text-danger" />
        </div>
        <p className="text-sm text-fg-secondary">You don&apos;t have permission to view this page.</p>
        <Button variant="secondary" size="sm" onClick={() => router.replace("/events")}>
          Back to events
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}