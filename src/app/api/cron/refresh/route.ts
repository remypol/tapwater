import { NextRequest, NextResponse } from "next/server";

/**
 * Daily cron endpoint — triggers a fresh Vercel deployment.
 *
 * The redeployment re-runs the build, which fetches the latest EA Water
 * Quality data via the seed script. This keeps postcode scores current
 * without needing a database.
 *
 * Requires:
 *   CRON_SECRET     — set automatically by Vercel for cron jobs
 *   DEPLOY_HOOK_URL — create a Deploy Hook in Vercel Dashboard → Settings → Git → Deploy Hooks
 */
export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hookUrl = process.env.DEPLOY_HOOK_URL;
  if (!hookUrl) {
    console.error("[cron/refresh] DEPLOY_HOOK_URL not configured");
    return NextResponse.json(
      { error: "Deploy hook not configured" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(hookUrl, { method: "POST" });
    if (!res.ok) {
      console.error("[cron/refresh] Deploy hook failed:", res.status);
      return NextResponse.json(
        { error: "Deploy hook failed", status: res.status },
        { status: 502 }
      );
    }

    console.log("[cron/refresh] Triggered fresh deployment");
    return NextResponse.json({
      ok: true,
      message: "Deployment triggered",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron/refresh] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
