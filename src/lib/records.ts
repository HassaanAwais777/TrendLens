// Server-side helpers to map Prisma product rows into analysis records.
import { Product } from "@prisma/client";
import { AnalysisRecord, AnalysisListing } from "@/lib/analysis";

export interface ProductWithRelations extends Product {
  listings: {
    marketplace: string;
    price: number;
    currency: string;
    originalPrice: number | null;
    rating: number;
    reviewCount: number;
    deliveryDays: number;
  }[];
  priceHistory: { week: number; price: number }[];
  trendPoints: { week: number; interest: number }[];
  reviews: {
    id: string;
    marketplace: string;
    author: string;
    rating: number;
    title: string;
    body: string;
    daysAgo: number;
    verified: boolean;
  }[];
}

export function toAnalysisRecord(
  p: ProductWithRelations,
  marketplaces?: Set<string>
): AnalysisRecord {
  const listings: AnalysisListing[] = p.listings
    .filter((l) => !marketplaces || marketplaces.has(l.marketplace))
    .map((l) => ({
      marketplace: l.marketplace,
      price: l.price,
      currency: l.currency,
      originalPrice: l.originalPrice,
      rating: l.rating,
      reviewCount: l.reviewCount,
      deliveryDays: l.deliveryDays,
    }));

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.category,
    description: p.description,
    hue: p.hue,
    peakWeek: p.peakWeek,
    listings,
    priceHistory: p.priceHistory.sort((a, b) => a.week - b.week).map((h) => h.price),
    trendPoints: p.trendPoints.sort((a, b) => a.week - b.week).map((t) => t.interest),
    reviews: p.reviews
      .filter((r) => !marketplaces || marketplaces.has(r.marketplace))
      .map((r) => ({
        id: r.id,
        marketplace: r.marketplace,
        author: r.author,
        rating: r.rating,
        title: r.title,
        body: r.body,
        daysAgo: r.daysAgo,
        verified: r.verified,
      })),
  };
}

export const PRODUCT_INCLUDE = {
  listings: true,
  priceHistory: true,
  trendPoints: true,
  reviews: true,
} as const;
