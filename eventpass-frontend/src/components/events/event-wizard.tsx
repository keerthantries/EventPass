"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  MailCheck,
  MapPin,
  PenLine,
  QrCode,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ApiClientError } from "@/lib/api";
import { useCreateEvent } from "@/hooks/queries";
import type { EventModules, RsvpMode, WorkflowKey, QrTiming } from "@/lib/types";
import { EVENT_TYPES, TIMEZONES } from "@/lib/event-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "Basics", description: "Name, date and venue" },
  { title: "Guest experience", description: "How guests participate" },
  { title: "Review", description: "Confirm and create" },
];

const WORKFLOWS: { value: WorkflowKey; title: string; description: string; icon: React.ElementType }[] = [
  {
    value: "add_qr_checkin",
    title: "QR check-in",
    description: "Add guests, give them a QR pass, scan it at the door. No RSVP needed.",
    icon: QrCode,
  },
  {
    value: "invite_rsvp",
    title: "Invite & RSVP",
    description: "Share a link so guests can open the invite and confirm attendance.",
    icon: MailCheck,
  },
  {
    value: "invite_rsvp_form_qr",
    title: "RSVP, form & QR",
    description: "Guests RSVP, answer your custom questions, then get a QR pass.",
    icon: ClipboardList,
  },
  {
    value: "invite_form_approval_qr",
    title: "Apply & approval",
    description: "Guests apply through a form, you approve them, then a QR is issued.",
    icon: ShieldCheck,
  },
];

const MODULES: { key: keyof EventModules; label: string; description: string }[] = [
  { key: "invitation", label: "Invitations", description: "Share a link so guests can view the invite" },
  { key: "rsvp", label: "RSVP", description: "Guests confirm accept / decline" },
  { key: "dynamicForm", label: "Dynamic form", description: "Custom questions guests answer" },
  { key: "qrCheckin", label: "QR check-in", description: "Scan QR passes at the door" },
  { key: "csvImport", label: "CSV import", description: "Bulk import guests from a spreadsheet" },
  { key: "reports", label: "Reports", description: "Attendance and RSVP reports" },
];

const workflowRequires: Partial<Record<WorkflowKey, (keyof EventModules)[]>> = {
  invite_rsvp: ["rsvp"],
  invite_rsvp_form_qr: ["rsvp", "dynamicForm"],
  invite_form_approval_qr: ["dynamicForm"],
};

const workflowModulePreset: Record<WorkflowKey, EventModules> = {
  add_qr_checkin: { invitation: true, rsvp: false, dynamicForm: false, qrCheckin: true, csvImport: true, reports: true },
  invite_rsvp: { invitation: true, rsvp: true, dynamicForm: false, qrCheckin: true, csvImport: true, reports: true },
  invite_rsvp_form_qr: { invitation: true, rsvp: true, dynamicForm: true, qrCheckin: true, csvImport: true, reports: true },
  invite_form_approval_qr: { invitation: true, rsvp: false, dynamicForm: true, qrCheckin: true, csvImport: true, reports: true },
};

const workflowQrTiming: Record<WorkflowKey, QrTiming> = {
  add_qr_checkin: "on_add",
  invite_rsvp: "on_rsvp_accept",
  invite_rsvp_form_qr: "on_rsvp_accept",
  invite_form_approval_qr: "on_approval",
};

const workflowQrTimings: Record<WorkflowKey, QrTiming[]> = {
  add_qr_checkin: ["on_add"],
  invite_rsvp: ["on_rsvp_accept", "on_add"],
  invite_rsvp_form_qr: ["on_rsvp_accept"],
  invite_form_approval_qr: ["on_approval"],
};

const RSVP_MODES: { value: RsvpMode; label: string }[] = [
  { value: "accept_only", label: "Accept only" },
  { value: "accept_decline", label: "Accept / decline" },
  { value: "accept_decline_maybe", label: "Accept / decline / maybe" },
];

const QR_TIMINGS: { value: QrTiming; label: string }[] = [
  { value: "on_add", label: "When a guest is added" },
  { value: "on_rsvp_accept", label: "When RSVP is accepted" },
  { value: "on_approval", label: "When approved" },
];

