"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, LineChart, Minus, Star } from "lucide-react";
import type { BuyTiming, PricePayload } from "@/lib/analysis-types";
import { formatMoney, MarketplaceTag, MicroLabel, PanelCard, Sparkline } from "@/components/trendlens/shared";
import { cn } from "@/lib/utils";

function DeltaChip({ deltaPct }: { deltaPct: number }) {
  const up = deltaPct > 0.5;
  const down = deltaPct < -0.5;
  const cls = up ? "text-rose-400" : down ? "text-emerald-400" : "text-zinc-400";
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border border-zinc-800/80 bg-zinc-900/60 px-2.5 py-1 text-xs font-semibold tabular-nums", cls)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {up ? "+" : ""}
      {deltaPct.toFixed(1)}% vs 90-day avg
    </span>
  );
}

const TIMING_STYLES: Record<BuyTiming, string> = {
  "Buy now": "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  Wait: "border-gold/45 bg-gold/10 text-gold",
  Neutral: "border-zinc-700/70 bg-zinc-800/40 text-zinc-300",
};

export function PricePanel({ price, className }: { price: PricePayload; className?: string }) {
  return (
    <PanelCard micro="Price intelligence" title="12-Week Price History" icon={LineChart} className={className}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div>
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="font-display text-[32px] font-semibold leading-none text-zinc-50 tabular-nums">
              {formatMoney(price.current, price.currency)}
            </span>
            <DeltaChip deltaPct={price.deltaPct} />
          </div>
          <p className="mt-2 text-xs text-zinc-500 tabular-nums">
            90-day avg {formatMoney(price.avg90, price.currency)} · 12-week range {formatMoney(price.weekLow, price.currency)} – {formatMoney(price.weekHigh, price.currency)}
          </p>
        </div>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider", TIMING_STYLES[price.timing])}>
          {price.timing}
        </span>
      </div>

      <div className="mt-4 h-20">
        <Sparkline points={price.history} id="price-spark" stroke="#d4a24e" height={80} />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] uppercase tracking-widest text-zinc-600">
        <span>12 weeks ago</span>
        <span>now</span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-zinc-500">{price.timingNote}</p>

      <div className="gold-rule my-5" aria-hidden="true" />
      <MicroLabel className="mb-3">Cross-store comparison</MicroLabel>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[380px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800/70 text-[10px] uppercase tracking-widest text-zinc-600">
              <th scope="col" className="pb-2 pr-3 font-medium">Marketplace</th>
              <th scope="col" className="pb-2 pr-3 font-medium">Price</th>
              <th scope="col" className="pb-2 pr-3 font-medium">Rating</th>
              <th scope="col" className="pb-2 font-medium">Delivery</th>
            </tr>
          </thead>
          <tbody>
            {price.stores.map((s, i) => (
              <motion.tr
                key={s.marketplace}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.06 }}
                className="border-b border-zinc-800/40 last:border-0"
              >
                <td className="py-2.5 pr-3">
                  <MarketplaceTag marketplace={s.marketplace} />
                </td>
                <td className="py-2.5 pr-3">
                  <span className="font-semibold text-zinc-100 tabular-nums">{formatMoney(s.price, s.currency)}</span>
                  {s.originalPrice != null && s.originalPrice > s.price && (
                    <span className="ml-2 text-xs text-zinc-600 line-through tabular-nums">
                      {formatMoney(s.originalPrice, s.currency)}
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-3">
                  <span className="inline-flex items-center gap-1 text-zinc-300 tabular-nums">
                    <Star className="size-3 fill-gold text-gold" aria-hidden="true" />
                    {s.rating.toFixed(1)}
                  </span>
                </td>
                <td className="py-2.5 text-zinc-500 tabular-nums">{s.deliveryDays}-day est.</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </PanelCard>
  );
}
