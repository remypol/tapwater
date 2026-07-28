import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PARTNERS = new Set(["amazon", "awin", "osmio", "impact", "other"]);
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

function clean(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v || v.length > max) return null;
  return v;
}

/**
 * Records one affiliate click. Public by design (it is called from the
 * browser on every outbound click), so it validates hard and stores nothing
 * about the visitor.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const productSlug = clean(b.productSlug, 64);
  const partner = clean(b.partner, 16);
  const page = clean(b.page, 200);
  const placement = clean(b.placement, 80);
  const campaign = clean(b.campaign, 80);

  if (!productSlug || !SLUG_RE.test(productSlug)) {
    return new NextResponse(null, { status: 400 });
  }
  if (!partner || !PARTNERS.has(partner)) {
    return new NextResponse(null, { status: 400 });
  }
  if (!page || !(page.startsWith("/") || page === "unknown")) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const { error } = await getSupabase().from("affiliate_clicks").insert({
      product_slug: productSlug,
      partner,
      page,
      placement,
      campaign,
    });
    if (error) return new NextResponse(null, { status: 503 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
  return new NextResponse(null, { status: 204 });
}

/**
 * Read-side summary for operators: clicks per product, partner and page over
 * the last N days. Authenticated with the same secret the cron routes use.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse(null, { status: 401 });
  }

  const days = Math.min(
    90,
    Math.max(1, Number(request.nextUrl.searchParams.get("days") ?? 7) || 7),
  );
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const { data, error } = await getSupabase()
    .from("affiliate_clicks")
    .select("product_slug, partner, page")
    .gte("clicked_at", since)
    .order("id", { ascending: false })
    .limit(20000);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  const byProduct: Record<string, number> = {};
  const byPartner: Record<string, number> = {};
  const byPage: Record<string, number> = {};
  for (const row of data ?? []) {
    byProduct[row.product_slug] = (byProduct[row.product_slug] ?? 0) + 1;
    byPartner[row.partner] = (byPartner[row.partner] ?? 0) + 1;
    byPage[row.page] = (byPage[row.page] ?? 0) + 1;
  }
  const top = (counts: Record<string, number>) =>
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25);

  return NextResponse.json({
    days,
    total: data?.length ?? 0,
    byProduct: top(byProduct),
    byPartner: top(byPartner),
    byPage: top(byPage),
  });
}