const PUBLISH_OPTIONS = [
  {
    value: "draft",
    title: "Save as draft",
    description: "Create the event now, publish later once everything is set up.",
    icon: PenLine,
  },
  {
    value: "published",
    title: "Create & publish",
    description: "Make it live immediately so you can invite guests right away.",
    icon: Rocket,
  },
] as const;

const wizardSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(150, "Keep the name under 150 characters"),
  type: z.string().trim().max(50).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  venue: z.string().max(300).optional().or(z.literal("")),
  mapLink: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  startTime: z.string().optional().or(z.literal("")),
  endTime: z.string().optional().or(z.literal("")),
  timezone: z.string().optional().or(z.literal("")),
  workflow: z.enum(["add_qr_checkin", "invite_rsvp", "invite_rsvp_form_qr", "invite_form_approval_qr"]),
  rsvpMode: z.enum(["disabled", "accept_only", "accept_decline", "accept_decline_maybe"]),
  qrGenerationTiming: z.enum(["on_add", "on_rsvp_accept", "on_approval"]),
  requiresApproval: z.boolean(),
  rsvpDeadline: z.string().optional().or(z.literal("")),
  modules: z.object({
    invitation: z.boolean(),
    rsvp: z.boolean(),
    dynamicForm: z.boolean(),
    qrCheckin: z.boolean(),
    csvImport: z.boolean(),
    reports: z.boolean(),
  }),
  publish: z.enum(["draft", "published"]),
});

type WizardValues = z.infer<typeof wizardSchema>;

const BASICS_FIELDS: FieldPath<WizardValues>[] = [
  "name",
  "type",
  "description",
  "venue",
  "mapLink",
  "startDate",
  "endDate",
  "startTime",
  "endTime",
  "timezone",
];

function defaultValues(): WizardValues {
  return {
    name: "",
    type: "",
    description: "",
    venue: "",
    mapLink: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    timezone: "America/New_York",
    workflow: "add_qr_checkin",
    rsvpMode: "accept_decline",
    qrGenerationTiming: "on_add",
    requiresApproval: false,
    rsvpDeadline: "",
    modules: { ...workflowModulePreset.add_qr_checkin },
    publish: "draft",
  };
}

