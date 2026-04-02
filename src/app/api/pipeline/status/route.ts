import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabase();

  const { data: runs } = await db
    .from("pipeline_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(5);

  return NextResponse.json({ runs: runs ?? [] });
}
