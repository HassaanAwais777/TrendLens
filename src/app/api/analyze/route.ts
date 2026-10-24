import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyzeProduct, buildAlternatives } from "@/lib/analysis";
import { toAnalysisRecord, PRODUCT_INCLUDE, ProductWithRelations } from "@/lib/records";
import { ALL_MARKETPLACES, AnalyzeResponse, Marketplace } from "@/lib/analysis-types";

export const dynamic = "force-dynamic";

const VALID_MARKETPLACES = new Set<string>(ALL_MARKETPLACES);

// POST /api/analyze — body: { productId: string, marketplaces: string[] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.productId !== "string" || body.productId.length === 0) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const requested: string[] = Array.isArray(body.marketplaces)
      ? body.marketplaces.filter((m: unknown): m is string => typeof m === "string")
      : [];
    const selected = new Set<string>(
      requested.length > 0 ? requested.filter((m) => VALID_MARKETPLACES.has(m)) : ALL_MARKETPLACES
    );
    if (selected.size === 0) selected.clear(); // fall back to all below

    const product = (await db.product.findUnique({
      where: { id: body.productId },
      include: PRODUCT_INCLUDE,
    })) as ProductWithRelations | null;

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const useAll = selected.size === 0;
    const marketplaces: Marketplace[] = useAll
      ? ALL_MARKETPLACES
      : ALL_MARKETPLACES.filter((m) => selected.has(m));

    const record = toAnalysisRecord(product, useAll ? undefined : selected);
    const analysis = analyzeProduct(record, marketplaces);

    // Alternatives: full-scope analyses of every other product
    const allProducts = (await db.product.findMany({
      include: PRODUCT_INCLUDE,
    })) as ProductWithRelations[];

    const analyses = allProducts.map((p) => {
      const rec = toAnalysisRecord(p);
      return { record: rec, analysis: analyzeProduct(rec) };
    });

    const alternatives = buildAlternatives(product.id, analyses, 4);

    const payload: AnalyzeResponse = {
      ...analysis,
      alternatives,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("POST /api/analyze failed:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
