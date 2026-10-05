"use client";

import { useState } from "react";
import { Plus, Trash2, ShieldCheck, CalendarDays, Users2, Building2 } from "lucide-react";
import {
  useTeam,
  useTeamOverview,
  useCreateSecurityStaff,
  useDeactivateSecurityStaff,
} from "@/hooks/queries";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiClientError } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { RequireRole } from "@/components/ui/require-role";
import { PageSkeleton, PageError } from "@/components/ui/page-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
} from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/utils";
import type { SecurityStaff } from "@/lib/types";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

function StaffRow({
  s,
  onDeactivate,
  showOrganizer,
}: {
  s: SecurityStaff;
  onDeactivate?: (id: string, name: string) => void;
  showOrganizer?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
          {initials(s.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg">{s.name}</p>
          <p className="truncate text-xs text-fg-muted">
            {s.email}
            {showOrganizer && s.organizerName ? ` · ${s.organizerName}` : ""}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {s.isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        )}
        {onDeactivate && s.isActive ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDeactivate(s.id, s.name)}
            aria-label={`Deactivate ${s.name}`}
          >
            <Trash2 className="size-4 text-danger" />
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export default function TeamPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin";
  const canUseTeam = user?.role === "organizer" || user?.role === "super_admin";
  const teamQuery = useTeam(canUseTeam);
  const overviewQuery = useTeamOverview(isAdmin);
  const createMutation = useCreateSecurityStaff();
  const deactivateMutation = useDeactivateSecurityStaff();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const data = teamQuery.data;
  const overview = overviewQuery.data;
  const isLoading = isAdmin ? overviewQuery.isLoading : teamQuery.isLoading;
  const isError = isAdmin ? overviewQuery.isError : teamQuery.isError;
  const error = isAdmin ? overviewQuery.error : teamQuery.error;
  const refetch = isAdmin ? overviewQuery.refetch : teamQuery.refetch;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

const onSubmit = async (values: FormValues) => {
    try {
      await createMutation.mutateAsync(values);
      toast({ title: "Security staff created", variant: "success" });
      setOpen(false);
      reset();
    } catch (err) {
      toast({
        title: "Could not create staff",
        description: err instanceof ApiClientError ? err.message : "Try again",
        variant: "error",
      });
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!window.confirm(`Deactivate ${name}? They will no longer be able to sign in.`)) return;
    try {
      await deactivateMutation.mutateAsync(id);
      toast({ title: "Staff deactivated", variant: "success" });
    } catch (err) {
      toast({
        title: "Could not deactivate",
        description: (err as Error).message,
        variant: "error",
      });
    }
  };

  if (!canUseTeam) return <RequireRole roles={["organizer", "super_admin"]}><></></RequireRole>;
  if (isLoading) return <PageSkeleton />;
  if (isError)
    return (
      <PageError
        message={(error as Error)?.message}
        onRetry={() => refetch()}
      />
    );

  const adminEmpty = !overview || overview.length === 0;
  const organizerEmpty = !data || data.length === 0;

  return (
    <RequireRole roles={["organizer", "super_admin"]}>
      <div>
        <PageHeader
          title="Team"
          description={
            isAdmin
              ? "Security teams for every organizer and their events."
              : "Provision Security accounts that can scan guests at the door."
          }
          actions={
            !isAdmin ? (
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="size-4" />
                Add security staff
              </Button>
            ) : null
          }
        />

        {isAdmin ? (
          adminEmpty ? (
            <Card>
              <EmptyState
                icon={Building2}
                title="No organizers yet"
                description="Organizer accounts and their security teams will appear here."
              />
            </Card>
          ) : (
            <div className="space-y-6">
              {overview!.map((group) => (
                <Card key={group.organizer.id}>
                  <CardContent className="space-y-4 p-4 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                          {initials(group.organizer.name)}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-fg">{group.organizer.name}</p>
                          <p className="text-xs text-fg-muted">{group.organizer.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">
                          <CalendarDays className="size-3" />
                          {group.events.length} event{group.events.length === 1 ? "" : "s"}
                        </Badge>
                        <Badge variant="secondary">
                          <Users2 className="size-3" />
                          {group.staff.length} staff
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
                        Events
                      </p>
                      {group.events.length === 0 ? (
                        <p className="text-sm text-fg-muted">N/A</p>
                      ) : (
                        <ul className="flex flex-wrap gap-2">
                          {group.events.map((e) => (
                            <li key={e.id}>
                              <Badge variant="neutral">
                                {e.name}
                                <span className="text-fg-muted">· {e.status}</span>
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
                        Security team
                      </p>
                      {group.staff.length === 0 ? (
                        <p className="text-sm text-fg-muted">N/A</p>
                      ) : (
                        <ul className="divide-y divide-border rounded-md border border-border">
                          {group.staff.map((s) => (
                            <StaffRow key={s.id} s={s} onDeactivate={handleDeactivate} />
                          ))}
                        </ul>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : organizerEmpty ? (
          <Card>
            <EmptyState
              icon={ShieldCheck}
              title="No security staff yet"
              description="Create accounts for the team members who will manage check-in at the event."
            />
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {data!.map((s) => (
                  <StaffRow key={s.id} s={s} onDeactivate={handleDeactivate} />
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {!isAdmin ? (
          <Modal open={open} onOpenChange={setOpen}>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Add security staff</ModalTitle>
                <ModalDescription>
                  They can sign in and use the check-in console, but cannot modify guests.
                </ModalDescription>
              </ModalHeader>
              <ModalBody>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" placeholder="Michael Johnson" {...register("name")} />
                    {errors.name ? (
                      <p className="text-xs text-danger">{errors.name.message}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="michael@venue.com" {...register("email")} />
                    {errors.email ? (
                      <p className="text-xs text-danger">{errors.email.message}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="At least 8 characters"
                      {...register("password")}
                    />
                    {errors.password ? (
                      <p className="text-xs text-danger">{errors.password.message}</p>
                    ) : null}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={isSubmitting || createMutation.isPending}>
                      Create staff
                    </Button>
                  </div>
                </form>
              </ModalBody>
            </ModalContent>
          </Modal>
        ) : null}
      </div>
    </RequireRole>
  );
}
