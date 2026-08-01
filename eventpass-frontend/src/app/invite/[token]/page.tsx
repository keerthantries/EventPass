"use client";

import { use, useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, CheckCircle2, XCircle, Clock3 } from "lucide-react";
import { useInvitation, useSubmitRsvp, useSubmitForm } from "@/hooks/queries";
import { ApiClientError } from "@/lib/api";
import { formatDate, formatTime, cn } from "@/lib/utils";
import { DynamicForm } from "@/components/invite/dynamic-form";
import { useToast } from "@/components/ui/toast";

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [showForm, setShowForm] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, isError } = useInvitation(token);
  const rsvpMutation = useSubmitRsvp(token);
  const formMutation = useSubmitForm(token);

  const primary = data?.event.branding?.primaryColor || "#6b78e6";
  const secondary = data?.event.branding?.secondaryColor || "#0f1020";

  const dynamicFormOn = data?.config.modules.dynamicForm && data.formSchema.length > 0;
  const rsvpEnabled = data?.config.rsvpMode !== "disabled";
  const isPending = data?.guest.rsvpStatus === "pending";

  const onRsvp = async (response: string) => {
    try {
      const result = await rsvpMutation.mutateAsync(response);
      if (result.nextStep === "form") setShowForm(true);
      else setDone(true);
    } catch (err) {
      toast({ title: "Could not submit RSVP", description: err instanceof ApiClientError ? err.message : "Try again", variant: "error" });
    }
  };

  const onFormSubmit = async (answers: Record<string, unknown>) => {
    try {
      await formMutation.mutateAsync(answers);
      setDone(true);
    } catch (err) {
      toast({ title: "Could not submit your answers", description: err instanceof ApiClientError ? err.message : "Try again", variant: "error" });
    }
  };

  const showRsvpButtons = rsvpEnabled && isPending && !showForm && !done;
  const showFormPanel =
    (dynamicFormOn && !done && (showForm || !rsvpEnabled)) ||
    (dynamicFormOn && !done && !showForm && data?.guest.rsvpStatus === "accepted");
  const showStatus = !showRsvpButtons && !showFormPanel && !done && data;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-2 p-6">
        <div className="max-w-md text-center">
          <XCircle className="mx-auto size-10 text-danger" />
          <h1 className="mt-4 text-lg font-semibold text-fg">Invitation not found</h1>
          <p className="mt-1 text-sm text-fg-muted">This invite link is invalid or has expired. Contact the event organizer.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(160deg, ${secondary} 0%, #0a0a14 55%)`,
        color: "#fff",
        ["--brand-primary" as string]: primary,
        ["--brand-secondary" as string]: secondary,
      }}
    >
      <div className="mx-auto max-w-lg px-4 py-12">
        {data.event.banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.event.banner} alt="" className="mb-6 aspect-[2/1] w-full rounded-xl object-cover" />
        ) : (
          <div
            className="mb-6 flex aspect-[2/1] w-full items-center justify-center rounded-xl text-lg font-semibold"
            style={{ background: primary }}
          >
            {data.event.name}
          </div>
        )}

        <h1 className="text-2xl font-bold tracking-tight">{data.event.name}</h1>
        <p className="mt-2 text-sm text-white/70">
          You&apos;re invited{data.guest.fullName ? `, ${data.guest.fullName}` : ""}.
        </p>

        <div className="mt-6 flex flex-col gap-2 text-sm text-white/80">
          <p className="flex items-center gap-2">
            <CalendarDays className="size-4" />
            {formatDate(data.event.startDate)}
            {data.event.startTime ? <span className="text-white/60">· {formatTime(data.event.startTime)}</span> : null}
          </p>
          {data.event.venue ? (
            <p className="flex items-center gap-2">
              <MapPin className="size-4" />
              {data.event.venue}
            </p>
          ) : null}
          {data.event.mapLink ? (
            <p className="flex items-center gap-2">
              <Clock3 className="size-4" />
              <Link href={data.event.mapLink} target="_blank" className="underline underline-offset-2" style={{ color: primary }}>
                View location on map
              </Link>
            </p>
          ) : null}
        </div>

        <div
          className={cn(
            "mt-8 rounded-xl border border-white/10 bg-black/30 p-6",
            showRsvpButtons || showFormPanel ? "" : "text-center"
          )}
        >
          {done ? (
            <div>
              <CheckCircle2 className="mx-auto size-10" style={{ color: primary }} />
              <h2 className="mt-3 text-lg font-semibold">You&apos;re all set!</h2>
              <p className="mt-1 text-sm text-white/70">
                {data.guest.rsvpStatus === "declined"
                  ? "Thanks for letting us know. We hope to see you at a future event."
                  : "Thank you for your response. We look forward to seeing you there."}
              </p>
            </div>
          ) : showFormPanel ? (
            <div>
              <h2 className="mb-4 text-lg font-semibold">A few quick questions</h2>
              <DynamicForm fields={data.formSchema} onSubmit={onFormSubmit} submitting={formMutation.isPending} />
            </div>
          ) : showRsvpButtons ? (
            <div>
              <h2 className="mb-1 text-lg font-semibold">Will you be joining us?</h2>
              <p className="mb-5 text-sm text-white/70">Let us know so we can plan accordingly.</p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => onRsvp("accepted")}
                  disabled={rsvpMutation.isPending}
                  className="inline-flex h-11 items-center justify-center rounded-md px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: primary }}
                >
                  {rsvpMutation.isPending ? "Saving…" : "Yes, I'll be there"}
                </button>
                <div className="grid grid-cols-1 gap-3">
                  {data.config.rsvpMode === "accept_decline_maybe" ? (
                    <button
                      type="button"
                      onClick={() => onRsvp("maybe")}
                      disabled={rsvpMutation.isPending}
                      className="inline-flex h-11 items-center justify-center rounded-md border border-white/20 px-4 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                    >
                      Maybe
                    </button>
                  ) : null}
                  {data.config.rsvpMode !== "accept_only" ? (
                    <button
                      type="button"
                      onClick={() => onRsvp("declined")}
                      disabled={rsvpMutation.isPending}
                      className="inline-flex h-11 items-center justify-center rounded-md border border-white/20 px-4 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                    >
                      Sorry, I can&apos;t make it
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : showStatus ? (
            <div>
              {data.guest.rsvpStatus === "accepted" ? (
                <>
                  <CheckCircle2 className="mx-auto size-10" style={{ color: primary }} />
                  <h2 className="mt-3 text-lg font-semibold">You&apos;re going!</h2>
                  <p className="mt-1 text-sm text-white/70">See you at {data.event.name}.</p>
                </>
              ) : data.guest.rsvpStatus === "maybe" ? (
                <>
                  <Clock3 className="mx-auto size-10" style={{ color: primary }} />
                  <h2 className="mt-3 text-lg font-semibold">Thanks for letting us know</h2>
                  <p className="mt-1 text-sm text-white/70">We&apos;ve saved your &quot;maybe&quot;.</p>
                </>
              ) : (
                <>
                  <XCircle className="mx-auto size-10" style={{ color: primary }} />
                  <h2 className="mt-3 text-lg font-semibold">Response recorded</h2>
                  <p className="mt-1 text-sm text-white/70">Thanks for your response.</p>
                </>
              )}
            </div>
          ) : null}
        </div>

        <p className="mt-8 text-center text-xs text-white/40">Powered by EventPass</p>
      </div>
    </div>
  );
}
