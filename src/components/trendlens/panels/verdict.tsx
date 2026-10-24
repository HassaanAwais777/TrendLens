"use client";

import { motion } from "framer-motion";
import { Award } from "lucide-react";
import type { VerdictPayload } from "@/lib/analysis-types";
import { PanelCard, VERDICT_STYLES } from "@/components/trendlens/shared";
import { cn } from "@/lib/utils";

/* ------------------------------- Arc gauge -------------------------------- */

const R = 84;
const CX = 100;
const CY = 104;
const ARC_LEN = Math.PI * R;
const GAUGE_PATH = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

function Gauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="relative mx-auto w-56 shrink-0">
      <svg viewBox="0 0 200 122" className="w-full" role="img" aria-label={`Verdict score ${score} out of 100`}>
        <defs>
          <linearGradient id="gauge-gold" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#8a6a34" />
            <stop offset="55%" stopColor="#d4a24e" />
            <stop offset="100%" stopColor="#f0c878" />
          </linearGradient>
        </defs>
        {/* tick marks */}
        {[0, 25, 50, 75, 100].map((t) => {
          const angle = Math.PI * (1 - t / 100);
          const x1 = CX + Math.cos(angle) * (R - 10);
          const y1 = CY - Math.sin(angle) * (R - 10);
          const x2 = CX + Math.cos(angle) * (R - 16);
          const y2 = CY - Math.sin(angle) * (R - 16);
          return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3f3f46" strokeWidth="1.5" />;
        })}
        <path d={GAUGE_PATH} fill="none" stroke="#232327" strokeWidth="13" strokeLinecap="round" />
        <motion.path
          d={GAUGE_PATH}
          fill="none"
          stroke="url(#gauge-gold)"
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={ARC_LEN}
          initial={{ strokeDashoffset: ARC_LEN }}
          animate={{ strokeDashoffset: ARC_LEN * (1 - clamped / 100) }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
          style={{ filter: "drop-shadow(0 0 10px rgba(212,162,78,0.45))" }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-x-0 top-[54%] text-center">
        <span className="font-display text-[44px] font-semibold leading-none text-gold gold-text-glow tabular-nums">
          {clamped}
        </span>
        <span className="ml-1 text-sm text-zinc-500 tabular-nums">/100</span>
      </div>
    </div>
  );
}

/* ------------------------------ Component bar ----------------------------- */

function ComponentBar({ label, weight, score, index }: { label: string; weight: number; score: number; index: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
        <span className="text-zinc-300">
          {label} <span className="text-zinc-600 tabular-nums">· {weight}%</span>
        </span>
        <span className="font-semibold text-gold tabular-nums">{score}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800/80">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold-bright"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, score))}%` }}
          transition={{ duration: 0.9, delay: 0.35 + index * 0.12, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

/* --------------------------------- Panel ---------------------------------- */

export function VerdictPanel({ verdict, className }: { verdict: VerdictPayload; className?: string }) {
  const styles = VERDICT_STYLES[verdict.label];
  return (
    <PanelCard micro="Verdict analysis" title="Balanced Verdict" icon={Award} gold className={className}>
      <div className="flex flex-col items-center gap-7 sm:flex-row sm:items-center sm:gap-8 xl:flex-col xl:gap-6">
        <Gauge score={verdict.score} />
        <div className="w-full flex-1 space-y-4">
          <div className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", styles.chip)}>
            <span className={cn("size-1.5 rounded-full", styles.dot)} aria-hidden="true" />
            {verdict.label}
          </div>
          <div className="space-y-3.5">
            {verdict.components.map((c, i) => (
              <ComponentBar key={c.key} label={c.label} weight={c.weight} score={c.score} index={i} />
            ))}
          </div>
        </div>
      </div>
      <div className="gold-rule my-5" aria-hidden="true" />
      <p className="text-sm leading-relaxed text-zinc-400">{verdict.statement}</p>
    </PanelCard>
  );
}
