# TrendLens — See through the hype

Cross-marketplace fashion intelligence MVP. TrendLens aggregates product listings and
review data from Daraz, Amazon, AliExpress/Shein-style marketplaces and social commerce,
then runs a 4-step analysis pipeline (Acquire → Clean & Dedupe → NLP → Verdict) to
produce a Balanced Verdict score (0–100), a fake-review radar, price intelligence,
size-fit insights, and trend momentum — plus ranked alternative recommendations.

## Tech Stack

- **Next.js 16** (App Router, standalone output) + **React 19** + **TypeScript**
- **Prisma ORM** + **SQLite** (pre-seeded demo database included)
- **Tailwind CSS 4** + **shadcn/ui** + **framer-motion**
- Deterministic analysis engine in `src/lib/analysis.ts` (lexicon sentiment with
  Roman-Urdu coverage, aspect extraction, authenticity heuristics, weighted scoring)

## Requirements

- Node.js 18.18+ (or Bun 1.1+)
- npm / pnpm / bun

## Quick Start

```bash
# 1. Install dependencies
npm install        # or: bun install

# 2. Generate the Prisma client
npx prisma generate

# 3. Run the dev server
npm run dev        # or: bun run dev
```

Open http://localhost:3000 and try one of the example queries, e.g.
**"Coach Tabby"** (a manipulated listing — watch the Fake-Review Radar fire) or
**"Gul Ahmed"** (a clean listing, high verdict).

The `.env` points `DATABASE_URL` to the bundled pre-seeded database at
`db/custom.db` (12 products × 4 marketplaces, 306 reviews, 12-week price and
trend history). No further setup is needed.

## Useful Scripts

| Script             | What it does                                        |
| ------------------ | --------------------------------------------------- |
| `npm run dev`      | Start the dev server on port 3000                   |
| `npm run build`    | Production build (standalone output)                |
| `npm start`        | Run the production server                           |
| `npm run db:push`  | Push `prisma/schema.prisma` to the SQLite database  |
| `npm run db:seed`  | Re-seed the demo dataset (requires Bun)             |

## Scoring Methodology (Balanced Verdict)

The 0–100 verdict is a weighted composite:

| Component          | Weight | Source                                            |
| ------------------ | ------ | ------------------------------------------------- |
| Review quality     | 30%    | Volume, verification rate, authenticity signals   |
| Sentiment          | 25%    | Aspect-level sentiment across 6 dimensions        |
| Price fairness     | 25%    | Deviation vs. 90-day average and cross-store price|
| Size accuracy      | 20%    | Fit-report consistency and return-risk signals    |

The Fake-Review Radar inspects five manipulation signals: duplicate review bursts,
rating spike anomalies, unverified-buyer dominance, vague-superlative language, and
temporal clustering.

## Project Structure

```
src/
  app/                    # App Router: page, layout, API routes
    api/analyze/route.ts  # POST: run the analysis pipeline
    api/products/route.ts # GET: fuzzy product resolution
  components/trendlens/   # Dashboard: hero, pipeline, 9 panels, alternatives
  lib/analysis.ts         # Deterministic analysis engine
  lib/records.ts          # Data access + serialization
prisma/
  schema.prisma           # Product / Listing / PriceHistory / TrendPoint / Review
  seed.ts                 # Demo dataset generator
db/custom.db              # Pre-seeded SQLite database
```

## Notes

- The demo dataset is synthetic and crafted for evaluation of the analysis engine.
  Production deployment would replace `src/lib/records.ts` ingestion with live
  marketplace connectors (see the Product Blueprint PDF, Chapters 5–6).
- All analysis is deterministic — the same query always yields the same verdict,
  which makes the engine easy to test and audit.
