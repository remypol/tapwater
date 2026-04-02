import { NextRequest, NextResponse } from "next/server";

/**
 * Daily cron job (4am UTC) — triggers the EA data pipeline.
 * The pipeline fetches fresh data from the EA API in batches,
 * writes to Supabase, then fires the deploy hook to rebuild the site.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Determine base URL for internal call
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("host") ?? process.env.VERCEL_URL ?? "localhost:3000";
  const baseUrl = `${proto}://${host}`;

  try {
    const res = await fetch(`${baseUrl}/api/pipeline/start`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[cron/refresh] Pipeline start failed:", data);
      return NextResponse.json(
        { error: "Pipeline start failed", details: data },
        { status: res.status },
      );
    }

    console.log("[cron/refresh] Pipeline started:", data);
    return NextResponse.json({
      ok: true,
      message: "Pipeline started",
      ...data,
    });
  } catch (err) {
    console.error("[cron/refresh] Error:", err);
    return NextResponse.json(
      { error: "Failed to trigger pipeline" },
      { status: 500 },
    );
  }
}
