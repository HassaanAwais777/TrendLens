"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Layers } from "lucide-react";
import type { AlternativeProduct } from "@/lib/analysis-types";
import { fadeUp, MonogramTile, VERDICT_STYLES } from "@/components/trendlens/shared";
import { formatMoney } from "@/components/trendlens/shared";
import { cn } from "@/lib/utils";

const SENTIMENT_DOT: Record<AlternativeProduct["sentimentChip"], string> = {
  Positive: "bg-emerald-400",
  Mixed: "bg-zinc-400",
  Negative: "bg-rose-400",
};

function AlternativeCard({
  alt,
  index,
  onSelect,
}: {
  alt: AlternativeProduct;
  index: number;
  onSelect: (id: string) => void;
}) {
  const styles = VERDICT_STYLES[alt.label];

  return (
    <motion.button
      variants={fadeUp}
      custom={index}
      type="button"
      onClick={() => onSelect(alt.id)}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group flex h-full w-full scroll-mt-24 flex-col rounded-2xl border border-zinc-800/60 bg-card p-5 text-left",
        "shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)] transition-colors duration-200",
        "hover:border-gold/40 hover:bg-[#131316]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      )}
      aria-label={`Analyze ${alt.brand} ${alt.name}, verdict ${alt.score} out of 100`}
    >
      <div className="flex items-start justify-between gap-3">
        <MonogramTile monogram={alt.brand.slice(0, 2).toUpperCase()} hue={alt.hue} size="sm" />
        <div className="text-right">
          <span className={cn("font-display text-3xl font-semibold tabular-nums", styles.text)}>{alt.score}</span>
          <span className="ml-0.5 text-xs text-zinc-600 tabular-nums">/100</span>
        </div>
      </div>

      <p className="micro-label mt-4">{alt.brand} · {alt.category}</p>
      <h4 className="mt-1 font-display text-lg leading-snug text-zinc-50">{alt.name}</h4>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-medium text-zinc-300 tabular-nums">
          from {formatMoney(alt.priceFrom, alt.currency)}
        </span>
        <span className="inline-flex items-center gap-1 text-zinc-500">
          <span className={cn("size-1.5 rounded-full", SENTIMENT_DOT[alt.sentimentChip])} aria-hidden="true" />
          {alt.sentimentChip}
        </span>
        {alt.sameCategory && (
          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800/90 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-500">
            <Layers className="size-3" aria-hidden="true" />
            Same category
          </span>
        )}
      </div>

      <p className="mt-3 flex-1 text-xs leading-relaxed text-zinc-500 line-clamp-2">{alt.strength}</p>

      <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-gold opacity-80 transition-opacity group-hover:opacity-100">
        Run full analysis
        <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
      </span>
    </motion.button>
  );
}

export function Alternatives({ alternatives, onSelect }: { alternatives: AlternativeProduct[]; onSelect: (id: string) => void }) {
  if (alternatives.length === 0) return null;

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="show"
      aria-label="Smart alternatives"
      className="mt-2"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="micro-label">Smart alternatives</p>
          <h3 className="mt-1 font-display text-2xl text-zinc-50">Ranked by Balanced Verdict</h3>
        </div>
        <p className="text-xs text-zinc-600">Click any card to run its full analysis</p>
      </div>

      <motion.div
        variants={staggerAlt}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {alternatives.map((alt, i) => (
          <AlternativeCard key={alt.id} alt={alt} index={i} onSelect={onSelect} />
        ))}
      </motion.div>
    </motion.section>
  );
}

const staggerAlt = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
