"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Radar, ShieldAlert, ShieldCheck } from "lucide-react";
import type { RadarPayload, Severity } from "@/lib/analysis-types";
import { MicroLabel, PanelCard } from "@/components/trendlens/shared";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES: Record<Severity, string> = {
  High: "border-rose-500/45 bg-rose-500/10 text-rose-400",
  Medium: "border-gold/40 bg-gold/10 text-gold",
  Low: "border-zinc-600/60 bg-zinc-500/10 text-zinc-300",
};

function authenticityTone(score: number): { text: string; bar: string; Icon: typeof ShieldCheck; label: string } {
  if (score >= 85) return { text: "text-emerald-400", bar: "bg-emerald-500", Icon: ShieldCheck, label: "Looks organic" };
  if (score >= 65) return { text: "text-gold", bar: "bg-gold", Icon: ShieldAlert, label: "Minor noise" };
  if (score >= 40) return { text: "text-gold-bright", bar: "bg-gold-bright", Icon: ShieldAlert, label: "Suspicious signals" };
  return { text: "text-rose-400", bar: "bg-rose-500", Icon: ShieldAlert, label: "Heavily manipulated" };
}

export function RadarPanel({ radar, className }: { radar: RadarPayload; className?: string }) {
  const tone = authenticityTone(radar.authenticity);

  return (
    <PanelCard micro="Authenticity check" title="Fake Review Radar" icon={Radar} className={className}>
      <div className="flex items-center gap-5">
        <div className={cn("flex size-16 shrink-0 items-center justify-center rounded-2xl border", radar.clean ? "border-emerald-500/30 bg-emerald-500/10" : "border-zinc-700/60 bg-zinc-800/40")}>
          <tone.Icon className={cn("size-7", tone.text)} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className={cn("font-display text-3xl font-semibold tabular-nums", tone.text)}>{radar.authenticity}</span>
            <span className="text-sm text-zinc-500 tabular-nums">/100</span>
            <span className={cn("text-xs font-medium uppercase tracking-wider", tone.text)}>{tone.label}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800/80">
            <motion.div
              className={cn("h-full rounded-full", tone.bar)}
              initial={{ width: 0 }}
              animate={{ width: `${radar.authenticity}%` }}
              transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p className="mt-2 text-xs text-zinc-600 tabular-nums">{radar.analyzed} reviews scanned · 5 manipulation heuristics</p>
        </div>
      </div>

      <div className="gold-rule my-5" aria-hidden="true" />

      {radar.clean ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-emerald-400">No significant manipulation detected</p>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
              Duplicate wording, rating bursts, unverified share and generic-praise density all sit within healthy ranges.
            </p>
          </div>
        </motion.div>
      ) : (
        <>
          <MicroLabel className="mb-3">Detected patterns · {radar.findings.length}</MicroLabel>
          <ul className="space-y-2.5">
            {radar.findings.map((f, i) => (
              <motion.li
                key={f.pattern}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="rounded-xl border border-zinc-800/60 bg-surface-2/50 p-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-100">{f.pattern}</p>
                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", SEVERITY_STYLES[f.severity])}>
                    {f.severity}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">{f.description}</p>
                <p className="mt-1.5 text-[11px] font-medium text-zinc-400 tabular-nums">{f.evidence}</p>
              </motion.li>
            ))}
          </ul>
        </>
      )}
    </PanelCard>
  );
}
