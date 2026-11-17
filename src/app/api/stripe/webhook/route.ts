import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabase } from "@/lib/supabase";
import { releaseToPartner } from "@/lib/lead-delivery";
import { FROM_SITE, adminPurchaseEmail } from "@/lib/partner-emails";
import { parseCompletedCheckout, verifyStripeSignature } from "@/lib/stripe-lite";

/**
 * Stripe tells us a top-up was paid. Add the credits once (the purchase row is
 * unique on the session id, so a retried webhook is a no-op), then send the
 * installer whatever was waiting for them.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const raw = await request.text();
  if (!verifyStripeSignature(raw, request.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  let event: unknown;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }
  const paid = parseCompletedCheckout(event);
  if (!paid) return NextResponse.json({ received: true });

  const supabase = getSupabase();
  const { error: insertError } = await supabase.from("partner_credit_purchases").insert({
    partner_id: paid.partnerId,
    credits: paid.credits,
    amount_pence: paid.amountPence,
    stripe_session_id: paid.sessionId,
  });
  if (insertError) {
    // 23505 = this session was already recorded: Stripe is retrying.
    if (insertError.code === "23505") return NextResponse.json({ received: true });
    console.error("[stripe/webhook] purchase not recorded:", insertError);
    return NextResponse.json({ error: "Not recorded" }, { status: 500 });
  }

  const { error: creditError } = await supabase.rpc("add_partner_credits", { p_partner: paid.partnerId, p_credits: paid.credits });
  if (creditError) {
    // Undo the record so Stripe's retry can try the whole thing again.
    await supabase.from("partner_credit_purchases").delete().eq("stripe_session_id", paid.sessionId);
    console.error("[stripe/webhook] credits not added:", creditError);
    return NextResponse.json({ error: "Credits not added" }, { status: 500 });
  }

  try {
    await releaseToPartner(supabase, paid.partnerId);
    const { data: partner } = await supabase.from("installer_partners").select("company_name").eq("id", paid.partnerId).maybeSingle();
    const key = process.env.RESEND_API_KEY;
    if (key) {
      const mail = adminPurchaseEmail(String(partner?.company_name ?? paid.partnerId), paid.credits, paid.amountPence);
      await new Resend(key).emails.send({ from: FROM_SITE, to: process.env.ADMIN_EMAIL || "remy@tapwater.uk", subject: mail.subject, html: mail.html });
    }
  } catch (err) {
    console.error("[stripe/webhook] after-payment step failed:", err);
  }

  return NextResponse.json({ received: true });
}
