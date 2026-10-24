"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Quote } from "lucide-react";
import type { RepresentativeReview } from "@/lib/analysis-types";
import { MarketplaceTag, MicroLabel, PanelCard, Stars } from "@/components/trendlens/shared";
import { cn } from "@/lib/utils";

const TONE_DOT: Record<RepresentativeReview["tone"], string> = {
  positive: "bg-emerald-400",
  mixed: "bg-zinc-400",
  negative: "bg-rose-400",
};

function ReviewCard({ review, index }: { review: RepresentativeReview; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 + index * 0.08, duration: 0.4 }}
      className="flex flex-col rounded-xl border border-zinc-800/50 bg-surface-2/60 p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <Stars rating={review.rating} />
        <span className="text-[11px] text-zinc-600">{review.dateLabel}</span>
      </div>
      <h4 className="mt-2.5 text-sm font-medium leading-snug text-zinc-100">{review.title}</h4>
      <p className="mt-1.5 flex-1 text-xs leading-relaxed text-zinc-400">{review.excerpt}</p>
      <footer className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-zinc-800/50 pt-3">
        <MarketplaceTag marketplace={review.marketplace} />
        {review.verified && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-emerald-400/90">
            <BadgeCheck className="size-3.5" aria-hidden="true" />
            Verified purchase
          </span>
        )}
        <span className={cn("ml-auto size-1.5 rounded-full", TONE_DOT[review.tone])} aria-hidden="true" title={`Tone: ${review.tone}`} />
      </footer>
    </motion.article>
  );
}

export function ReviewsPanel({ reviews, className }: { reviews: RepresentativeReview[]; className?: string }) {
  return (
    <PanelCard
      micro="Voice of buyers"
      title="Representative Reviews"
      icon={Quote}
      className={className}
      action={<MicroLabel className="hidden max-w-[11rem] text-right sm:block">{reviews.length} curated · balanced across tones</MicroLabel>}
    >
      <div className="scroll-area max-h-96 overflow-y-auto -mr-2 pr-2">
        <div className="grid gap-3 sm:grid-cols-2">
          {reviews.map((r, i) => (
            <ReviewCard key={r.id} review={r} index={i} />
          ))}
        </div>
      </div>
    </PanelCard>
  );
}
