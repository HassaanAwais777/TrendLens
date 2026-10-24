// Shared types for the TrendLens analysis pipeline.
// Imported by both the server-side engine (src/lib/analysis.ts) and client components.

export type Marketplace = "DARAZ" | "AMAZON" | "ALIEXPRESS" | "INSTAGRAM";

export const MARKETPLACE_LABELS: Record<Marketplace, string> = {
  DARAZ: "Daraz",
  AMAZON: "Amazon",
  ALIEXPRESS: "AliExpress",
  INSTAGRAM: "Instagram/TikTok",
};

export const ALL_MARKETPLACES: Marketplace[] = [
  "DARAZ",
  "AMAZON",
  "ALIEXPRESS",
  "INSTAGRAM",
];

export type AspectKey =
  | "quality"
  | "fit"
  | "comfort"
  | "price"
  | "shipping"
  | "durability";

export const ASPECT_LABELS: Record<AspectKey, string> = {
  quality: "Quality",
  fit: "Fit & Sizing",
  comfort: "Comfort",
  price: "Price",
  shipping: "Shipping",
  durability: "Durability",
};

export const VERDICT_LABELS = {
  EXCEPTIONAL: "Exceptional",
  STRONG_BUY: "Strong Buy",
  WORTH_CONSIDERING: "Worth Considering",
  THINK_TWICE: "Think Twice",
  AVOID: "Avoid",
} as const;

export type VerdictLabel = (typeof VERDICT_LABELS)[keyof typeof VERDICT_LABELS];

export function verdictLabelFor(score: number): VerdictLabel {
  if (score >= 80) return VERDICT_LABELS.EXCEPTIONAL;
  if (score >= 65) return VERDICT_LABELS.STRONG_BUY;
  if (score >= 50) return VERDICT_LABELS.WORTH_CONSIDERING;
  if (score >= 35) return VERDICT_LABELS.THINK_TWICE;
  return VERDICT_LABELS.AVOID;
}

/* ---------------------------------- Search --------------------------------- */

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  hue: number;
  priceFrom: number;
  currency: string;
}

/* ------------------------------ Analysis payload --------------------------- */

export interface ProductHeader {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  hue: number;
  monogram: string;
  priceFrom: number;
  priceTo: number;
  primaryCurrency: "PKR" | "USD";
  totalReviews: number;
  sources: number;
  avgRating: number;
  verdictLabel: VerdictLabel;
}

export type VerdictComponentKey =
  | "reviewQuality"
  | "sentiment"
  | "priceFairness"
  | "fitAccuracy";

export interface VerdictComponent {
  key: VerdictComponentKey;
  label: string;
  weight: number;
  score: number;
}

export interface VerdictPayload {
  score: number;
  label: VerdictLabel;
  statement: string;
  components: VerdictComponent[];
}

export interface AspectScore {
  key: AspectKey;
  label: string;
  score: number; // -100..+100
  mentions: number;
}

export interface SentimentPayload {
  positive: number; // share 0-100
  neutral: number;
  negative: number;
  totalReviews: number;
  aspects: AspectScore[];
}

export type Severity = "Low" | "Medium" | "High";

export interface RadarFinding {
  pattern: string;
  description: string;
  severity: Severity;
  evidence: string;
}

export interface RadarPayload {
  authenticity: number; // 0-100
  clean: boolean;
  findings: RadarFinding[];
  analyzed: number;
}

export interface StoreRow {
  marketplace: Marketplace;
  price: number;
  currency: string;
  originalPrice: number | null;
  rating: number;
  reviewCount: number;
  deliveryDays: number;
}

export type BuyTiming = "Buy now" | "Wait" | "Neutral";

export interface PricePayload {
  history: number[]; // 12 weeks, primary currency
  current: number;
  avg90: number;
  deltaPct: number;
  weekLow: number;
  weekHigh: number;
  timing: BuyTiming;
  timingNote: string;
  currency: "PKR" | "USD";
  stores: StoreRow[];
}

export interface FitPayload {
  runsSmall: number; // % of fit mentions
  trueToSize: number;
  runsLarge: number;
  summary: string;
  guidance: string;
  mentions: number;
}

export type Momentum = "Rising" | "Stable" | "Cooling";

export interface TrendPayload {
  momentum: Momentum;
  changePct: number; // interest change over trailing 8 weeks
  changeNote: string;
  peakNote: string;
  points: number[]; // 12 weeks, 0-100
}

export interface RepresentativeReview {
  id: string;
  author: string;
  rating: number;
  title: string;
  excerpt: string;
  marketplace: Marketplace;
  dateLabel: string;
  verified: boolean;
  tone: "positive" | "mixed" | "negative";
}

export interface AlternativeProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  hue: number;
  priceFrom: number;
  currency: "PKR" | "USD";
  score: number;
  label: VerdictLabel;
  sentimentChip: "Positive" | "Mixed" | "Negative";
  strength: string;
  sameCategory: boolean;
}

export interface AnalyzeResponse {
  product: ProductHeader;
  verdict: VerdictPayload;
  sentiment: SentimentPayload;
  radar: RadarPayload;
  price: PricePayload;
  fit: FitPayload;
  trend: TrendPayload;
  pros: string[];
  cons: string[];
  reviews: RepresentativeReview[];
  alternatives: AlternativeProduct[];
  analyzedMarketplaces: Marketplace[];
  generatedAt: string;
}

export interface AnalyzeRequest {
  productId: string;
  marketplaces: string[];
}
