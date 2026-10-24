import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { priceRange, AnalysisListing } from "@/lib/analysis";
import { ProductSummary } from "@/lib/analysis-types";

export const dynamic = "force-dynamic";

/** Terms that carry no product meaning for catalogue search. */
const STOP_TERMS = new Set([
  "men", "mens", "women", "womens", "unisex", "collection", "the", "for",
  "and", "with", "new", "best", "buy", "online", "pk", "sale",
]);

/**
 * Tokenize a raw query: strip possessives ("men's" → "men"), punctuation,
 * short tokens and stop words. Returns ranked-friendly terms.
 */
function queryTerms(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/['’]s\b/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOP_TERMS.has(t));
}

interface ScoredProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  hue: number;
  score: number;
  listings: {
    marketplace: string;
    price: number;
    currency: string;
    originalPrice: number | null;
    rating: number;
    reviewCount: number;
    deliveryDays: number;
  }[];
}

// GET /api/products?q= — search the seeded catalogue (ranked, top 8)
export async function GET(request: NextRequest) {
  try {
    const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
    const terms = queryTerms(q);

    const products = await db.product.findMany({
      include: { listings: true },
      orderBy: { createdAt: "asc" },
    });

    const scored: ScoredProduct[] = products.map((p) => {
      const haystack = `${p.brand} ${p.name} ${p.category} ${p.description}`.toLowerCase();
      let score = 0;
      // brand/name/category hits weigh more than description hits
      const primary = `${p.brand} ${p.name} ${p.category}`.toLowerCase();
      for (const term of terms) {
        if (primary.includes(term)) score += 2;
        else if (haystack.includes(term)) score += 1;
      }
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        category: p.category,
        hue: p.hue,
        score,
        listings: p.listings.map((l) => ({
          marketplace: l.marketplace,
          price: l.price,
          currency: l.currency,
          originalPrice: l.originalPrice,
          rating: l.rating,
          reviewCount: l.reviewCount,
          deliveryDays: l.deliveryDays,
        })),
      };
    });

    // No usable terms → browse-all; otherwise keep only products matching ≥1 term.
    const matched = (terms.length === 0 ? scored : scored.filter((p) => p.score > 0))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    const summaries: ProductSummary[] = matched.map((p) => {
      const listings: AnalysisListing[] = p.listings;
      const range = priceRange(listings);
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        category: p.category,
        hue: p.hue,
        priceFrom: range.min,
        currency: range.currency,
      };
    });

    return NextResponse.json({ products: summaries });
  } catch (error) {
    console.error("GET /api/products failed:", error);
    return NextResponse.json({ error: "Failed to search products" }, { status: 500 });
  }
}
