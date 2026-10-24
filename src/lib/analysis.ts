// TrendLens deterministic analysis engine (server-side).
// Lexicon-based sentiment, review-quality scoring, fake-review heuristics,
// price intelligence, fit inference and composite verdict scoring.
// No external NLP dependencies, fully deterministic.

import {
  ALL_MARKETPLACES,
  ASPECT_LABELS,
  AspectKey,
  AlternativeProduct,
  AnalyzeResponse,
  BuyTiming,
  Marketplace,
  Momentum,
  ProductHeader,
  RadarFinding,
  RepresentativeReview,
  Severity,
  StoreRow,
  VerdictComponent,
  VerdictLabel,
  verdictLabelFor,
} from "@/lib/analysis-types";

/* ================================ Lexicons ================================ */

const POSITIVE_WORDS: Record<string, number> = {
  love: 2, loved: 2, loves: 2, great: 1.6, amazing: 2, excellent: 2, perfect: 2,
  awesome: 2, good: 1.2, comfortable: 1.8, comfy: 1.5, soft: 1.4, warmer: 1.4,
  warm: 1.4, breathable: 1.6, durable: 1.8, sturdy: 1.6, stylish: 1.6,
  beautiful: 1.8, gorgeous: 2, worth: 1.5, value: 1.2, fast: 1.2, quick: 1.2,
  recommend: 1.6, recommended: 1.6, happy: 1.5, satisfied: 1.6, fits: 1.4,
  fitted: 1.4, flattering: 1.6, premium: 1.6, crisp: 1.3, smooth: 1.2,
  reliable: 1.6, superb: 2, fantastic: 2, delighted: 1.8, impressed: 1.7,
  flawless: 2, elegant: 1.6, well: 0.9, best: 1.8, nicely: 1.3, solid: 1.2,
  appreciated: 1.3, charming: 1.4, rich: 1.1, deep: 0.8, true: 0.8, clean: 1.1,
  fresh: 1.2, pleasant: 1.3, gem: 1.6, classy: 1.5, gorgeousness: 2,
};

const NEGATIVE_WORDS: Record<string, number> = {
  bad: 1.6, poor: 1.7, terrible: 2, awful: 2, cheap: 1.4, flimsy: 1.9,
  uncomfortable: 1.9, scratchy: 1.7, itchy: 1.6, thin: 1.1, ripped: 1.9,
  tore: 1.7, torn: 1.7, fell: 1.5, apart: 1.5, faded: 1.5, shrunk: 1.8,
  shrink: 1.7, shrank: 1.8, tight: 1.2, loose: 1.1, late: 1.4, slow: 1.3,
  disappointed: 1.9, disappointing: 1.9, waste: 1.9, return: 1.3, returned: 1.3,
  refund: 1.4, broke: 1.7, damaged: 1.7, smell: 1.3, odor: 1.3, fake: 2,
  counterfeit: 2, wrong: 1.4, uneven: 1.4, pilling: 1.6, pilled: 1.6,
  stiff: 1.1, rough: 1.3, mediocre: 1.5, overpriced: 1.9, regret: 1.9,
  useless: 1.9, worse: 1.6, worst: 2, horrible: 2, cracking: 1.5, peeled: 1.7,
  peeling: 1.7, stained: 1.5, delayed: 1.5,
  misshapen: 1.6, awkward: 1.2, bulky: 1.1, sloppy: 1.6, flaking: 1.6,
  avoid: 1.8, dishonest: 2, scam: 2, duped: 1.8,
};

const INTENSIFIERS = new Set([
  "very", "really", "extremely", "super", "so", "incredibly", "absolutely",
  "totally", "utterly", "highly", "quite", "insanely", "crazy",
]);

const NEGATORS = new Set([
  "not", "no", "never", "dont", "doesn't", "doesnt", "didn't", "didnt",
  "wouldn't", "wouldnt", "won't", "wont", "wasn't", "wasnt", "isn't", "isnt",
  "aren't", "arent", "hardly", "barely", "cannot", "can't", "cant",
]);

const SUPERLATIVES = new Set([
  "amazing", "perfect", "best", "love", "loved", "excellent", "awesome",
  "wow", "great", "superb", "fantastic", "good", "nice", "recommend",
  "recommended", "beautiful", "gorgeous",
]);