export function EventWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateEvent();

  const {
    register,
    handleSubmit,
    control,
    trigger,
    setValue,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: defaultValues(),
  });

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const workflow = useWatch({ control, name: "workflow" });
  const modules = useWatch({ control, name: "modules" });
  const publish = useWatch({ control, name: "publish" });
  const name = useWatch({ control, name: "name" });
  const type = useWatch({ control, name: "type" });
  const venue = useWatch({ control, name: "venue" });
  const timezone = useWatch({ control, name: "timezone" });
  const qrGenerationTiming = useWatch({ control, name: "qrGenerationTiming" });
  const rsvpEnabled = modules.rsvp;

  const selectWorkflow = (w: WorkflowKey) => {
    setValue("workflow", w);
    setValue("modules", { ...workflowModulePreset[w] });
    setValue("qrGenerationTiming", workflowQrTiming[w]);
    setValue("requiresApproval", w === "invite_form_approval_qr");
  };

  const goNext = async () => {
    if (step === 0) {
      const ok = await trigger(BASICS_FIELDS);
      if (!ok) return;
      const v = getValues();
      if (v.endDate && v.startDate && v.endDate < v.startDate) {
        setError("endDate", { type: "manual", message: "End date must be on or after the start date" });
        return;
      }
      const sameDay = !v.endDate || v.endDate === v.startDate;
      if (sameDay && v.endTime && v.startTime && v.endTime < v.startTime) {
        setError("endTime", { type: "manual", message: "End time must be after the start time" });
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (values: WizardValues) => {
    if (submitted) return;
    setSubmitted(true);
    const payload = {
      name: values.name.trim(),
      type: (values.type ?? "").trim() || undefined,
      description: values.description || undefined,
      venue: values.venue || undefined,
      mapLink: values.mapLink || undefined,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      startTime: values.startTime || undefined,
      endTime: values.endTime || undefined,
      timezone: values.timezone || "America/New_York",
      status: values.publish === "published" ? "published" : undefined,
      config: {
        workflow: values.workflow,
        modules: values.modules,
        rsvpMode: values.rsvpMode,
        rsvpDeadline: values.rsvpDeadline ? new Date(values.rsvpDeadline).toISOString() : undefined,
        qrGenerationTiming: values.qrGenerationTiming,
        requiresApproval: values.requiresApproval,
      },
    };
    try {
      const created = await createMutation.mutateAsync(payload);
      toast({
        title: "Event created",
        description: values.publish === "published" ? "Your event is now live." : "Draft saved — publish it when you're ready.",
        variant: "success",
      });
      router.push(`/events/${created.id}`);
      router.refresh();
    } catch (err) {
      setSubmitted(false);
      toast({
        title: "Could not create event",
        description: err instanceof ApiClientError ? err.message : "Please try again.",
        variant: "error",
      });
    }
  };

  const formatDateTime = () => {
    const v = getValues();
    const parts = [v.startDate];
    if (v.endDate) parts.push(v.endDate);
    return `${parts.join(" → ")}${v.startTime ? ` · ${v.startTime}${v.endTime ? `–${v.endTime}` : ""}` : ""}`;
  };

  const timezoneLabel = TIMEZONES.find((tz) => tz.value === timezone)?.label ?? timezone;
  const selectedWorkflow = WORKFLOWS.find((w) => w.value === workflow);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card className="mx-auto max-w-3xl">
        <CardContent className="p-6 sm:p-8">
          {/* Stepper */}
          <ol className="mb-8 flex items-center gap-0">
            {STEPS.map((s, i) => (
              <li key={s.title} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
                <button
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  className={cn("flex items-center gap-2", i < step && "cursor-pointer")}
                >
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                      i < step
                        ? "border-primary bg-primary text-primary-fg"
                        : i === step
                          ? "border-primary text-primary ring-2 ring-primary/30"
                          : "border-border bg-surface text-fg-muted"
                    )}
                  >
                    {i < step ? <Check className="size-4" /> : i + 1}
                  </span>
                  <span className="hidden sm:block">
                    <span className={cn("block text-sm font-medium", i === step ? "text-fg" : "text-fg-secondary")}>{s.title}</span>
                    <span className="hidden text-xs text-fg-muted md:block">{s.description}</span>
                  </span>
                </button>
                {i < STEPS.length - 1 ? <span className={cn("mx-3 h-px flex-1", i < step ? "bg-primary" : "bg-border")} /> : null}
              </li>
            ))}
          </ol>

          {/* Step 1 — Basics */}
          {step === 0 ? (
            <div className="space-y-5">
              <div>
                <h3 className="flex items-center gap-2 text-base font-semibold text-fg">
                  <Sparkles className="size-4 text-primary" />
                  Tell us about the event
                </h3>
                <p className="mt-0.5 text-sm text-fg-secondary">These are the basics guests see on the invitation.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="w-name">Event name</Label>
                <Input id="w-name" placeholder="Annual Tech Summit 2026" autoFocus {...register("name")} />
                {errors.name ? <p className="text-xs text-danger">{errors.name.message}</p> : null}
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="w-type">
                    Event type <span className="font-normal text-fg-muted">(optional)</span>
                  </Label>
                  <Input id="w-type" list="event-types" placeholder="Wedding, Conference, Party…" {...register("type")} />
                  <datalist id="event-types">
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                  {errors.type ? <p className="text-xs text-danger">{errors.type.message}</p> : null}
                  {/wed|marri|bride|groom|shaadi|ceremony|nuptial/i.test(type ?? "") ? (
                    <p className="text-xs text-primary">
                      Wedding event — we'll pre-add category groups like Bride's Guests and Groom's Guests.
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="w-venue">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      Venue <span className="font-normal text-fg-muted">(optional)</span>
                    </span>
                  </Label>
                  <Input id="w-venue" placeholder="City Convention Centre" {...register("venue")} />
                  {errors.venue ? <p className="text-xs text-danger">{errors.venue.message}</p> : null}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="w-startDate">
                    Start date <span className="font-normal text-fg-muted">(optional)</span>
                  </Label>
                  <Input id="w-startDate" type="date" {...register("startDate")} />
                  {errors.startDate ? <p className="text-xs text-danger">{errors.startDate.message}</p> : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="w-endDate">
                    End date <span className="font-normal text-fg-muted">(optional)</span>
                  </Label>
                  <Input id="w-endDate" type="date" {...register("endDate")} />
                  {errors.endDate ? <p className="text-xs text-danger">{errors.endDate.message}</p> : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="w-startTime">
                    Start time <span className="font-normal text-fg-muted">(optional)</span>
                  </Label>
                  <Input id="w-startTime" type="time" {...register("startTime")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="w-endTime">
                    End time <span className="font-normal text-fg-muted">(optional)</span>
                  </Label>
                  <Input id="w-endTime" type="time" {...register("endTime")} />
                  {errors.endTime ? <p className="text-xs text-danger">{errors.endTime.message}</p> : null}
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="w-timezone">
                    Timezone <span className="font-normal text-fg-muted">(optional)</span>
                  </Label>
                  <Controller
                    control={control}
                    name="timezone"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="w-timezone" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.timezone ? <p className="text-xs text-danger">{errors.timezone.message}</p> : null}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="w-mapLink">Map link</Label>
                <Input id="w-mapLink" type="url" placeholder="https://maps.app.goo.gl/..." {...register("mapLink")} />
                {errors.mapLink ? <p className="text-xs text-danger">{errors.mapLink.message}</p> : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="w-description">Description</Label>
                <Textarea id="w-description" rows={3} placeholder="A short description shown on the invitation..." {...register("description")} />
                {errors.description ? <p className="text-xs text-danger">{errors.description.message}</p> : null}
              </div>
            </div>
          ) : null}

          {/* Step 2 — Guest experience */}
          {step === 1 ? (
            <div className="space-y-7">
              <div>
                <h3 className="flex items-center gap-2 text-base font-semibold text-fg">
                  <ClipboardList className="size-4 text-primary" />
                  How do guests participate?
                </h3>
                <p className="mt-0.5 text-sm text-fg-secondary">
                  Pick the journey that fits your event. You can fine-tune this later in Settings.
                </p>
              </div>

              <Controller
                control={control}
                name="workflow"
                render={({ field }) => (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {WORKFLOWS.map((w) => {
                      const selected = field.value === w.value;
                      const Icon = w.icon;
                      return (
                        <button
                          key={w.value}
                          type="button"
                          onClick={() => selectWorkflow(w.value)}
                          aria-pressed={selected}
                          className={cn(
                            "relative flex flex-col items-start gap-3 rounded-lg border p-4 text-left transition-all",
                            selected
                              ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                              : "border-border bg-surface hover:border-border-strong"
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-9 items-center justify-center rounded-md border",
                              selected ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface-2 text-fg-secondary"
                            )}
                          >
                            <Icon className="size-4" />
                          </span>
                          <span className="pr-6">
                            <span className="block text-sm font-medium text-fg">{w.title}</span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-fg-secondary">{w.description}</span>
                          </span>
                          <span
                            className={cn(
                              "absolute right-3 top-3 flex size-4 items-center justify-center rounded-full border",
                              selected ? "border-primary bg-primary" : "border-border-strong"
                            )}
                          >
                            {selected ? <Check className="size-3 text-primary-fg" /> : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              />

              <div className="space-y-4 rounded-lg border border-border bg-surface p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {rsvpEnabled ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="w-rsvpMode">RSVP responses</Label>
                      <Controller
                        control={control}
                        name="rsvpMode"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="w-rsvpMode" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RSVP_MODES.map((r) => (
                                <SelectItem key={r.value} value={r.value}>
                                  {r.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  ) : null}
                  <div className="space-y-1.5">
                    <Label htmlFor="w-qrTiming">QR pass issued</Label>
                    <Controller
                      control={control}
                      name="qrGenerationTiming"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="w-qrTiming" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {workflowQrTimings[workflow].map((t) => (
                              <SelectItem key={t} value={t}>
                                {QR_TIMINGS.find((q) => q.value === t)?.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  {rsvpEnabled ? (
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="w-rsvpDeadline">RSVP deadline</Label>
                      <Controller
                        control={control}
                        name="rsvpDeadline"
                        render={({ field }) => (
                          <Input
                            id="w-rsvpDeadline"
                            type="datetime-local"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        )}
                      />
                    </div>
                  ) : null}
                  {workflow === "invite_form_approval_qr" ? (
                    <label className="flex items-center justify-between gap-4 text-sm text-fg-secondary sm:col-span-2">
                      <span>
                        Require approval before a QR is issued
                        <span className="block text-xs text-fg-muted">Guests apply first; you approve each one.</span>
                      </span>
                      <Controller
                        control={control}
                        name="requiresApproval"
                        render={({ field }) => (
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        )}
                      />
                    </label>
                  ) : null}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium text-fg">Modules</p>
                <div className="divide-y divide-border rounded-lg border border-border bg-surface">
                  {MODULES.map((m) => {
                    const required = (workflowRequires[workflow] ?? []).includes(m.key);
                    return (
                      <div key={m.key} className="flex items-center justify-between gap-4 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-fg">{m.label}</p>
                          <p className="text-xs text-fg-muted">{m.description}</p>
                        </div>
                        <Controller
                          control={control}
                          name="modules"
                          render={({ field }) => (
                            <Switch
                              checked={field.value[m.key]}
                              disabled={required}
                              onCheckedChange={(v) => field.onChange({ ...field.value, [m.key]: v })}
                            />
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-fg-muted">
                  Modules required by the chosen journey are locked on.
                </p>
              </div>
            </div>
          ) : null}

          {/* Step 3 — Review */}
          {step === 2 ? (
            <div className="space-y-7">
              <div>
                <h3 className="flex items-center gap-2 text-base font-semibold text-fg">
                  <Check className="size-4 text-primary" />
                  Review your event
                </h3>
                <p className="mt-0.5 text-sm text-fg-secondary">Check the details, then create the event.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Event details</p>
                  <div>
                    <p className="text-sm font-semibold text-fg">{name}</p>
                    <p className="text-xs text-fg-secondary">
                      {type}
                      {venue ? ` · ${venue}` : ""}
                    </p>
                  </div>
                  <p className="text-xs text-fg-secondary">{formatDateTime()}</p>
                  <p className="text-xs text-fg-secondary">{timezoneLabel}</p>
                </div>

                <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Guest journey</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {selectedWorkflow ? (
                      <Badge variant="primary">{selectedWorkflow.title}</Badge>
                    ) : null}
                    {Object.entries(modules)
                      .filter(([, on]) => on)
                      .map(([key]) => (
                        <Badge key={key}>{MODULES.find((m) => m.key === key)?.label}</Badge>
                      ))}
                  </div>
                  <p className="text-xs text-fg-secondary">
                    QR issued {QR_TIMINGS.find((t) => t.value === qrGenerationTiming)?.label.toLowerCase()}.
                    {rsvpEnabled ? " RSVP responses are collected." : ""}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium text-fg">Visibility</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Controller
                    control={control}
                    name="publish"
                    render={({ field }) => (
                      <>
                        {PUBLISH_OPTIONS.map((o) => {
                          const selected = field.value === o.value;
                          const Icon = o.icon;
                          return (
                            <button
                              key={o.value}
                              type="button"
                              onClick={() => field.onChange(o.value)}
                              aria-pressed={selected}
                              className={cn(
                                "flex items-start gap-3 rounded-lg border p-4 text-left transition-all",
                                selected ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border bg-surface hover:border-border-strong"
                              )}
                            >
                              <Icon className={cn("mt-0.5 size-5", selected ? "text-primary" : "text-fg-secondary")} />
                              <span>
                                <span className="block text-sm font-medium text-fg">{o.title}</span>
                                <span className="mt-0.5 block text-xs leading-relaxed text-fg-secondary">{o.description}</span>
                              </span>
                            </button>
                          );
                        })}
                      </>
                    )}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* Footer nav */}
          <div className="mt-8 flex items-center justify-between gap-2 border-t border-border pt-5">
            <Button type="button" variant="ghost" onClick={goBack} disabled={step === 0 || isSubmitting}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={goNext}>
                Continue
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button type="submit" loading={isSubmitting || submitted}>
                {publish === "published" ? (
                  <>
                    <Rocket className="size-4" />
                    Create & publish
                  </>
                ) : (
                  <>
                    <Check className="size-4" />
                    Create event
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
