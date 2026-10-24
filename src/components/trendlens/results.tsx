"use client";

import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import type { AnalyzeResponse } from "@/lib/analysis-types";
import { formatMoney, MonogramTile, VerdictBadge, fadeUp } from "@/components/trendlens/shared";
import { VerdictPanel } from "@/components/trendlens/panels/verdict";
import { SentimentPanel } from "@/components/trendlens/panels/sentiment";
import { RadarPanel } from "@/components/trendlens/panels/radar";
import { PricePanel } from "@/components/trendlens/panels/price";
import { FitPanel } from "@/components/trendlens/panels/fit";
import { TrendPanel } from "@/components/trendlens/panels/trend";
import { ProsConsPanel } from "@/components/trendlens/panels/pros-cons";
import { ReviewsPanel } from "@/components/trendlens/panels/reviews";
import { Alternatives } from "@/components/trendlens/alternatives";
import { MARKETPLACE_LABELS } from "@/lib/analysis-types";

/* ----------------------------- Product header ----------------------------- */

function ProductHeaderCard({ data }: { data: AnalyzeResponse }) {
  const p = data.product;
  return (
    <motion.header variants={fadeUp} className="rounded-2xl border border-zinc-800/60 bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <MonogramTile monogram={p.monogram} hue={p.hue} size="lg" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <p className="micro-label !text-gold/80">
              {p.brand} · {p.category}
            </p>
            <VerdictBadge label={p.verdictLabel} score={data.verdict.score} className="!py-0.5 !text-[11px]" />
          </div>
          <h2 className="mt-1.5 font-display text-2xl leading-tight text-zinc-50 sm:text-[28px]">{p.name}</h2>
          <p className="mt-1.5 line-clamp-2 max-w-2xl text-sm leading-relaxed text-zinc-500">{p.description}</p>
        </div>

        <dl className="grid w-full shrink-0 grid-cols-2 gap-x-6 gap-y-4 border-t border-zinc-800/60 pt-4 sm:grid-cols-4 lg:w-56 lg:grid-cols-2 lg:border-l lg:border-t-0 lg:pt-0 lg:pl-8 xl:w-64">
          <div>
            <dt className="micro-label">Price range</dt>
            <dd className="mt-1 text-sm font-semibold text-gold tabular-nums">
              {formatMoney(p.priceFrom, p.primaryCurrency)}
              {p.priceTo > p.priceFrom && (
                <span className="text-zinc-500"> – {formatMoney(p.priceTo, p.primaryCurrency)}</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="micro-label">Reviews read</dt>
            <dd className="mt-1 text-sm font-semibold text-zinc-100 tabular-nums">{p.totalReviews}</dd>
          </div>
          <div>
            <dt className="micro-label">Sources</dt>
            <dd className="mt-1 text-sm font-semibold text-zinc-100 tabular-nums">
              {p.sources} <span className="font-normal text-zinc-500">markets</span>
            </dd>
          </div>
          <div>
            <dt className="micro-label">Avg rating</dt>
            <dd className="mt-1 text-sm font-semibold text-zinc-100 tabular-nums">{p.avgRating.toFixed(1)}/5</dd>
          </div>
        </dl>
      </div>

      <p className="mt-4 border-t border-zinc-800/50 pt-3 text-[11px] uppercase tracking-wider text-zinc-600">
        Scope: {data.analyzedMarketplaces.map((m) => MARKETPLACE_LABELS[m]).join(" · ")}
      </p>
    </motion.header>
  );
}

/* ---------------------------- Methodology note ---------------------------- */

function Methodology({ data }: { data: AnalyzeResponse }) {
  return (
    <motion.p variants={fadeUp} className="mx-auto max-w-2xl pt-2 text-center text-xs leading-relaxed text-zinc-600">
      <span className="micro-label mr-2 inline-block align-middle">Methodology</span>
      Balanced Verdict = 0.30 × review quality + 0.25 × sentiment + 0.25 × price fairness +
      0.20 × fit accuracy — computed deterministically from {data.product.totalReviews} reviews
      across {data.product.sources} marketplaces. Demo build; data is illustrative.
    </motion.p>
  );
}

/* ------------------------------ Full dashboard ---------------------------- */

export function ResultsDashboard({
  data,
  onSelectAlternative,
  resultKey,
}: {
  data: AnalyzeResponse;
  onSelectAlternative: (id: string) => void;
  resultKey: string;
}) {
  return (
    <motion.div
      key={resultKey}
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="space-y-4 sm:space-y-5"
    >
      <ProductHeaderCard data={data} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12 sm:gap-5 [&>*]:min-w-0">
        <VerdictPanel verdict={data.verdict} className="md:col-span-2 xl:col-span-5" />
        <SentimentPanel sentiment={data.sentiment} className="md:col-span-2 xl:col-span-7" />
        <RadarPanel radar={data.radar} className="md:col-span-1 xl:col-span-5" />
        <PricePanel price={data.price} className="md:col-span-1 xl:col-span-7" />
        <FitPanel fit={data.fit} className="md:col-span-1 xl:col-span-4" />
        <TrendPanel trend={data.trend} className="md:col-span-1 xl:col-span-4" />
        <ProsConsPanel pros={data.pros} cons={data.cons} className="md:col-span-2 xl:col-span-4" />
        <ReviewsPanel reviews={data.reviews} className="md:col-span-2 xl:col-span-12" />
      </div>

      <div className="flex items-center gap-4 pt-2" aria-hidden="true">
        <div className="gold-rule flex-1" />
        <BarChart3 className="size-4 text-gold/50" />
        <div className="gold-rule flex-1" />
      </div>

      <Alternatives alternatives={data.alternatives} onSelect={onSelectAlternative} />

      <Methodology data={data} />
    </motion.div>
  );
}
