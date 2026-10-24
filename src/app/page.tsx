"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { AnalyzeResponse, Marketplace, ProductSummary } from "@/lib/analysis-types";
import { ALL_MARKETPLACES } from "@/lib/analysis-types";
import { SiteFooter, SiteHeader } from "@/components/trendlens/chrome";
import { Hero } from "@/components/trendlens/hero";
import { Pipeline } from "@/components/trendlens/pipeline";
import { ResultsDashboard } from "@/components/trendlens/results";
import { EmptyState, ErrorState } from "@/components/trendlens/states";

type Stage = "idle" | "analyzing" | "results" | "empty" | "error";
type Target = { productId: string } | { query: string };

class EmptySearchError extends Error {}

/** Pipeline step durations (ms) — totals ≈ 2.8s for the full sequence. */
const STEP_DURATIONS = [700, 680, 780, 640];

export default function Home() {
  const [stage, setStage] = useState<Stage>("idle");
  const [query, setQuery] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([...ALL_MARKETPLACES]);
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [pipelineWaiting, setPipelineWaiting] = useState(false);

  const runIdRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const mpsRef = useRef<Marketplace[]>(marketplaces);
  const lastTargetRef = useRef<Target | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const runAnalysis = useCallback(
    async (target: Target) => {
      const runId = ++runIdRef.current;
      clearTimers();
      lastTargetRef.current = target;
      setStage("analyzing");
      setPipelineStep(0);
      setPipelineWaiting(false);
      setData(null);

      // Animate the pipeline while the API works in parallel.
      let acc = 0;
      STEP_DURATIONS.forEach((d, i) => {
        acc += d;
        timersRef.current.push(
          setTimeout(() => {
            if (runIdRef.current !== runId) return;
            setPipelineStep(i + 1);
            if (i === STEP_DURATIONS.length - 1) setPipelineWaiting(true);
          }, acc)
        );
      });

      requestAnimationFrame(() => {
        contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      const minDelay = new Promise<void>((resolve) => {
        timersRef.current.push(setTimeout(resolve, acc + 220));
      });

      try {
        const payloadPromise = (async (): Promise<AnalyzeResponse> => {
          let productId: string;
          if ("productId" in target) {
            productId = target.productId;
          } else {
            const q = target.query.trim();
            const searchRes = await fetch(`/api/products?q=${encodeURIComponent(q)}`);
            if (!searchRes.ok) throw new Error("Product search failed");
            const json = (await searchRes.json()) as { products: ProductSummary[] };
            if (!json.products || json.products.length === 0) throw new EmptySearchError();
            productId = json.products[0].id;
          }

          const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, marketplaces: mpsRef.current }),
          });
          if (!res.ok) throw new Error("Analysis failed");
          return (await res.json()) as AnalyzeResponse;
        })();

        const [payload] = await Promise.all([payloadPromise, minDelay]);
        if (runIdRef.current !== runId) return;
        setData(payload);
        setPipelineWaiting(false);
        setStage("results");
      } catch (error) {
        if (runIdRef.current !== runId) return;
        setStage(error instanceof EmptySearchError ? "empty" : "error");
      }
    },
    [clearTimers]
  );

  const busy = stage === "analyzing";

  const handleSubmit = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed || busy) return;
      setLastQuery(trimmed);
      void runAnalysis({ query: trimmed });
    },
    [busy, runAnalysis]
  );

  const handleToggleMarketplace = useCallback(
    (m: Marketplace) => {
      let next: Marketplace[];
      if (marketplaces.includes(m)) {
        if (marketplaces.length === 1) return; // keep at least one marketplace in scope
        next = marketplaces.filter((x) => x !== m);
      } else {
        next = ALL_MARKETPLACES.filter((x) => marketplaces.includes(x) || x === m);
      }
      setMarketplaces(next);
      mpsRef.current = next;
      // Re-run the last analysis under the new scope if results are visible.
      if (stage === "results" && lastTargetRef.current) {
        void runAnalysis(lastTargetRef.current);
      }
    },
    [marketplaces, runAnalysis, stage]
  );

  const handleSelectAlternative = useCallback(
    (id: string) => {
      if (busy) return;
      setLastQuery("");
      void runAnalysis({ productId: id });
    },
    [busy, runAnalysis]
  );

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <Hero
          query={query}
          onQueryChange={setQuery}
          marketplaces={marketplaces}
          onToggleMarketplace={handleToggleMarketplace}
          onSubmit={handleSubmit}
          busy={busy}
        />

        <div ref={contentRef} className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6 sm:pb-20">
          <AnimatePresence mode="wait">
            {stage === "analyzing" && (
              <Pipeline key="pipeline" step={pipelineStep} waiting={pipelineWaiting} />
            )}

            {stage === "results" && data && (
              <ResultsDashboard
                key={`results-${data.product.id}-${marketplaces.join(",")}`}
                data={data}
                onSelectAlternative={handleSelectAlternative}
                resultKey={`results-${data.product.id}-${marketplaces.join(",")}`}
              />
            )}

            {stage === "empty" && (
              <EmptyState
                key="empty"
                query={lastQuery || query}
                onExample={(q) => {
                  setQuery(q);
                  setLastQuery(q);
                  void runAnalysis({ query: q });
                }}
              />
            )}

            {stage === "error" && (
              <ErrorState
                key="error"
                onRetry={() => {
                  const t = lastTargetRef.current;
                  if (t) void runAnalysis(t);
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
