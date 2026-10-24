"use client";

import { Eye } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/60 bg-[#09090b]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-baseline gap-3">
          <span className="whitespace-nowrap font-display text-[22px] font-semibold tracking-tight text-zinc-50">
            Trend<span className="text-gold">Lens</span>
          </span>
          <span className="hidden text-xs text-zinc-500 sm:block">See through the hype.</span>
        </div>
        <div className="flex items-center gap-2 text-right">
          <Eye className="size-3.5 text-gold/70" aria-hidden="true" />
          <span className="micro-label hidden md:block">Multi-marketplace intelligence</span>
          <span className="micro-label md:hidden">Intel</span>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-800/60 bg-[#0b0b0e]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:flex-row sm:px-6">
        <p className="text-xs text-zinc-500">TrendLens — Demo build. Scores are illustrative.</p>
        <div className="flex items-center gap-3">
          <span className="hidden h-px w-10 bg-zinc-800 sm:block" aria-hidden="true" />
          <p className="text-xs text-zinc-600">© 2026 TrendLens</p>
        </div>
      </div>
    </footer>
  );
}
