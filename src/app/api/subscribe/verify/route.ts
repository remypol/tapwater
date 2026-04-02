import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/?verified=error", request.url));
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("subscribers")
    .update({ verified: true, verification_token: null })
    .eq("verification_token", token)
    .select("postcode_district")
    .single();

  if (error || !data) {
    return NextResponse.redirect(new URL("/?verified=error", request.url));
  }

  const dest = data.postcode_district
    ? `/postcode/${data.postcode_district}?verified=true`
    : "/?verified=true";

  return NextResponse.redirect(new URL(dest, request.url));
}
