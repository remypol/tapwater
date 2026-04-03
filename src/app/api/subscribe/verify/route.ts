import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/?verified=error", request.url));
  }

  const supabase = getSupabase();

  // Look up the token first to check expiry
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("postcode_district, token_created_at")
    .eq("verification_token", token)
    .single();

  if (!subscriber) {
    return NextResponse.redirect(new URL("/?verified=error", request.url));
  }

  // Reject tokens older than 24 hours
  if (subscriber.token_created_at) {
    const tokenAge = Date.now() - new Date(subscriber.token_created_at).getTime();
    if (tokenAge > 24 * 60 * 60 * 1000) {
      return NextResponse.redirect(new URL("/?verified=expired", request.url));
    }
  }

  const { data, error } = await supabase
    .from("subscribers")
    .update({ verified: true, verification_token: null, token_created_at: null })
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
