"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Globe, Instagram, Package, Search, ShoppingBag, Sparkles } from "lucide-react";
import { ALL_MARKETPLACES, MARKETPLACE_LABELS, type Marketplace } from "@/lib/analysis-types";
import { cn } from "@/lib/utils";

export const EXAMPLE_QUERIES = [
  "Nike Air Force 1",
  "men's winter hoodie",
  "Khaadi pret collection",
  "women's leather jacket",
] as const;

const MP_ICONS: Record<Marketplace, React.ComponentType<{ className?: string }>> = {
  DARAZ: ShoppingBag,
  AMAZON: Package,
  ALIEXPRESS: Globe,
  INSTAGRAM: Instagram,
};

interface HeroProps {
  query: string;
  onQueryChange: (q: string) => void;
  marketplaces: Marketplace[];
  onToggleMarketplace: (m: Marketplace) => void;
  onSubmit: (q: string) => void;
  busy: boolean;
}

export function Hero({ query, onQueryChange, marketplaces, onToggleMarketplace, onSubmit, busy }: HeroProps) {
  const [focused, setFocused] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(query);
  }

  return (
    <section className="hero-halo relative">
      <div className="mx-auto max-w-3xl px-4 pb-10 pt-12 text-center sm:px-6 sm:pt-16">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="micro-label"
        >
          Fashion shopping intelligence
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mt-4 font-display text-4xl leading-[1.12] tracking-tight text-zinc-50 sm:text-5xl lg:text-[3.4rem]"
        >
          Every product tells the truth.
          <br />
          <span className="italic text-gold gold-text-glow">We read the reviews.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16 }}
          className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base"
        >
          TrendLens reads listings and reviews across four marketplaces, filters out fake
          hype, and hands you a balanced verdict — sentiment, price history, fit signals
          and all.
        </motion.p>

        {/* Search */}
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24 }}
          onSubmit={handleSubmit}
          role="search"
          aria-label="Product search"
          className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search a product — e.g. “Nike Air Force 1”"
              aria-label="Search a product"
              className={cn(
                "h-12 w-full rounded-xl border bg-zinc-900/70 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600",
                "outline-none transition-all duration-200",
                focused
                  ? "border-gold/50 shadow-[0_0_0_3px_rgba(212,162,78,0.12)]"
                  : "border-zinc-800/80 hover:border-zinc-700"
              )}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className={cn(
              "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gold px-6 text-sm font-semibold text-[#171204]",
              "shadow-[0_8px_30px_-8px_rgba(212,162,78,0.5)] transition-all duration-200",
              "hover:bg-gold-bright hover:shadow-[0_8px_36px_-6px_rgba(212,162,78,0.6)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]",
              "disabled:cursor-not-allowed disabled:opacity-60"
            )}
          >
            <Sparkles className="size-4" aria-hidden="true" />
            {busy ? "Analyzing…" : "Analyze"}
          </button>
        </motion.form>

        {/* Marketplace scope chips */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.32 }}
          className="mt-6"
        >
          <p className="micro-label mb-2.5">Scope · marketplaces analyzed</p>
          <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Marketplace scope">
            {ALL_MARKETPLACES.map((m) => {
              const Icon = MP_ICONS[m];
              const active = marketplaces.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onToggleMarketplace(m)}
                  className={cn(
                    "inline-flex h-9 scroll-mt-24 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
                    active
                      ? "border-gold/45 bg-gold/10 text-gold hover:bg-gold/15"
                      : "border-zinc-800/90 bg-transparent text-zinc-500 hover:border-zinc-700 hover:text-zinc-400"
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {MARKETPLACE_LABELS[m]}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Example queries */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.4 }}
          className="mt-6"
        >
          <p className="micro-label mb-2.5">Try an example</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                type="button"
                disabled={busy}
                onClick={() => {
                  onQueryChange(q);
                  onSubmit(q);
                }}
                className={cn(
                  "rounded-full border border-zinc-800/90 bg-zinc-900/40 px-3.5 py-1.5 text-xs text-zinc-400 transition-all duration-200 scroll-mt-24",
                  "hover:border-gold/40 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {q}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
