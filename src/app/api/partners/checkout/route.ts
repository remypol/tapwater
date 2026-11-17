import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { PACK_LEADS, PACK_PRICE_PENCE } from "@/lib/partner-offer";
import { SITE_URL, topUpUrl } from "@/lib/partner-emails";
import { createCheckoutSession, stripeConfigured } from "@/lib/stripe-lite";

/** The "Add leads" button on /partners/top-up: start a card payment and send the installer to it. */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const id = String(form?.get("p") ?? "");
  const token = String(form?.get("t") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || token.length < 16) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  const { data: partner } = await getSupabase()
    .from("installer_partners")
    .select("id, email, status, access_token")
    .eq("id", id)
    .maybeSingle();
  const stored = Buffer.from(String(partner?.access_token ?? ""));
  const given = Buffer.from(token);
  if (!partner || stored.length !== given.length || !timingSafeEqual(stored, given)) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  const back = topUpUrl({ id: partner.id as string, access_token: token });
  if (partner.status !== "active" || !stripeConfigured()) {
    return NextResponse.redirect(back, 303);
  }

  try {
    const session = await createCheckoutSession({
      partnerId: partner.id as string,
      email: partner.email as string,
      productName: `${PACK_LEADS} water softener leads, TapWater.uk`,
      amountPence: PACK_PRICE_PENCE,
      credits: PACK_LEADS,
      successUrl: `${back}&paid=1`,
      cancelUrl: back,
    });
    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    console.error("[partners/checkout]", err);
    return NextResponse.redirect(`${SITE_URL}/partners/top-up?p=${encodeURIComponent(id)}&t=${encodeURIComponent(token)}&error=1`, 303);
  }
}
