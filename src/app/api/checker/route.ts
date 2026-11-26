import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getSupabase } from "@/lib/supabase";
import { getHardness, getPostcodeData } from "@/lib/data";
import { extractDistrict } from "@/lib/postcode-parse";

/**
 * GET /api/checker?postcode=RG1 2AB[&key=tw_live_…]
 *
 * Feeds the embeddable hardness checker (public/widget.js, data-tapwater-checker).
 * Without a key it answers anyone, cached at the edge, and the checker shows a
 * "Hardness data: TapWater.uk" link. With a paid key (any plan but "pilot") the
 * link is dropped and every check is logged to api_usage, which is what the
 * customer's monthly report of checked postcodes is built from. The key sits in
 * the customer's page source, so it is an attribution switch, not a secret.
 */

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function reply(body: unknown, status: number, cache: string) {
  return NextResponse.json(body, { status, headers: { ...CORS, "Cache-Control": cache } });
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("postcode") ?? "";
  const key = request.nextUrl.searchParams.get("key")?.trim() || null;
  const district = extractDistrict(raw);

  let keyId: number | null = null;
  let attribution = true;
  if (key) {
    const { data } = await getSupabase()
      .from("api_keys")
      .select("id, plan, revoked_at")
      .eq("key_hash", createHash("sha256").update(key).digest("hex"))
      .maybeSingle();
    if (data && !data.revoked_at) {
      keyId = data.id;
      attribution = data.plan === "pilot";
    }
  }
  const cache = keyId ? "no-store" : "public, s-maxage=86400, stale-while-revalidate=43200";

  const log = async (status: number) => {
    if (!keyId) return;
    await getSupabase().from("api_usage").insert({ key_id: keyId, path: "/api/checker", postcode: raw.trim().toUpperCase().slice(0, 12) || null, status });
  };

  if (!district) {
    await log(400);
    return reply({ error: "Enter a UK postcode, for example RG1 2AB." }, 400, cache);
  }

  const [hardness, data] = await Promise.all([getHardness(district), getPostcodeData(district)]);
  if (!hardness) {
    await log(404);
    return reply({ error: `We have no hardness reading for ${district} yet.`, district }, 404, cache);
  }
  await log(200);

  return reply(
    {
      district,
      areaName: data?.areaName ?? null,
      supplier: data?.supplier ?? null,
      hardness: {
        mgPerLitre: Math.round(hardness.value),
        label: hardness.label,
        // Estimated means no reading for this district: the median of its postcode area.
        estimated: hardness.estimated,
        estimatedFromArea: hardness.estimatedFrom ?? null,
      },
      url: `https://www.tapwater.uk/postcode/${district}`,
      attribution,
    },
    200,
    cache,
  );
}
