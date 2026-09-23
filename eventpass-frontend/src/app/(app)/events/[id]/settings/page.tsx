"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Save, Heart } from "lucide-react";
import { useEvent, useUpdateEventConfig, useUpdateBranding } from "@/hooks/queries";
import { ApiClientError, apiRequest } from "@/lib/api";
import type { EventConfig, RsvpMode, WorkflowKey, QrTiming, EventModules } from "@/lib/types";
import { RequireRole } from "@/components/ui/require-role";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton, PageError } from "@/components/ui/page-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
        <PageHeader title="Settings" description="Event configuration, wedding details, and guest-facing branding." />
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

  // Wedding fields
  const [brideName, setBrideName] = useState(() => event.brideName ?? "");
  const [groomName, setGroomName] = useState(() => event.groomName ?? "");
  const [dressCode, setDressCode] = useState(() => event.dressCode ?? "");
  const [weddingWebsiteUrl, setWeddingWebsiteUrl] = useState(() => event.weddingWebsiteUrl ?? "");
  const [invitationMessage, setInvitationMessage] = useState(() => event.invitationMessage ?? "");
  const [venueAddress, setVenueAddress] = useState(() => event.venueAddress ?? "");
  const [guestArrivalTime, setGuestArrivalTime] = useState(() => event.guestArrivalTime ?? "");
  const [bismillahImageUrl, setBismillahImageUrl] = useState(() => event.bismillahImageUrl ?? "");
  const [quranVerse, setQuranVerse] = useState(() => event.quranVerse ?? "");
  const [quranReference, setQuranReference] = useState(() => event.quranReference ?? "");

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

  const saveWeddingDetails = async () => {
    try {
      await apiRequest(`/events/${eventId}`, {
        method: "PATCH",
        body: {
          brideName,
          groomName,
          dressCode,
          weddingWebsiteUrl,
          invitationMessage,
          venueAddress,
          guestArrivalTime,
          bismillahImageUrl,
          quranVerse,
          quranReference,
        },
      });
      toast({ title: "Wedding details saved", variant: "success" });
    } catch (err) {
      toast({ title: "Could not save wedding details", description: err instanceof ApiClientError ? err.message : "Try again", variant: "error" });
    }
  };

  const requiredModules = workflowRequires[config.workflow] ?? [];

  return (
    <div className="space-y-6">
        {/* Wedding Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="size-4 text-pink-500" />
              Wedding Details
            </CardTitle>
            <CardDescription>Configure the wedding invitation appearance and details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="brideName">Bride&apos;s Name</Label>
                <Input
                  id="brideName"
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  placeholder="Ikram Halane"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="groomName">Groom&apos;s Name</Label>
                <Input
                  id="groomName"
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                  placeholder="Nebil Yusuf"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="venueAddress">Venue Address</Label>
              <Input
                id="venueAddress"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                placeholder="30 Vice Regent Blvd, Etobicoke, ON M9W 7A4"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="guestArrivalTime">Guest Arrival Time</Label>
                <Input
                  id="guestArrivalTime"
                  value={guestArrivalTime}
                  onChange={(e) => setGuestArrivalTime(e.target.value)}
                  placeholder="6:00PM"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dressCode">Dress Code</Label>
                <Input
                  id="dressCode"
                  value={dressCode}
                  onChange={(e) => setDressCode(e.target.value)}
                  placeholder="Traditional Clothing / Black Tie"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weddingWebsiteUrl">Wedding Website URL</Label>
              <Input
                id="weddingWebsiteUrl"
                type="url"
                value={weddingWebsiteUrl}
                onChange={(e) => setWeddingWebsiteUrl(e.target.value)}
                placeholder="https://withjoy.com/ikramhalane-and-nebilyusuf"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invitationMessage">Invitation Message</Label>
              <Textarea
                id="invitationMessage"
                rows={3}
                value={invitationMessage}
                onChange={(e) => setInvitationMessage(e.target.value)}
                placeholder="Together with their families request the pleasure of your company..."
              />
              <p className="text-xs text-fg-muted">
                Available variables: {"{{guest_first_name}}"}, {"{{guest_full_name}}"}, {"{{wedding_date}}"}, {"{{wedding_time}}"}, {"{{venue}}"}, {"{{dress_code}}"}, {"{{wedding_website_url}}"}
              </p>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-fg mb-3">Optional: Religious/Cultural Elements</p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bismillahImageUrl">Bismillah Image URL</Label>
                  <Input
                    id="bismillahImageUrl"
                    type="url"
                    value={bismillahImageUrl}
                    onChange={(e) => setBismillahImageUrl(e.target.value)}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-fg-muted">Leave empty to hide. Leave blank for default.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="quranVerse">Quran Verse</Label>
                    <Input
                      id="quranVerse"
                      value={quranVerse}
                      onChange={(e) => setQuranVerse(e.target.value)}
                      placeholder="&quot;AND WE CREATED YOU IN PAIRS.&quot;"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="quranReference">Verse Reference</Label>
                    <Input
                      id="quranReference"
                      value={quranReference}
                      onChange={(e) => setQuranReference(e.target.value)}
                      placeholder="QURAN 78:8"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={saveWeddingDetails} loading={false}>
                <Save className="size-4" />
                Save wedding details
              </Button>
            </div>
          </CardContent>
        </Card>

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