export const ASPECT_KEYWORDS: Record<AspectKey, string[]> = {
  quality: ["quality", "material", "fabric", "stitching", "stitch", "sewn", "seams", "seam", "craftsmanship", "embroidery"],
  fit: ["size", "fit", "fits", "fitted", "sizing", "small", "large", "tight", "loose", "snug"],
  comfort: ["comfortable", "comfort", "soft", "warm", "breathable", "cozy", "itchy", "scratchy", "plush"],
  price: ["price", "worth", "expensive", "cheap", "value", "overpriced", "bargain", "affordable", "deal"],
  shipping: ["delivery", "shipping", "arrived", "packaging", "packaged", "delivered", "courier", "box"],
  durability: ["durable", "lasted", "lasting", "fell", "apart", "torn", "ripped", "pilling", "pilled", "peeling", "wear"],
};

const FIT_SMALL = /runs? (?:small|smaller|snug|tight)|too small|size up|sized up|order a size|half size (?:up|larger)|smaller than expected|tight (?:fit|around)/i;
const FIT_LARGE = /runs? (?:large|big|roomy)|too (?:large|big)|size down|sized down|bigger than expected|roomy (?:fit|cut)/i;
const FIT_TRUE = /true to size|fits? (?:perfectly|as expected|great|well|nicely)|perfect fit|as per (?:the )?size chart|size chart/i;

/* ================================ Utilities =============================== */

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

const FX_TO_USD: Record<string, number> = { USD: 1, PKR: 278 };

function normalizePrice(price: number, currency: string): number {
  return price / (FX_TO_USD[currency] ?? 1);
}

/** Cross-store price range normalized into the product's primary currency. */
export function priceRange(listings: AnalysisListing[]): {
  min: number;
  max: number;
  currency: "PKR" | "USD";
} {
  const currency: "PKR" | "USD" = listings.some((l) => l.currency === "PKR") ? "PKR" : "USD";
  const normalized = listings.map((l) => normalizePrice(l.price, l.currency));
  const factor = currency === "PKR" ? FX_TO_USD.PKR : 1;
  if (normalized.length === 0) return { min: 0, max: 0, currency };
  return {
    min: Math.round(Math.min(...normalized) * factor),
    max: Math.round(Math.max(...normalized) * factor),
    currency,
  };
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^'+|'+$/g, ""))
    .filter(Boolean);
}

