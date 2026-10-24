"use client";

import { motion } from "framer-motion";
import { MessagesSquare } from "lucide-react";
import type { AspectScore, SentimentPayload } from "@/lib/analysis-types";
import { MicroLabel, PanelCard } from "@/components/trendlens/shared";
import { cn } from "@/lib/utils";

/* --------------------------------- Donut ---------------------------------- */

const DONUT_R = 52;
const DONUT_C = 2 * Math.PI * DONUT_R;

function Donut({ positive, neutral, negative }: { positive: number; neutral: number; negative: number }) {
  const total = Math.max(1, positive + neutral + negative);
  const segments = [
    { value: positive, color: "#10b981" },
    { value: neutral, color: "#52525b" },
    { value: negative, color: "#f43f5e" },
  ];

  let acc = 0;
  const arcs = segments.map((s) => {
    const len = (s.value / total) * DONUT_C;
    const arc = { ...s, len, offset: acc };
    acc += len;
    return arc;
  });

  const dominant = Math.max(positive, neutral, negative);

  return (
    <div className="relative size-[132px] shrink-0" role="img" aria-label={`Sentiment split: ${positive}% positive, ${neutral}% neutral, ${negative}% negative`}>
      <svg viewBox="0 0 132 132" className="size-full -rotate-90">
        <circle cx="66" cy="66" r={DONUT_R} fill="none" stroke="#232327" strokeWidth="13" />
        {arcs.map((a, i) => (
          <motion.circle
            key={i}
            cx="66"
            cy="66"
            r={DONUT_R}
            fill="none"
            stroke={a.color}
            strokeWidth="13"
            strokeLinecap="butt"
            strokeDasharray={`${Math.max(0, a.len - 1.5)} ${DONUT_C}`}
            initial={{ strokeDashoffset: -a.offset, opacity: 0 }}
            animate={{ strokeDashoffset: -a.offset, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.3 + i * 0.15 }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-semibold text-zinc-50 tabular-nums">{dominant}%</span>
        <span className="text-[10px] uppercase tracking-widest text-zinc-500">
          {dominant === positive ? "positive" : dominant === negative ? "negative" : "neutral"}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------- Aspect bar ------------------------------- */

function AspectBar({ aspect, index }: { aspect: AspectScore; index: number }) {
  const score = Math.max(-100, Math.min(100, aspect.score));
  const pos = score >= 0;
  const width = `${Math.abs(score) / 2}%`;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="text-zinc-300">{aspect.label}</span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-zinc-600 tabular-nums">{aspect.mentions} mentions</span>
          <span className={cn("font-semibold tabular-nums", pos ? "text-emerald-400" : "text-rose-400")}>
            {pos ? "+" : ""}
            {score}
          </span>
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-zinc-800/70">
        <span className="absolute left-1/2 top-0 z-10 h-full w-px bg-zinc-600/80" aria-hidden="true" />
        <motion.div
          className={cn("absolute top-0 h-full", pos ? "left-1/2 rounded-r-full bg-emerald-500" : "right-1/2 rounded-l-full bg-rose-500")}
          initial={{ width: 0 }}
          animate={{ width }}
          transition={{ duration: 0.7, delay: 0.35 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

/* --------------------------------- Panel ---------------------------------- */

export function SentimentPanel({ sentiment, className }: { sentiment: SentimentPayload; className?: string }) {
  const total = Math.max(1, sentiment.positive + sentiment.neutral + sentiment.negative);
  const pct = (v: number) => Math.round((v / total) * 100);

  return (
    <PanelCard micro="NLP breakdown" title="Review Sentiment" icon={MessagesSquare} className={className}>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
        <Donut positive={sentiment.positive} neutral={sentiment.neutral} negative={sentiment.negative} />
        <div className="w-full space-y-2.5">
          {[
            { label: "Positive", value: pct(sentiment.positive), color: "bg-emerald-500" },
            { label: "Neutral", value: pct(sentiment.neutral), color: "bg-zinc-500" },
            { label: "Negative", value: pct(sentiment.negative), color: "bg-rose-500" },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3 text-sm">
              <span className={cn("size-2.5 shrink-0 rounded-full", row.color)} aria-hidden="true" />
              <span className="flex-1 text-zinc-300">{row.label}</span>
              <span className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-800/80 sm:w-32">
                <motion.span
                  className={cn("block h-full rounded-full", row.color)}
                  initial={{ width: 0 }}
                  animate={{ width: `${row.value}%` }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                />
              </span>
              <span className="w-10 text-right font-medium text-zinc-100 tabular-nums">{row.value}%</span>
            </div>
          ))}
          <p className="pt-1 text-xs text-zinc-600">
            Lexicon sentiment across {sentiment.totalReviews} reviews · negation &amp; intensifier aware
          </p>
        </div>
      </div>

      <div className="gold-rule my-5" aria-hidden="true" />
      <MicroLabel className="mb-3.5">Aspect sentiment · −100 to +100</MicroLabel>
      <div className="grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
        {sentiment.aspects.map((a, i) => (
          <AspectBar key={a.key} aspect={a} index={i} />
        ))}
      </div>
    </PanelCard>
  );
}
