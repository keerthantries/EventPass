"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiClientError } from "@/lib/api";
import { useCreateGuest, useUpdateGuest, useCategories } from "@/hooks/queries";
import type { Guest } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  category: z.string().optional(),
  side: z.string().optional(),
  isVip: z.boolean().optional(),
  isImmediateFamily: z.boolean().optional(),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface GuestFormProps {
  eventId: string;
  mode: "create" | "edit";
  guest?: Guest;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function GuestForm({ eventId, mode, guest, onSuccess, onCancel }: GuestFormProps) {
  const { toast } = useToast();
  const { data: categories } = useCategories(eventId);
  const createMutation = useCreateGuest(eventId);
  const updateMutation = useUpdateGuest(eventId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: guest?.firstName ?? guest?.fullName?.split(" ")[0] ?? "",
      lastName: guest?.lastName ?? guest?.fullName?.split(" ").slice(1).join(" ") ?? "",
      email: guest?.email ?? "",
      phone: guest?.phone ?? "",
      category: guest?.categoryId ?? "",
      side: guest?.side ?? "",
      isVip: guest?.isVip ?? false,
      isImmediateFamily: guest?.isImmediateFamily ?? false,
      notes: guest?.notes ?? "",
    },
  });

  const category = watch("category");
  const side = watch("side");

  const onSubmit = async (values: FormValues) => {
    const payload: Record<string, unknown> = {
      firstName: values.firstName,
      lastName: values.lastName,
      fullName: `${values.firstName} ${values.lastName}`,
      email: values.email || undefined,
      phone: values.phone || undefined,
      category: values.category && values.category !== "none" ? values.category : undefined,
      side: values.side && values.side !== "none" ? values.side : undefined,
      isVip: values.isVip || false,
      isImmediateFamily: values.isImmediateFamily || false,
      notes: values.notes || undefined,
    };
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(payload);
        toast({ title: "Guest added", variant: "success" });
      } else {
        await updateMutation.mutateAsync({ id: guest!._id, payload });
        toast({ title: "Guest updated", variant: "success" });
      }
      onSuccess?.();
    } catch (err) {
      toast({
        title: "Could not save guest",
        description: err instanceof ApiClientError ? err.message : "Please try again.",
        variant: "error",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">
            First name <span className="text-danger">*</span>
          </Label>
          <Input id="firstName" placeholder="Ikram" {...register("firstName")} />
          {errors.firstName ? <p className="text-xs text-danger">{errors.firstName.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">
            Last name <span className="text-danger">*</span>
          </Label>
          <Input id="lastName" placeholder="Halane" {...register("lastName")} />
          {errors.lastName ? <p className="text-xs text-danger">{errors.lastName.message}</p> : null}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">
            Email <span className="font-normal text-fg-muted">(optional, shared per family)</span>
          </Label>
          <Input id="email" type="email" placeholder="guest@example.com" {...register("email")} />
          {errors.email ? <p className="text-xs text-danger">{errors.email.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">
            Phone <span className="font-normal text-fg-muted">(optional)</span>
          </Label>
          <Input id="phone" placeholder="+1 555-123-4567" {...register("phone")} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>
            Category <span className="font-normal text-fg-muted">(optional)</span>
          </Label>
          <Select value={category} onValueChange={(v) => setValue("category", v)}>
            <SelectTrigger>
              <SelectValue placeholder="No category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No category</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>
            Side <span className="font-normal text-fg-muted">(optional)</span>
          </Label>
          <Select value={side} onValueChange={(v) => setValue("side", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select side" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not specified</SelectItem>
              <SelectItem value="Bride">Bride</SelectItem>
              <SelectItem value="Groom">Groom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-fg-secondary">
          <Switch
            checked={watch("isVip")}
            onCheckedChange={(v) => setValue("isVip", v)}
          />
          VIP guest
        </label>
        <label className="flex items-center gap-2 text-sm text-fg-secondary">
          <Switch
            checked={watch("isImmediateFamily")}
            onCheckedChange={(v) => setValue("isImmediateFamily", v)}
          />
          Immediate family
        </label>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">
          Notes <span className="font-normal text-fg-muted">(optional)</span>
        </Label>
        <Textarea id="notes" rows={2} placeholder="Internal notes (not visible to guests)" {...register("notes")} />
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" loading={isSubmitting || createMutation.isPending || updateMutation.isPending}>
          {mode === "create" ? "Add guest" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
