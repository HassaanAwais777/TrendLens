"use client";

import { motion } from "framer-motion";
import { Activity, Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { Momentum, TrendPayload } from "@/lib/analysis-types";
import { MicroLabel, PanelCard, Sparkline } from "@/components/trendlens/shared";
import { cn } from "@/lib/utils";

const MOMENTUM: Record<Momentum, { chip: string; stroke: string; Icon: typeof TrendingUp }> = {
  Rising: { chip: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400", stroke: "#10b981", Icon: TrendingUp },
  Stable: { chip: "border-zinc-700/70 bg-zinc-800/40 text-zinc-300", stroke: "#a1a1aa", Icon: Minus },
  Cooling: { chip: "border-rose-500/40 bg-rose-500/10 text-rose-400", stroke: "#f43f5e", Icon: TrendingDown },
};

export function TrendPanel({ trend, className }: { trend: TrendPayload; className?: string }) {
  const m = MOMENTUM[trend.momentum];
  const Icon = m.Icon;

  return (
    <PanelCard micro="Trend forecast" title="Search Momentum" icon={Activity} className={className}>
      <div className="flex items-center justify-between gap-3">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider", m.chip)}>
          <Icon className="size-3.5" aria-hidden="true" />
          {trend.momentum}
        </span>
        <span className="text-sm font-semibold text-zinc-100 tabular-nums">
          <span className={trend.changePct >= 8 ? "text-emerald-400" : trend.changePct <= -8 ? "text-rose-400" : "text-zinc-300"}>
            {trend.changePct >= 0 ? "+" : ""}
            {trend.changePct}%
          </span>
          <span className="ml-1.5 text-xs font-normal text-zinc-500">8-wk interest</span>
        </span>
      </div>

      <div className="mt-4 h-20">
        <Sparkline points={trend.points} id="trend-spark" stroke={m.stroke} height={80} />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] uppercase tracking-widest text-zinc-600">
        <span>W1</span>
        <span>W12</span>
      </div>

      <div className="gold-rule my-4" aria-hidden="true" />
      <p className="text-sm leading-relaxed text-zinc-300">{trend.changeNote.replace("Search interest ", "Interest ")}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{trend.peakNote}</p>
      <MicroLabel className="mt-4 block">Search interest · 12-week window</MicroLabel>
    </PanelCard>
  );
}
