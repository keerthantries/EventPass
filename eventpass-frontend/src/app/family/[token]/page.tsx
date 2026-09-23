"use client";

import { use } from "react";
import Link from "next/link";
import { Users, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getFamily, type FamilyPageData } from "@/lib/queries/family";
import { cn, formatDate, formatClock } from "@/lib/utils";

export default function FamilyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["family", token],
    queryFn: () => getFamily(token),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-[#0a0a14] to-[#1a1a2e]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-[#0a0a14] to-[#1a1a2e] p-6">
        <div className="max-w-md text-center">
          <Users className="mx-auto size-12 text-white/30" />
          <h1 className="mt-4 text-xl font-semibold text-white">Family Not Found</h1>
          <p className="mt-2 text-sm text-white/60">
            This family link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  const { party, event: eventData, guests } = data;
  const primary = eventData.branding?.primaryColor || "#8b5cf6";

  return (
    <div
      className="relative min-h-dvh"
      style={{
        background: `linear-gradient(160deg, ${eventData.branding?.secondaryColor || "#1a1a2e"} 0%, #0a0a14 55%)`,
        color: "#fff",
      }}
    >
      {/* Dark overlay so white text stays readable over any branding color */}
      <div className="pointer-events-none absolute inset-0 bg-black/45" aria-hidden />
      <div className="relative z-10 mx-auto max-w-lg px-4 pb-[env(safe-area-inset-bottom)] py-8 sm:py-12">
        {/* Header */}
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">
            {party.side ? `${party.side}'s Family` : "Family"}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white">{party.name}</h1>
          {eventData.brideName && eventData.groomName && (
            <p className="mt-2 text-sm text-white/50">
              {eventData.brideName} & {eventData.groomName}&apos;s Wedding
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-lg" style={{ color: primary }}>&#10022;</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Family Members */}
        <div className="space-y-3">
          {guests.map((guest) => (
            <div
              key={guest.invitationToken}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
                  style={{ background: `${primary}30`, color: primary }}
                >
                  {guest.firstName?.[0] || guest.fullName[0]}
                </div>
                <div>
                  <p className="font-medium text-white">{guest.fullName}</p>
                  <p className="text-xs text-white/40">
                    {guest.attendanceStatus === "present" ? (
                      <span className="flex items-center gap-1 text-green-400">
                        <CheckCircle2 className="size-3" /> Checked In
                      </span>
                    ) : (
                      "Not yet arrived"
                    )}
                  </p>
                </div>
              </div>
              {guest.invitationToken && (
                <Link
                  href={`/i/${guest.invitationToken}`}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-80"
                  style={{ background: primary }}
                >
                  View Pass
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Event Info */}
        <div className="mt-10 text-center text-sm text-white/40">
          <p>{formatDate(eventData.startDate)}</p>
          {eventData.startTime && <p>{formatClock(eventData.startTime)}</p>}
          {eventData.venue && <p>{eventData.venue}</p>}
        </div>

        <p className="mt-8 text-center text-xs text-white/20">Powered by EventPass</p>
      </div>
    </div>
  );
}
