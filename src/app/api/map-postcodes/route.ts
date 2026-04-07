import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getMapPostcodes } from "@/lib/data";

export async function GET() {
  try {
    const postcodes = await getMapPostcodes();
    return NextResponse.json(postcodes, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
      },
    });
  } catch (err) {
    console.error("[map-postcodes] Failed to load map data:", err);
    Sentry.captureException(err, { tags: { route: "map-postcodes" } });
    return NextResponse.json([], {
      status: 500,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
}
