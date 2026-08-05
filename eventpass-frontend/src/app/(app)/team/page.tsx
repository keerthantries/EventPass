"use client";

import { useState } from "react";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import {
  useTeam,
  useCreateSecurityStaff,
  useDeactivateSecurityStaff,
} from "@/hooks/queries";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiClientError } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
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
import { initials } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function TeamPage() {
  const { data, isLoading, isError, error, refetch } = useTeam();
  const createMutation = useCreateSecurityStaff();
  const deactivateMutation = useDeactivateSecurityStaff();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

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
    if (
      !window.confirm(
        `Deactivate ${name}? They will no longer be able to sign in.`,
      )
    )
      return;
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

  if (isLoading) return <PageSkeleton />;
  if (isError)
    return (
      <PageError
        message={(error as Error)?.message}
        onRetry={() => refetch()}
      />
    );

  return (
    <div>
      <PageHeader
        title="Team"
        description="Provision Security accounts that can scan guests at the door."
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Add security staff
          </Button>
        }
      />

      {!data || data.length === 0 ? (
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
              {data.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                      {initials(s.name)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-fg">{s.name}</p>
                      <p className="text-xs text-fg-muted">{s.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {s.isActive ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeactivate(s.id, s.name)}
                        aria-label={`Deactivate ${s.name}`}
                      >
                        <Trash2 className="size-4 text-danger" />
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Add security staff</ModalTitle>
            <ModalDescription>
              They can sign in and use the check-in console, but cannot modify
              guests.
            </ModalDescription>
          </ModalHeader>
          <ModalBody>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  placeholder="Michael Johnson"
                  {...register("name")}
                />
                {errors.name ? (
                  <p className="text-xs text-danger">{errors.name.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="michael@venue.com"
                  {...register("email")}
                />
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
                  <p className="text-xs text-danger">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isSubmitting || createMutation.isPending}
                >
                  Create staff
                </Button>
              </div>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