function splitSentences(text: string): string[] {
  return text
    .split(/[.!?;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

/** Lexicon sentiment for a text, returns value in [-1, 1]. */
function scoreText(text: string): number {
  const tokens = tokenize(text);
  let sum = 0;
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    let val = POSITIVE_WORDS[tok] ?? 0;
    if (val === 0) val = -(NEGATIVE_WORDS[tok] ?? 0);
    if (val === 0) continue;
    // negation flips within a 3-token lookbehind window
    let negated = false;
    for (let j = Math.max(0, i - 3); j < i; j++) {
      if (NEGATORS.has(tokens[j])) negated = true;
    }
    if (negated) val = -val * 0.9;
    // intensifier multiplies
    if (i > 0 && INTENSIFIERS.has(tokens[i - 1])) val *= 1.6;
    sum += val;
  }
  // length-aware normalization keeps long multi-aspect reviews from saturating
  return Math.tanh(sum / Math.max(3, tokens.length * 0.11));
}

/* ================================ Record shape ============================ */

export interface AnalysisReview {
  id: string;
  marketplace: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  daysAgo: number;
  verified: boolean;
}

export interface AnalysisListing {
  marketplace: string;
  price: number;
  currency: string;
  originalPrice: number | null;
  rating: number;
  reviewCount: number;
  deliveryDays: number;
}

export interface AnalysisRecord {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  hue: number;
  peakWeek: number | null;
  listings: AnalysisListing[];
  priceHistory: number[];
  trendPoints: number[];
  reviews: AnalysisReview[];
}

/* ============================== Sentiment core ============================ */

interface ReviewSentiment { score: number; tone: "positive" | "neutral" | "negative" }

function reviewSentiments(reviews: AnalysisReview[]): ReviewSentiment[] {
  return reviews.map((r) => {
    const score = scoreText(`${r.title}. ${r.body}`);
    const tone = score > 0.15 ? "positive" : score < -0.15 ? "negative" : "neutral";
    return { score, tone };
  });
}

function aspectMentionScore(sentence: string): number {
  const tokens = tokenize(sentence);
  let sum = 0;
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    let val = POSITIVE_WORDS[tok] ?? 0;
    if (val === 0) val = -(NEGATIVE_WORDS[tok] ?? 0);
    if (val === 0) continue;
    let negated = false;
    for (let j = Math.max(0, i - 3); j < i; j++) {
      if (NEGATORS.has(tokens[j])) negated = true;
    }
    if (negated) val = -val * 0.9;
    if (i > 0 && INTENSIFIERS.has(tokens[i - 1])) val *= 1.6;
    sum += val;
  }
  return Math.tanh(sum / 3) * 100;
}

function computeAspects(reviews: AnalysisReview[]): { aspects: { key: AspectKey; score: number; mentions: number }[] } {
  const buckets: Record<AspectKey, { total: number; mentions: number }> = {
    quality: { total: 0, mentions: 0 },
    fit: { total: 0, mentions: 0 },
    comfort: { total: 0, mentions: 0 },
    price: { total: 0, mentions: 0 },
    shipping: { total: 0, mentions: 0 },
    durability: { total: 0, mentions: 0 },
  };
  for (const r of reviews) {
    for (const sentence of splitSentences(`${r.title}. ${r.body}`)) {
      const lower = sentence.toLowerCase();
      const s = aspectMentionScore(sentence);
      for (const key of Object.keys(ASPECT_KEYWORDS) as AspectKey[]) {
        if (ASPECT_KEYWORDS[key].some((kw) => lower.includes(kw))) {
          // fit phrases carry directional meaning beyond lexicon words
          const fitBias =
            key === "fit"
              ? FIT_TRUE.test(sentence)
                ? 10
                : FIT_SMALL.test(sentence)
                  ? -70
                  : FIT_LARGE.test(sentence)
                    ? -20
                    : 0
              : 0;
          buckets[key].total += s + fitBias;
          buckets[key].mentions += 1;
        }
      }
    }
  }
  const aspects = (Object.keys(buckets) as AspectKey[]).map((key) => ({
    key,
    score: buckets[key].mentions > 0 ? Math.round(clamp(buckets[key].total / buckets[key].mentions, -100, 100)) : 0,
    mentions: buckets[key].mentions,
  }));
  return { aspects };
}

/* ============================ Duplicate detection ========================= */

function bodyTokens(body: string): Set<string> {
  return new Set(tokenize(body).filter((t) => t.length > 2));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

function findDuplicateBodies(reviews: AnalysisReview[]): AnalysisReview[][] {
  const tokenized = reviews.map((r) => ({ r, tokens: bodyTokens(`${r.title} ${r.body}`) }));
  const clusters: AnalysisReview[][] = [];
  const assigned = new Set<number>();
  for (let i = 0; i < tokenized.length; i++) {
    if (assigned.has(i)) continue;
    const cluster = [tokenized[i].r];
    for (let j = i + 1; j < tokenized.length; j++) {
      if (assigned.has(j)) continue;
      if (jaccard(tokenized[i].tokens, tokenized[j].tokens) >= 0.8) {
        cluster.push(tokenized[j].r);
        assigned.add(j);
      }
    }
    if (cluster.length >= 2) {
      assigned.add(i);
      clusters.push(cluster);
    }
  }
  return clusters;
}

function detectBurst(reviews: AnalysisReview[]): { found: boolean; maxWindow: number; daysAgo: number } {
  const perDay = new Map<number, number>();
  for (const r of reviews) perDay.set(r.daysAgo, (perDay.get(r.daysAgo) ?? 0) + 1);
  const days = [...perDay.keys()].sort((a, b) => a - b);
  let maxWindow = 0;
  let windowStart = 0;
  for (const d of days) {
    let count = 0;
    for (let x = d; x <= d + 3; x++) count += perDay.get(x) ?? 0;
    if (count > maxWindow) {
      maxWindow = count;
      windowStart = d;
    }
  }
  return { found: maxWindow >= 5, maxWindow, daysAgo: windowStart };
}

/* ============================== Panel builders ============================ */

function buildRadar(reviews: AnalysisReview[]): {
  authenticity: number;
  findings: RadarFinding[];
} {
  const total = reviews.length || 1;
  const findings: RadarFinding[] = [];
  let penalty = 0;

  // 1. Near-duplicate clusters
  const clusters = findDuplicateBodies(reviews);
  const dupCount = clusters.reduce((acc, c) => acc + c.length, 0);
  const dupShare = dupCount / total;
  if (clusters.length > 0) {
    const biggest = Math.max(...clusters.map((c) => c.length));
    const severity: Severity = biggest >= 4 ? "High" : biggest >= 3 ? "Medium" : "Low";
    findings.push({
      pattern: "Duplicate review cluster",
      description: `${dupCount} reviews across ${clusters.length} cluster${clusters.length > 1 ? "s" : ""} share near-identical wording — a common sign of coordinated posting.`,
      severity,
      evidence: `Largest cluster: ${biggest} reviews · ${round1(dupShare * 100)}% of corpus`,
    });
    penalty += dupShare * 140;
  }

  // 2. Rating burst in a short window
  const burst = detectBurst(reviews);
  if (burst.found) {
    const severity: Severity = burst.maxWindow >= 8 ? "High" : "Medium";
    findings.push({
      pattern: "Rating burst",
      description: `${burst.maxWindow} reviews landed inside a single 3-day window — organic volume rarely spikes this sharply.`,
      severity,
      evidence: `Burst window began ${burst.daysAgo} days ago`,
    });
    penalty += 16 + Math.max(0, burst.maxWindow - 5) * 2;
  }

  // 3. Unverified share
  const unverified = reviews.filter((r) => !r.verified).length;
  const unverifiedShare = unverified / total;
  if (unverifiedShare > 0.5) {
    const severity: Severity = unverifiedShare > 0.68 ? "High" : "Medium";
    findings.push({
      pattern: "High unverified share",
      description: `${round1(unverifiedShare * 100)}% of reviews have no verified purchase attached, above the 50% caution threshold.`,
      severity,
      evidence: `${unverified} of ${reviews.length} unverified`,
    });
    penalty += Math.max(0, unverifiedShare - 0.42) * 70;
  }

  // 4. Generic-praise density (short, superlative-heavy 5-star reviews)
  const generic = reviews.filter((r) => {
    if (r.rating !== 5) return false;
    const words = tokenize(`${r.title} ${r.body}`);
    if (words.length > 9) return false;
    return words.some((w) => SUPERLATIVES.has(w));
  }).length;
  const genericShare = generic / total;
  if (genericShare >= 0.12) {
    const severity: Severity = genericShare >= 0.25 ? "High" : "Medium";
    findings.push({
      pattern: "Generic-praise density",
      description: `${round1(genericShare * 100)}% of reviews are short 5-star texts built on superlatives with no product specifics.`,
      severity,
      evidence: `${generic} generic 5-star reviews`,
    });
    penalty += genericShare * 110;
  }

  // 5. Sentiment-vs-rating mismatch
  const mismatches = reviews.filter((r) => {
    const s = scoreText(r.body);
    return (r.rating === 5 && s < -0.05) || (r.rating <= 2 && s > 0.3);
  }).length;
  const mismatchShare = mismatches / total;
  if (mismatchShare >= 0.08) {
    const severity: Severity = mismatchShare >= 0.15 ? "High" : "Medium";
    findings.push({
      pattern: "Sentiment–rating mismatch",
      description: `${mismatches} reviews pair their star rating with contradictory language — a hallmark of templated or incentivized posting.`,
      severity,
      evidence: `${round1(mismatchShare * 100)}% of corpus`,
    });
    penalty += mismatchShare * 160;
  }

  const authenticity = Math.round(clamp(100 - penalty, 3, 100));
  return { authenticity, findings };
}

function buildReviewQuality(reviews: AnalysisReview[], dupShare: number): number {
  if (reviews.length === 0) return 50;
  const total = reviews.length;
  const verifiedShare = reviews.filter((r) => r.verified).length / total;
  const longShare = reviews.filter((r) => tokenize(`${r.title} ${r.body}`).length >= 15).length / total;
  const aspectWords = Object.values(ASPECT_KEYWORDS).flat();
  const specificityShare =
    reviews.filter((r) => {
      const lower = `${r.title} ${r.body}`.toLowerCase();
      return aspectWords.some((w) => lower.includes(w)) || /\d/.test(lower);
    }).length / total;

  const ratings = reviews.map((r) => r.rating);
  const mean = ratings.reduce((a, b) => a + b, 0) / total;
  const variance = ratings.reduce((a, b) => a + (b - mean) ** 2, 0) / total;
  const varianceScore = clamp(10 - Math.abs(variance - 1.8) * 4, 0, 10);
  const fiveStarShare = ratings.filter((r) => r === 5).length / total;
  const fiveStarExcess = Math.max(0, fiveStarShare - 0.72);

  const quality =
    15 +
    verifiedShare * 30 +
    longShare * 25 +
    specificityShare * 15 +
    varianceScore -
    dupShare * 30 -
    fiveStarExcess * 50;

  return Math.round(clamp(quality, 5, 100));
}

function buildPrice(record: AnalysisRecord, listings: AnalysisListing[]): {
  price: AnalyzeResponse["price"];
  fairness: number;
} {
  const primaryCurrency: "PKR" | "USD" =
    listings.find((l) => l.marketplace === "DARAZ")?.currency === "PKR" || listings.some((l) => l.currency === "PKR")
      ? "PKR"
      : "USD";

  const history = record.priceHistory;
  const avg90 = history.reduce((a, b) => a + b, 0) / (history.length || 1);
  const weekLow = Math.min(...history);
  const weekHigh = Math.max(...history);

  const current =
    listings.length > 0
      ? listings
          .filter((l) => l.currency === primaryCurrency)
          .reduce((a, b) => a + b.price, 0) /
        Math.max(1, listings.filter((l) => l.currency === primaryCurrency).length)
      : history[history.length - 1] ?? avg90;

  const deltaPct = avg90 > 0 ? round1(((current - avg90) / avg90) * 100) : 0;
  const range = weekHigh - weekLow;
  const position = range > 0 ? (weekHigh - current) / range : 0.5;

  let timing: BuyTiming = "Neutral";
  if (position >= 0.78) timing = "Buy now";
  else if (position <= 0.32) timing = "Wait";

  const timingNote =
    timing === "Buy now"
      ? "Current price sits near its 12-week low — historically a good entry point."
      : timing === "Wait"
        ? "Current price is close to the 12-week high — a dip looks likely if history repeats."
        : "Price is near its 12-week average — no strong signal either way.";

  let fairness = clamp(Math.round(18 + position * 72), 5, 100);
  if (current > avg90 * 1.06) fairness = Math.min(fairness, 42);
  if (current < avg90 * 0.94) fairness = Math.max(fairness, 72);

  const stores: StoreRow[] = listings.map((l) => ({
    marketplace: l.marketplace as Marketplace,
    price: l.price,
    currency: l.currency,
    originalPrice: l.originalPrice,
    rating: l.rating,
    reviewCount: l.reviewCount,
    deliveryDays: l.deliveryDays,
  }));

  return {
    price: {
      history: history.map((p) => Math.round(p)),
      current: Math.round(current),
      avg90: Math.round(avg90),
      deltaPct,
      weekLow: Math.round(weekLow),
      weekHigh: Math.round(weekHigh),
      timing,
      timingNote,
      currency: primaryCurrency,
      stores,
    },
    fairness,
  };
}

function buildFit(reviews: AnalysisReview[]): { fit: AnalyzeResponse["fit"]; accuracy: number } {
  let small = 0;
  let large = 0;
  let trueSize = 0;
  for (const r of reviews) {
    const text = `${r.title}. ${r.body}`;
    if (FIT_TRUE.test(text)) trueSize++;
    else if (FIT_SMALL.test(text)) small++;
    else if (FIT_LARGE.test(text)) large++;
  }
  const mentions = small + large + trueSize;
  if (mentions === 0) {
    return {
      fit: {
        runsSmall: 0,
        trueToSize: 0,
        runsLarge: 0,
        summary: "Not enough sizing signals in this review set",
        guidance: "No reliable fit pattern detected — consult the size chart for this brand.",
        mentions: 0,
      },
      accuracy: 55,
    };
  }
  const pct = (v: number) => Math.round((v / mentions) * 100);
  const runsSmall = pct(small);
  const runsLarge = pct(large);
  const tts = pct(trueSize);

  let guidance: string;
  if (runsSmall > runsLarge + 10) {
    guidance = "Most buyers recommend sizing up — consider half a size above your usual.";
  } else if (runsLarge > runsSmall + 10) {
    guidance = "The cut runs roomy — several buyers suggest sizing down.";
  } else {
    guidance = "Sizing tracks the size chart closely — order your usual fit with confidence.";
  }

  const fitSummary =
    tts >= Math.max(runsSmall, runsLarge)
      ? `${tts}% say true to size`
      : runsSmall >= runsLarge
        ? `${runsSmall}% report it runs small`
        : `${runsLarge}% report it runs large`;

  const accuracy = clamp(Math.round(28 + (tts / 100) * 72), 5, 100);

  return {
    fit: {
      runsSmall,
      trueToSize: tts,
      runsLarge,
      summary: fitSummary,
      guidance,
      mentions,
    },
    accuracy,
  };
}

function buildTrend(record: AnalysisRecord): AnalyzeResponse["trend"] {
  const points = record.trendPoints;
  const p3 = points[3] ?? points[0] ?? 50;
  const p11 = points[11] ?? p3;
  const changePct = p3 > 0 ? Math.round(((p11 - p3) / p3) * 100) : 0;

  let momentum: Momentum = "Stable";
  if (changePct >= 8) momentum = "Rising";
  else if (changePct <= -8) momentum = "Cooling";

  const peakIdx = points.indexOf(Math.max(...points));
  const peakWeek = record.peakWeek ?? peakIdx;
  const weekName = (w: number) => `week ${w + 1}`;

  let peakNote: string;
  if (momentum === "Rising") {
    peakNote = "No peak yet — interest is still climbing into the current week.";
  } else if (momentum === "Cooling") {
    peakNote = `Search interest peaked around ${weekName(peakWeek)} and has eased since.`;
  } else {
    peakNote = "Interest has been steady across the 12-week window — no pronounced peak.";
  }

  const changeNote = `Search interest ${changePct >= 0 ? "+" : ""}${changePct}% over the trailing 8 weeks`;

  return { momentum, changePct, changeNote, peakNote, points: points.map((p) => Math.round(p)) };
}

/* =============================== Narrative =============================== */

const ASPECT_PHRASES: Record<AspectKey, string> = {
  quality: "material & stitching",
  fit: "true-to-size consistency",
  comfort: "all-day comfort",
  price: "value for money",
  shipping: "the delivery experience",
  durability: "long-term durability",
};

const PRO_TEMPLATES: Record<AspectKey, (n: number) => string> = {
  quality: (n) => `Material and stitching hold up well across ${n} quality mentions`,
  fit: (n) => `Sizing runs true to the chart for most of the ${n} fit mentions`,
  comfort: (n) => `Reviewers repeatedly call out comfort (${n} mentions)`,
  price: (n) => `Buyers consider the price fair for what you get (${n} mentions)`,
  shipping: (n) => `Delivery experience is praised in ${n} mentions`,
  durability: (n) => `Holds up over time — ${n} durability mentions skew positive`,
};

const CON_TEMPLATES: Record<AspectKey, (n: number) => string> = {
  quality: (n) => `Quality complaints appear across ${n} mentions — stitching and material draw criticism`,
  fit: (n) => `Fit is divisive — ${n} sizing mentions skew negative (check size chart)`,
  comfort: (n) => `Comfort complaints in ${n} mentions — not for everyone`,
  price: (n) => `A vocal share of ${n} price mentions call it overpriced`,
  shipping: (n) => `Shipping friction shows up in ${n} mentions (delays, packaging)`,
  durability: (n) => `Durability concerns raised in ${n} mentions — wear shows early`,
};

function buildProsCons(
  aspects: { key: AspectKey; score: number; mentions: number }[],
  verdictComponents: VerdictComponent[],
  priceTiming: BuyTiming,
  radarClean: boolean,
  currentVsAvg: number
): { pros: string[]; cons: string[] } {
  const pros: string[] = [];
  const cons: string[] = [];

  for (const a of [...aspects].sort((x, y) => y.score - x.score)) {
    if (a.score >= 25 && a.mentions >= 2 && pros.length < 4) {
      pros.push(PRO_TEMPLATES[a.key](a.mentions));
    }
    if (a.score <= -20 && a.mentions >= 2 && cons.length < 3) {
      cons.push(CON_TEMPLATES[a.key](a.mentions));
    }
  }

  const comp = (k: VerdictComponent["key"]) => verdictComponents.find((c) => c.key === k)!;
  if (priceTiming === "Buy now" && pros.length < 4) {
    pros.push(`Priced ${Math.abs(currentVsAvg)}% below its 90-day average right now`);
  }
  if (priceTiming === "Wait" && cons.length < 3) {
    cons.push(`Currently ${Math.abs(currentVsAvg)}% above its 90-day average — waiting may pay off`);
  }
  if (radarClean && pros.length < 4) pros.push("Fake-review radar came back clean — signals look organic");
  if (comp("reviewQuality").score < 45 && cons.length < 3) {
    cons.push("Review corpus is thin on detail — treat scores with wider error bars");
  }

  while (pros.length < 3) {
    const best = [...verdictComponents].sort((a, b) => b.score - a.score)[0];
    pros.push(`Strongest signal: ${best.label.toLowerCase()} at ${best.score}/100`);
    break;
  }
  while (cons.length < 2) {
    const worst = [...verdictComponents].sort((a, b) => a.score - b.score)[0];
    if (worst.score >= 95) cons.push("No material weaknesses detected — the main risk is price movement");
    else cons.push(`Weakest signal: ${worst.label.toLowerCase()} at ${worst.score}/100`);
    break;
  }

  return { pros: pros.slice(0, 4), cons: cons.slice(0, 3) };
}

function buildStatement(label: VerdictLabel, components: VerdictComponent[]): string {
  const sorted = [...components].sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  switch (label) {
    case "Exceptional":
      return `Earns its score on every axis — ${best.label.toLowerCase()} leads at ${best.score}/100 and even the weakest signal (${worst.label.toLowerCase()}) is healthy.`;
    case "Strong Buy":
      return `Solid, trustworthy signals — ${best.label.toLowerCase()} stands out at ${best.score}/100, with ${worst.label.toLowerCase()} (${worst.score}/100) as the only soft spot.`;
    case "Worth Considering":
      return `A mixed but honest picture — ${best.label.toLowerCase()} (${best.score}/100) gives it an edge, while ${worst.label.toLowerCase()} (${worst.score}/100) holds it back.`;
    case "Think Twice":
      return `Real concerns here — ${worst.label.toLowerCase()} drops to ${worst.score}/100 and drags the overall call below the safe zone.`;
    default:
      return `Signals do not add up — ${worst.label.toLowerCase()} collapses to ${worst.score}/100 and the evidence conflicts with the hype.`;
  }
}

/* ============================== Review curation ========================== */

function dateLabel(daysAgo: number): string {
  if (daysAgo <= 1) return "today";
  if (daysAgo < 7) return `${daysAgo} days ago`;
  if (daysAgo < 30) {
    const w = Math.max(1, Math.round(daysAgo / 7));
    return w === 1 ? "1 week ago" : `${w} weeks ago`;
  }
  if (daysAgo < 365) {
    const m = Math.max(1, Math.round(daysAgo / 30));
    return m === 1 ? "1 month ago" : `${m} months ago`;
  }
  return "over a year ago";
}

function buildRepresentativeReviews(
  reviews: AnalysisReview[],
  sentiments: ReviewSentiment[]
): RepresentativeReview[] {
  if (reviews.length === 0) return [];
  const withScores = reviews.map((r, i) => ({ r, s: sentiments[i] }));
  const usedAuthors = new Set<string>();

  const pick = (
    pool: typeof withScores,
    sortFn: (a: (typeof withScores)[0], b: (typeof withScores)[0]) => number
  ): (typeof withScores)[0] | null => {
    const sorted = [...pool].sort(sortFn);
    for (const cand of sorted) {
      if (!usedAuthors.has(cand.r.author)) {
        usedAuthors.add(cand.r.author);
        return cand;
      }
    }
    return null;
  };

  const positives = withScores.filter((x) => x.s.tone === "positive");
  const negatives = withScores.filter((x) => x.s.tone === "negative");
  const mids = withScores.filter((x) => x.s.tone === "neutral" || x.r.rating === 3);

  const picks: (typeof withScores) = [];
  const p1 = pick(positives, (a, b) =>
    b.r.verified !== a.r.verified ? (b.r.verified ? 1 : -1) : b.s.score - a.s.score
  );
  if (p1) picks.push(p1);
  const p2 = pick(positives, (a, b) => b.s.score - a.s.score);
  if (p2) picks.push(p2);
  const mid = pick(mids, (a, b) => Math.abs(a.s.score) - Math.abs(b.s.score));
  if (mid) picks.push(mid);
  const neg = pick(negatives, (a, b) => a.s.score - b.s.score);
  if (neg) picks.push(neg);

  return picks.slice(0, 4).map(({ r, s }) => ({
    id: r.id,
    author: r.author,
    rating: r.rating,
    title: r.title,
    excerpt: r.body.length > 240 ? `${r.body.slice(0, 237).trimEnd()}…` : r.body,
    marketplace: r.marketplace as Marketplace,
    dateLabel: dateLabel(r.daysAgo),
    verified: r.verified,
    tone: s.tone === "neutral" && r.rating === 3 ? "mixed" : s.tone,
  }));
}

/* ============================== Main analyzer ============================= */

function monogramOf(brand: string, name: string): string {
  const cleanName = name.replace(brand, "").trim();
  const firstWord = (cleanName || name).split(/\s+/)[0] ?? name;
  const b = (brand.match(/[A-Za-z]/)?.[0] ?? "T").toUpperCase();
  const n = (firstWord.match(/[A-Za-z]/)?.[0] ?? "P").toUpperCase();
  return `${b}${n}`;
}

/** Analyze a product record scoped to the given marketplaces. */
export function analyzeProduct(
  record: AnalysisRecord,
  marketplaces: Marketplace[] = ALL_MARKETPLACES
): Omit<AnalyzeResponse, "alternatives"> {
  const selected = new Set<string>(marketplaces);
  const listings = record.listings.filter((l) => selected.has(l.marketplace));
  const reviews = record.reviews.filter((r) => selected.has(r.marketplace));

  const sentiments = reviewSentiments(reviews);
  const total = reviews.length || 1;
  const posShare = sentiments.filter((s) => s.tone === "positive").length / total;
  const negShare = sentiments.filter((s) => s.tone === "negative").length / total;
  const neuShare = Math.max(0, 1 - posShare - negShare);
  const sentimentScore = Math.round(clamp(((posShare - negShare) + 1) * 50, 0, 100));

  const { aspects } = computeAspects(reviews);

  const dupClusters = findDuplicateBodies(reviews);
  const dupCount = dupClusters.reduce((acc, c) => acc + c.length, 0);
  const dupShare = reviews.length > 0 ? dupCount / reviews.length : 0;

  const reviewQuality = buildReviewQuality(reviews, dupShare);
  const { price, fairness } = buildPrice(record, listings);
  const { fit, accuracy } = buildFit(reviews);
  const { authenticity, findings } = buildRadar(reviews);
  const trend = buildTrend(record);

  const components: VerdictComponent[] = [
    { key: "reviewQuality", label: "Review Quality", weight: 30, score: reviewQuality },
    { key: "sentiment", label: "Sentiment", weight: 25, score: sentimentScore },
    { key: "priceFairness", label: "Price Fairness", weight: 25, score: fairness },
    { key: "fitAccuracy", label: "Fit Accuracy", weight: 20, score: accuracy },
  ];
  const score = Math.round(
    components.reduce((acc, c) => acc + (c.weight / 100) * c.score, 0)
  );
  const label = verdictLabelFor(score);

  const { pros, cons } = buildProsCons(
    aspects,
    components,
    price.timing,
    findings.length === 0,
    price.deltaPct
  );

  const primaryCurrency: "PKR" | "USD" = listings.some((l) => l.currency === "PKR") ? "PKR" : "USD";
  const range = priceRange(listings);
  const avgRating = reviews.length > 0
    ? round1(reviews.reduce((a, r) => a + r.rating, 0) / reviews.length)
    : 0;

  const header: ProductHeader = {
    id: record.id,
    slug: record.slug,
    name: record.name,
    brand: record.brand,
    category: record.category,
    description: record.description,
    hue: record.hue,
    monogram: monogramOf(record.brand, record.name),
    priceFrom: range.min,
    priceTo: range.max,
    primaryCurrency,
    totalReviews: reviews.length,
    sources: new Set(listings.map((l) => l.marketplace)).size,
    avgRating,
    verdictLabel: label,
  };

  return {
    product: header,
    verdict: { score, label, statement: buildStatement(label, components), components },
    sentiment: {
      positive: Math.round(posShare * 100),
      neutral: Math.round(neuShare * 100),
      negative: Math.round(negShare * 100),
      totalReviews: reviews.length,
      aspects: aspects.map((a) => ({ ...a, label: ASPECT_LABELS[a.key] })),
    },
    radar: { authenticity, clean: findings.length === 0, findings, analyzed: reviews.length },
    price,
    fit,
    trend,
    pros,
    cons,
    reviews: buildRepresentativeReviews(reviews, sentiments),
    analyzedMarketplaces: [...selected].filter((m) => listings.some((l) => l.marketplace === m)) as Marketplace[],
    generatedAt: new Date().toISOString(),
  };
}

/** Build the "Smart Alternatives" list from full analyses of all products. */
export function buildAlternatives(
  currentId: string,
  analyses: { record: AnalysisRecord; analysis: Omit<AnalyzeResponse, "alternatives"> }[],
  count = 4
): AlternativeProduct[] {
  const others = analyses.filter((a) => a.record.id !== currentId);
  const withMeta = others.map(({ record, analysis }) => {
    const { sentiment, verdict } = analysis;
    const sentimentChip: AlternativeProduct["sentimentChip"] =
      sentiment.positive >= 55 && sentiment.positive - sentiment.negative >= 25
        ? "Positive"
        : sentiment.negative >= 30 || sentiment.positive < 40
          ? "Negative"
          : "Mixed";

    const bestAspect = [...sentiment.aspects].sort((a, b) => b.score - a.score)[0];
    const bestComponent = [...verdict.components].sort((a, b) => b.score - a.score)[0];
    const strength =
      bestAspect && bestAspect.score >= 25 && bestAspect.mentions >= 2
        ? `Buyers praise ${ASPECT_PHRASES[bestAspect.key]}`
        : bestComponent.score >= 70
          ? `Strong ${bestComponent.label.toLowerCase()} signal`
          : "No clear standout in current data";

    const sameCategory = analysis.product.category === (analyses.find((a) => a.record.id === currentId)?.analysis.product.category ?? "");

    return {
      id: record.id,
      name: record.name,
      brand: record.brand,
      category: record.category,
      hue: record.hue,
      priceFrom: analysis.product.priceFrom,
      currency: analysis.product.primaryCurrency,
      score: verdict.score,
      label: verdict.label,
      sentimentChip,
      strength,
      sameCategory,
    } satisfies AlternativeProduct;
  });

  return withMeta
    .sort((a, b) => (a.sameCategory === b.sameCategory ? b.score - a.score : a.sameCategory ? -1 : 1))
    .slice(0, count);
}
