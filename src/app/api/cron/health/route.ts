import { NextRequest, NextResponse } from "next/server";
import { getHealthReport, sendHealthAlert } from "@/lib/pipeline-health";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.length < 24) {
    console.error("[cron/health] CRON_SECRET is missing or too short (min 24 chars)");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report = await getHealthReport();
  await sendHealthAlert(report);

  console.log(
    `[cron/health] Report generated — ${report.pageData.totalRows} rows, ${report.issues.length} issue(s)`,
  );

  return NextResponse.json(report);
}
