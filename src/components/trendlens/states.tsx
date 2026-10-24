"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, SearchX } from "lucide-react";
import { EXAMPLE_QUERIES } from "@/components/trendlens/hero";
import { GoldRule } from "@/components/trendlens/shared";

export function EmptyState({ query, onExample }: { query: string; onExample: (q: string) => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-zinc-800/60 bg-card px-6 py-12 text-center"
      role="status"
    >
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60">
        <SearchX className="size-6 text-zinc-500" aria-hidden="true" />
      </span>
      <h2 className="mt-5 font-display text-2xl text-zinc-50">
        No matches for <span className="italic text-gold">“{query}”</span>
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
        The demo catalogue covers 12 products across sneakers, pret wear, hoodies, jackets,
        jeans, tees and handbags. Try one of the searches below.
      </p>
      <GoldRule className="mx-auto my-6 w-40" />
      <div className="flex flex-wrap items-center justify-center gap-2">
        {EXAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onExample(q)}
            className="rounded-full border border-zinc-800/90 bg-zinc-900/40 px-3.5 py-1.5 text-xs text-zinc-400 transition-all duration-200 hover:border-gold/40 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          >
            {q}
          </button>
        ))}
      </div>
    </motion.section>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-zinc-800/60 bg-card px-6 py-12 text-center"
      role="alert"
    >
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10">
        <AlertTriangle className="size-6 text-rose-400" aria-hidden="true" />
      </span>
      <h2 className="mt-5 font-display text-2xl text-zinc-50">Analysis failed</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
        Something went wrong while reading the review corpus. It&apos;s us, not you.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-gold px-5 text-sm font-semibold text-[#171204] transition-colors hover:bg-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]"
      >
        <RefreshCw className="size-4" aria-hidden="true" />
        Try again
      </button>
    </motion.section>
  );
}
