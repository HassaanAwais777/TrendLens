"use client";

import { motion } from "framer-motion";
import { Ruler } from "lucide-react";
import type { FitPayload } from "@/lib/analysis-types";
import { MicroLabel, PanelCard } from "@/components/trendlens/shared";
import { cn } from "@/lib/utils";

export function FitPanel({ fit, className }: { fit: FitPayload; className?: string }) {
  const hasData = fit.mentions > 0;

  return (
    <PanelCard micro="Fit intelligence" title="Fit & Sizing" icon={Ruler} className={className}>
      {hasData ? (
        <>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-800/70" role="img" aria-label={`Fit distribution: ${fit.runsSmall}% runs small, ${fit.trueToSize}% true to size, ${fit.runsLarge}% runs large`}>
            <motion.span
              className="h-full bg-rose-400"
              initial={{ width: 0 }}
              animate={{ width: `${fit.runsSmall}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
            <motion.span
              className="h-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${fit.trueToSize}%` }}
              transition={{ duration: 0.8, delay: 0.4 }}
            />
            <motion.span
              className="h-full bg-gold"
              initial={{ width: 0 }}
              animate={{ width: `${fit.runsLarge}%` }}
              transition={{ duration: 0.8, delay: 0.5 }}
            />
          </div>

          <div className="mt-3 space-y-1.5 text-xs text-zinc-400">
            <span className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-rose-400" aria-hidden="true" /> Runs small
              </span>
              <span className="tabular-nums">{fit.runsSmall}%</span>
            </span>
            <span className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" /> True to size
              </span>
              <span className="tabular-nums">{fit.trueToSize}%</span>
            </span>
            <span className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-gold" aria-hidden="true" /> Runs large
              </span>
              <span className="tabular-nums">{fit.runsLarge}%</span>
            </span>
          </div>

          <div className="gold-rule my-4" aria-hidden="true" />

          <p className="text-sm font-medium text-zinc-100 tabular-nums">{fit.summary}</p>
          <p className={cn("mt-1.5 text-xs leading-relaxed text-zinc-500")}>{fit.guidance}</p>
          <p className="mt-3 text-[11px] text-zinc-600 tabular-nums">{fit.mentions} fit mentions analyzed</p>
        </>
      ) : (
        <p className="text-sm text-zinc-500">
          Not enough sizing signals in this review set — consult the brand&apos;s size chart before ordering.
        </p>
      )}
      <MicroLabel className="mt-4 block">Derived from review fit language</MicroLabel>
    </PanelCard>
  );
}
