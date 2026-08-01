"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiClientError } from "@/lib/api";
import { useCreateEvent, useUpdateEvent } from "@/hooks/queries";
import type { EventDetail } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(150),
    type: z.string().min(1, "Type is required").max(50),
    description: z.string().max(2000).optional().or(z.literal("")),
    venue: z.string().max(300).optional().or(z.literal("")),
    mapLink: z.string().url("Enter a valid URL").optional().or(z.literal("")),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional().or(z.literal("")),
    startTime: z.string().optional().or(z.literal("")),
    endTime: z.string().optional().or(z.literal("")),
    timezone: z.string().optional().or(z.literal("")),
  })
  .refine((d) => !d.endDate || d.endDate >= d.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

type FormValues = z.infer<typeof schema>;

function toFormValues(event?: EventDetail): FormValues {
  const iso = (d?: string) => (d ? d.slice(0, 10) : "");
  return {
    name: event?.name ?? "",
    type: event?.type ?? "",
    description: event?.description ?? "",
    venue: event?.venue ?? "",
    mapLink: event?.mapLink ?? "",
    startDate: iso(event?.startDate) || new Date().toISOString().slice(0, 10),
    endDate: iso(event?.endDate),
    startTime: event?.startTime ?? "",
    endTime: event?.endTime ?? "",
    timezone: event?.timezone ?? "Asia/Kolkata",
  };
}

interface EventFormProps {
  mode: "create" | "edit";
  event?: EventDetail;
  onSuccess?: (eventId: string) => void;
  onCancel?: () => void;
}

export function EventForm({ mode, event, onSuccess, onCancel }: EventFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent(event?.id ?? "");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(event),
  });

  const onSubmit = async (values: FormValues) => {
    const payload: Record<string, unknown> = {
      ...values,
      timezone: values.timezone || "Asia/Kolkata",
      description: values.description || undefined,
      venue: values.venue || undefined,
      mapLink: values.mapLink || undefined,
      endDate: values.endDate || undefined,
      startTime: values.startTime || undefined,
      endTime: values.endTime || undefined,
    };
    try {
      if (mode === "create") {
        const created = await createMutation.mutateAsync(payload);
        toast({ title: "Event created", variant: "success" });
        onSuccess?.(created.id);
        router.push(`/events/${created.id}`);
      } else {
        await updateMutation.mutateAsync(payload);
        toast({ title: "Event updated", variant: "success" });
        onSuccess?.(event!.id);
      }
    } catch (err) {
      toast({
        title: "Could not save event",
        description: err instanceof ApiClientError ? err.message : "Please try again.",
        variant: "error",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="name">Event name</Label>
          <Input id="name" placeholder="Annual Tech Summit 2026" {...register("name")} />
          {errors.name ? <p className="text-xs text-danger">{errors.name.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <Input id="type" placeholder="Conference" {...register("type")} />
          {errors.type ? <p className="text-xs text-danger">{errors.type.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="venue">Venue</Label>
          <Input id="venue" placeholder="City Convention Centre" {...register("venue")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" type="date" {...register("startDate")} />
          {errors.startDate ? <p className="text-xs text-danger">{errors.startDate.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" type="date" {...register("endDate")} />
          {errors.endDate ? <p className="text-xs text-danger">{errors.endDate.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startTime">Start time</Label>
          <Input id="startTime" type="time" {...register("startTime")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endTime">End time</Label>
          <Input id="endTime" type="time" {...register("endTime")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" {...register("timezone")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="mapLink">Map link</Label>
          <Input id="mapLink" type="url" placeholder="https://maps.app.goo.gl/..." {...register("mapLink")} />
          {errors.mapLink ? <p className="text-xs text-danger">{errors.mapLink.message}</p> : null}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={3} placeholder="A short description shown on the invitation..." {...register("description")} />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" loading={isSubmitting || createMutation.isPending || updateMutation.isPending}>
          {mode === "create" ? "Create event" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
