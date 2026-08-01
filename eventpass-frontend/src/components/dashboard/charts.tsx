"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { chartColors, rsvpChartPalette } from "@/components/ui/chart";

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: { name?: string; value?: string | number; dataKey?: string | number }[];
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-[var(--tooltip-border,#343b46)] bg-[var(--tooltip-bg,#1b2026)] px-2.5 py-1.5 text-xs shadow-popover">
      <p className="font-medium text-[#eef0f3]">{label ?? payload[0].name}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey ?? p.name)} className="text-[#9aa3af]">
          {p.name}: <span className="font-medium text-[#eef0f3]">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function AttendanceTrendChart({ data }: { data: { hour: string; count: number }[] }) {
  if (!data.length) {
    return <p className="flex h-full items-center justify-center py-10 text-sm text-fg-muted">No check-ins yet</p>;
  }
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.35} />
              <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="hour" stroke={chartColors.muted} fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke={chartColors.muted} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="count" stroke={chartColors.primary} strokeWidth={2} fill="url(#trendFill)" name="Check-ins" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RsvpDonutChart({ data }: { data: { status: string; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) {
    return <p className="flex h-full items-center justify-center py-10 text-sm text-fg-muted">No RSVPs yet</p>;
  }
  return (
    <div className="flex h-56 flex-col items-center justify-center gap-4 sm:flex-row">
      <div className="relative h-40 w-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="status" innerRadius={50} outerRadius={72} paddingAngle={2} strokeWidth={0}>
              {data.map((d) => (
                <Cell key={d.status} fill={rsvpChartPalette[d.status] ?? chartColors.muted} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold text-fg">{total}</span>
          <span className="text-[10px] uppercase tracking-wide text-fg-muted">RSVPs</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {data.map((d) => (
          <div key={d.status} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 rounded-sm" style={{ background: rsvpChartPalette[d.status] ?? chartColors.muted }} />
            <span className="text-fg-secondary">{d.status}</span>
            <span className="ml-auto font-medium text-fg">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
