"use client";

import { motion, type Variants } from "framer-motion";
import { Star } from "lucide-react";
import type { Marketplace, VerdictLabel } from "@/lib/analysis-types";
import { MARKETPLACE_LABELS } from "@/lib/analysis-types";
import { cn } from "@/lib/utils";

/* --------------------------------- Motion --------------------------------- */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: 0.05 + i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

/* ------------------------------- Formatting ------------------------------- */

export function formatMoney(amount: number, currency: string): string {
  const rounded = Math.round(amount * 100) / 100;
  const isInt = Number.isInteger(rounded);
  const n = rounded.toLocaleString("en-US", {
    minimumFractionDigits: isInt ? 0 : 2,
    maximumFractionDigits: 2,
  });
  if (currency === "PKR") return `Rs ${n}`;
  if (currency === "USD") return `$${n}`;
  return `${n} ${currency}`;
}

/* ------------------------------ Verdict colors ---------------------------- */

export const VERDICT_STYLES: Record<VerdictLabel, { text: string; chip: string; dot: string }> = {
  Exceptional: {
    text: "text-gold",
    chip: "border-gold/40 bg-gold/10 text-gold",
    dot: "bg-gold",
  },
  "Strong Buy": {
    text: "text-gold-bright",
    chip: "border-gold-bright/35 bg-gold-bright/10 text-gold-bright",
    dot: "bg-gold-bright",
  },
  "Worth Considering": {
    text: "text-zinc-200",
    chip: "border-zinc-600/60 bg-zinc-500/10 text-zinc-200",
    dot: "bg-zinc-300",
  },
  "Think Twice": {
    text: "text-rose-400",
    chip: "border-rose-500/35 bg-rose-500/10 text-rose-400",
    dot: "bg-rose-400",
  },
  Avoid: {
    text: "text-rose-500",
    chip: "border-rose-500/45 bg-rose-500/15 text-rose-500",
    dot: "bg-rose-500",
  },
};

/* -------------------------------- Micro bits ------------------------------ */

export function MicroLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("micro-label", className)}>{children}</p>;
}

export function GoldRule({ className }: { className?: string }) {
  return <div className={cn("gold-rule", className)} aria-hidden="true" />;
}

export function MonogramTile({
  monogram,
  hue,
  size = "md",
  className,
}: {
  monogram: string;
  hue: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "size-10 rounded-lg text-sm",
    md: "size-14 rounded-xl text-lg",
    lg: "size-16 rounded-2xl text-xl sm:size-[72px]",
  } as const;
  return (
    <div
      aria-hidden="true"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 42% 26%) 0%, hsl(${hue} 48% 15%) 100%)`,
        boxShadow: `inset 0 0 0 1px hsla(${hue}, 50%, 60%, 0.22), 0 8px 28px -10px hsla(${hue}, 60%, 40%, 0.35)`,
      }}
      className={cn(
        "flex shrink-0 select-none items-center justify-center font-display font-semibold tracking-wide text-zinc-100",
        sizes[size],
        className
      )}
    >
      {monogram}
    </div>
  );
}

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i <= Math.round(rating) ? "fill-gold text-gold" : "fill-zinc-800 text-zinc-700"
          )}
        />
      ))}
    </span>
  );
}

const MP_DOT: Record<Marketplace, string> = {
  DARAZ: "bg-[#f68b1e]",
  AMAZON: "bg-gold-bright",
  ALIEXPRESS: "bg-[#e64340]",
  INSTAGRAM: "bg-[#ec4899]",
};

export function MarketplaceTag({ marketplace, className }: { marketplace: Marketplace; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-zinc-800/80 bg-zinc-900/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400",
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", MP_DOT[marketplace])} aria-hidden="true" />
      {MARKETPLACE_LABELS[marketplace]}
    </span>
  );
}

export function VerdictBadge({ label, score, className }: { label: VerdictLabel; score?: number; className?: string }) {
  const s = VERDICT_STYLES[label];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide",
        s.chip,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} aria-hidden="true" />
      {label}
      {typeof score === "number" && <span className="tabular-nums opacity-80">{score}/100</span>}
    </span>
  );
}

/* --------------------------------- Panel ---------------------------------- */

interface PanelCardProps {
  micro: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
  gold?: boolean;
  action?: React.ReactNode;
}

export function PanelCard({ micro, title, icon: Icon, children, className, gold = false, action }: PanelCardProps) {
  return (
    <motion.section
      variants={fadeUp}
      className={cn(
        "min-w-0 rounded-2xl border border-zinc-800/60 bg-card p-5 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)] sm:p-6",
        gold && "border-gold/25 gold-glow",
        className
      )}
    >
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <MicroLabel>{micro}</MicroLabel>
          <h3 className="mt-1 font-display text-xl leading-snug text-zinc-50">{title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-3 pt-0.5">
          {action}
          <span className={cn("flex size-8 items-center justify-center rounded-lg border", gold ? "border-gold/25 bg-gold/10" : "border-zinc-800/80 bg-zinc-900/60")}>
            <Icon className={cn("size-4", gold ? "text-gold" : "text-zinc-500")} aria-hidden="true" />
          </span>
        </div>
      </header>
      {children}
    </motion.section>
  );
}

/* --------------------------------- Sparkline ------------------------------ */

export function Sparkline({
  points,
  id,
  stroke = "#d4a24e",
  height = 72,
  className,
}: {
  points: number[];
  id: string;
  stroke?: string;
  height?: number;
  className?: string;
}) {
  const W = 300;
  const H = height;
  const PAD_Y = 8;
  const PAD_X = 4;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const xs = points.map((_, i) => PAD_X + (i / Math.max(1, points.length - 1)) * (W - PAD_X * 2));
  const ys = points.map((p) => PAD_Y + (1 - (p - min) / span) * (H - PAD_Y * 2));
  const line = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
  const area = `${line} L${xs[xs.length - 1].toFixed(1)} ${H} L${xs[0].toFixed(1)} ${H} Z`;
  const lastX = xs[xs.length - 1];
  const lastY = ys[ys.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn("h-full w-full", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={area}
        fill={`url(#${id}-fill)`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.55 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.15, ease: "easeOut", delay: 0.15 }}
      />
      <motion.circle
        cx={lastX}
        cy={lastY}
        r="3.2"
        fill={stroke}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.3 }}
      />
    </svg>
  );
}
