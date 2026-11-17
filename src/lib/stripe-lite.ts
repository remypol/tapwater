/**
 * The two Stripe calls the installer top-up needs, over plain fetch: create a
 * Checkout session, and check that a webhook really came from Stripe. No SDK.
 *
 * Nothing here runs until STRIPE_SECRET_KEY (and STRIPE_WEBHOOK_SECRET for the
 * webhook) are set; until then the top-up page asks the installer to email us.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export interface CheckoutInput {
  partnerId: string;
  email: string;
  productName: string;
  amountPence: number;
  credits: number;
  successUrl: string;
  cancelUrl: string;
}

/**
 * The Stripe account is shared with other projects (Invoice Navigator, ChemTracker,
 * Wijntje), and every project's listener is sent every checkout on the account.
 * This marker is how ours tells its own payments from theirs.
 */
export const STRIPE_SITE_MARKER = "tapwater";

/** Form-encoded body for POST /v1/checkout/sessions. Exported for the tests. */
export function checkoutParams(input: CheckoutInput): URLSearchParams {
  return new URLSearchParams({
    mode: "payment",
    // The account's own name is "SFM Studios"; these put ours on the payment page
    // and on the installer's card statement, and keep the page in English.
    locale: "en-GB",
    "branding_settings[display_name]": "TapWater.uk",
    "branding_settings[button_color]": "#08122e",
    "payment_intent_data[statement_descriptor_suffix]": "TAPWATER",
    "payment_intent_data[description]": "TapWater.uk installer leads",
    "metadata[site]": STRIPE_SITE_MARKER,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "gbp",
    "line_items[0][price_data][unit_amount]": String(input.amountPence),
    "line_items[0][price_data][product_data][name]": input.productName,
    customer_email: input.email,
    client_reference_id: input.partnerId,
    "metadata[partner_id]": input.partnerId,
    "metadata[credits]": String(input.credits),
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  });
}

export async function createCheckoutSession(input: CheckoutInput): Promise<{ id: string; url: string }> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/x-www-form-urlencoded" },
    body: checkoutParams(input),
  });
  if (!res.ok) throw new Error(`Stripe checkout failed: ${res.status} ${await res.text()}`);
  const session = (await res.json()) as { id: string; url: string };
  return { id: session.id, url: session.url };
}

/**
 * Stripe signs `${timestamp}.${rawBody}` with the endpoint secret and sends
 * "t=<timestamp>,v1=<hex hmac>[,v1=…]". A signature older than the tolerance is
 * refused so a captured request cannot be replayed later.
 */
export function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300,
): boolean {
  if (!header || !secret) return false;
  let timestamp = "";
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const [k, v] = part.split("=", 2);
    if (k?.trim() === "t") timestamp = v?.trim() ?? "";
    else if (k?.trim() === "v1" && v) signatures.push(v.trim());
  }
  const t = Number(timestamp);
  if (!Number.isFinite(t) || t <= 0 || signatures.length === 0) return false;
  if (Math.abs(nowSeconds - t) > toleranceSeconds) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex"));
  return signatures.some((sig) => {
    const given = Buffer.from(sig);
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

export interface CompletedCheckout {
  sessionId: string;
  partnerId: string;
  credits: number;
  amountPence: number;
}

/** Pull what we need out of a checkout.session.completed event; null for anything else. */
export function parseCompletedCheckout(event: unknown): CompletedCheckout | null {
  const e = event as { type?: string; data?: { object?: Record<string, unknown> } } | null;
  if (!e || e.type !== "checkout.session.completed") return null;
  const s = e.data?.object;
  if (!s || s.payment_status !== "paid") return null;
  const meta = (s.metadata ?? {}) as Record<string, string>;
  if (meta.site !== STRIPE_SITE_MARKER) return null;
  const credits = Number(meta.credits);
  const partnerId = meta.partner_id;
  if (typeof s.id !== "string" || !partnerId || !Number.isInteger(credits) || credits <= 0) return null;
  return { sessionId: s.id, partnerId, credits, amountPence: Number(s.amount_total ?? 0) };
}
