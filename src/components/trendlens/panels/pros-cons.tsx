"use client";

import { motion } from "framer-motion";
import { Scale, ThumbsDown, ThumbsUp } from "lucide-react";
import { MicroLabel, PanelCard } from "@/components/trendlens/shared";

export function ProsConsPanel({
  pros,
  cons,
  className,
}: {
  pros: string[];
  cons: string[];
  className?: string;
}) {
  return (
    <PanelCard micro="Signal summary" title="Pros & Cons" icon={Scale} className={className}>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
        <div>
          <MicroLabel className="mb-3 text-gold/80">Strengths</MicroLabel>
          <ul className="space-y-2.5">
            {pros.map((p, i) => (
              <motion.li
                key={p}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.08 }}
                className="flex items-start gap-2.5 text-sm leading-snug text-zinc-300"
              >
                <ThumbsUp className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
                {p}
              </motion.li>
            ))}
          </ul>
        </div>
        <div>
          <MicroLabel className="mb-3">Watch-outs</MicroLabel>
          <ul className="space-y-2.5">
            {cons.map((c, i) => (
              <motion.li
                key={c}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="flex items-start gap-2.5 text-sm leading-snug text-zinc-400"
              >
                <ThumbsDown className="mt-0.5 size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                {c}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </PanelCard>
  );
}
