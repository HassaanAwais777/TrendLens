"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Check, Download, Eraser, Gauge, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const PIPELINE_STEPS = [
  { label: "Acquiring listings & reviews", icon: Download, hint: "4 marketplaces in scope" },
  { label: "Cleaning & deduplicating", icon: Eraser, hint: "normalizing review corpus" },
  { label: "NLP · sentiment · authenticity", icon: BrainCircuit, hint: "lexicon engine + fake-review radar" },
  { label: "Balanced verdict scoring", icon: Gauge, hint: "30 / 25 / 25 / 20 composite" },
] as const;

/**
 * step = number of fully completed steps (0..4).
 * When `waiting` is true the final step keeps its spinner while the API finishes.
 */
export function Pipeline({ step, waiting }: { step: number; waiting: boolean }) {
  const progress = Math.min(step, 4);

  return (
    <motion.section
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      aria-live="polite"
      aria-label="Analysis pipeline"
      className="rounded-2xl border border-zinc-800/60 bg-card p-5 sm:p-7"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="micro-label">Live analysis</p>
          <h2 className="mt-1 font-display text-xl text-zinc-50">Reading the reviews…</h2>
        </div>
        <span className="text-xs tabular-nums text-zinc-500">{Math.round((progress / 4) * 100)}%</span>
      </div>

      {/* progress hairline */}
      <div className="mb-7 h-px w-full overflow-hidden bg-zinc-800/70">
        <motion.div
          className="h-px bg-gradient-to-r from-gold-deep via-gold to-gold-bright"
          initial={{ width: "0%" }}
          animate={{ width: `${(progress / 4) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3">
        {PIPELINE_STEPS.map((s, i) => {
          const done = i < progress;
          const active = i === progress && !(progress === 4);
          const waitingHere = i === 3 && progress >= 3 && waiting && !done;
          const Icon = s.icon;

          return (
            <li key={s.label} className="relative flex items-start gap-3 lg:flex-col lg:items-center lg:text-center">
              {/* connector (desktop) */}
              {i < 3 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-[52px] top-5 hidden h-px w-[calc(100%-3.5rem)] lg:block",
                    i < progress ? "bg-gold/40" : "bg-zinc-800/80"
                  )}
                />
              )}

              <span
                className={cn(
                  "relative flex size-10 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                  done && "border-gold/60 bg-gold/15 text-gold",
                  active && "border-gold/50 bg-gold/10 text-gold shadow-[0_0_18px_rgba(212,162,78,0.25)]",
                  !done && !active && "border-zinc-800 bg-zinc-900/60 text-zinc-600"
                )}
              >
                {done ? (
                  <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.25 }}>
                    <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                  </motion.span>
                ) : active || waitingHere ? (
                  <>
                    <Icon className="absolute size-4 opacity-40" aria-hidden="true" />
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  </>
                ) : (
                  <Icon className="size-4" aria-hidden="true" />
                )}
              </span>

              <span className="min-w-0">
                <span className={cn("block text-sm font-medium leading-snug", done || active ? "text-zinc-100" : "text-zinc-500")}>
                  {s.label}
                </span>
                <span className="mt-0.5 block text-xs text-zinc-600">{s.hint}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-7 text-center text-xs text-zinc-600">
        Usually takes about 3 seconds · deterministic lexicon engine, no black boxes
      </p>
    </motion.section>
  );
}
