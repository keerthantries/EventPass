"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Save } from "lucide-react";
import { useEvent, useUpdateEventConfig, useUpdateBranding } from "@/hooks/queries";
import { ApiClientError } from "@/lib/api";
import type { EventConfig, RsvpMode, WorkflowKey, QrTiming, EventModules } from "@/lib/types";
import { RequireRole } from "@/components/ui/require-role";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton, PageError } from "@/components/ui/page-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

const WORKFLOWS: { value: WorkflowKey; label: string }[] = [
  { value: "add_qr_checkin", label: "Add guest → QR check-in" },
  { value: "invite_rsvp", label: "Invite → RSVP" },
  { value: "invite_rsvp_form_qr", label: "Invite → RSVP → form → QR" },
  { value: "invite_form_approval_qr", label: "Invite → form → approval → QR" },
];

const RSVP_MODES: { value: RsvpMode; label: string }[] = [
  { value: "disabled", label: "Disabled" },
  { value: "accept_only", label: "Accept only" },
  { value: "accept_decline", label: "Accept / decline" },
  { value: "accept_decline_maybe", label: "Accept / decline / maybe" },
];

const QR_TIMINGS: { value: QrTiming; label: string }[] = [
  { value: "on_add", label: "When guest is added" },
  { value: "on_rsvp_accept", label: "When RSVP is accepted" },
  { value: "on_approval", label: "When approved" },
];

const MODULE_LABELS: { key: keyof EventModules; label: string; description: string }[] = [
  { key: "invitation", label: "Invitations", description: "Send invitation links to guests" },
  { key: "rsvp", label: "RSVP", description: "Collect accept / decline responses" },
  { key: "dynamicForm", label: "Dynamic form", description: "Custom questions after RSVP" },
  { key: "qrCheckin", label: "QR check-in", description: "Scan QR codes at the door" },
  { key: "csvImport", label: "CSV import", description: "Bulk import guests from CSV" },
  { key: "reports", label: "Reports", description: "Attendance and RSVP reports" },
];

const workflowRequires: Partial<Record<WorkflowKey, (keyof EventModules)[]>> = {
  invite_rsvp: ["rsvp"],
  invite_rsvp_form_qr: ["rsvp", "dynamicForm"],
  invite_form_approval_qr: ["dynamicForm"],
};

export default function EventSettingsPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  const { data: event, isLoading, isError, error, refetch } = useEvent(eventId);

  if (isLoading) return <PageSkeleton />;
  if (isError) return <PageError message={(error as Error)?.message} onRetry={() => refetch()} />;
  if (!event) return <PageSkeleton />;

  return (
    <RequireRole roles={["organizer", "super_admin"]}>
      <div>
        <PageHeader title="Settings" description="Event configuration and guest-facing branding." />
        <SettingsEditor eventId={eventId} event={event} />
      </div>
    </RequireRole>
  );
}

function SettingsEditor({ eventId, event }: { eventId: string; event: import("@/lib/types").EventDetail }) {
  const { toast } = useToast();
  const [config, setConfig] = useState<EventConfig>(() => event.config as EventConfig);
  const [primaryColor, setPrimaryColor] = useState(() => event.branding?.primaryColor ?? "#6b78e6");
  const [secondaryColor, setSecondaryColor] = useState(() => event.branding?.secondaryColor ?? "#2fb85e");

  const configMutation = useUpdateEventConfig(eventId);
  const brandingMutation = useUpdateBranding(eventId);

  const updateConfig = (fn: (c: EventConfig) => EventConfig) => {
    setConfig((c) => fn(c));
  };

  const setModule = (key: keyof EventModules, value: boolean) => {
    updateConfig((c) => ({ ...c, modules: { ...c.modules, [key]: value } }));
  };

  const saveConfig = async () => {
    try {
      await configMutation.mutateAsync({
        modules: config.modules,
        workflow: config.workflow,
        rsvpMode: config.rsvpMode,
        rsvpDeadline: config.rsvpDeadline ?? undefined,
        qrGenerationTiming: config.qrGenerationTiming,
        requiresApproval: config.requiresApproval,
      });
      toast({ title: "Configuration saved", variant: "success" });
    } catch (err) {
      toast({ title: "Could not save configuration", description: err instanceof ApiClientError ? err.message : "Try again", variant: "error" });
    }
  };

  const saveBranding = async () => {
    try {
      await brandingMutation.mutateAsync({ primaryColor, secondaryColor });
      toast({ title: "Branding saved", variant: "success" });
    } catch (err) {
      toast({ title: "Could not save branding", description: err instanceof ApiClientError ? err.message : "Try again", variant: "error" });
    }
  };

  const requiredModules = workflowRequires[config.workflow] ?? [];

  return (
    <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Modules</CardTitle>
            <CardDescription>Toggle the features available for this event.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {MODULE_LABELS.map((m) => {
              const required = requiredModules.includes(m.key);
              return (
                <div key={m.key} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-fg">{m.label}</p>
                    <p className="text-xs text-fg-muted">{m.description}</p>
                  </div>
                  <Switch
                    checked={config.modules[m.key]}
                    onCheckedChange={(v) => setModule(m.key, v)}
                    disabled={required}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow</CardTitle>
            <CardDescription>Choose how guests move through this event.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Workflow</Label>
              <Select
                value={config.workflow}
                onValueChange={(v) => updateConfig((c) => ({ ...c, workflow: v as WorkflowKey }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKFLOWS.map((w) => (
                    <SelectItem key={w.value} value={w.value}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>RSVP mode</Label>
                <Select
                  value={config.rsvpMode}
                  onValueChange={(v) => updateConfig((c) => ({ ...c, rsvpMode: v as RsvpMode }))}
                >
                  <SelectTrigger>
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
              </div>
              <div className="space-y-1.5">
                <Label>QR generation</Label>
                <Select
                  value={config.qrGenerationTiming}
                  onValueChange={(v) => updateConfig((c) => ({ ...c, qrGenerationTiming: v as QrTiming }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QR_TIMINGS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rsvpDeadline">RSVP deadline</Label>
              <Input
                id="rsvpDeadline"
                type="datetime-local"
                value={config.rsvpDeadline ? new Date(config.rsvpDeadline).toISOString().slice(0, 16) : ""}
                onChange={(e) =>
                  updateConfig((c) => ({ ...c, rsvpDeadline: e.target.value ? new Date(e.target.value).toISOString() : undefined }))
                }
              />
            </div>
            <label className="flex items-center justify-between gap-4 text-sm text-fg-secondary">
              <span>Require organizer approval before QR is issued</span>
              <Switch
                checked={config.requiresApproval}
                onCheckedChange={(v) => updateConfig((c) => ({ ...c, requiresApproval: v }))}
              />
            </label>
            <div className="flex justify-end">
              <Button onClick={saveConfig} loading={configMutation.isPending}>
                <Save className="size-4" />
                Save configuration
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Used only on the public invitation page guests see.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Primary color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-md border border-border bg-surface"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Secondary color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-md border border-border bg-surface"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={saveBranding} loading={brandingMutation.isPending}>
                <Save className="size-4" />
                Save branding
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
