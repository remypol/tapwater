import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { checkoutParams, parseCompletedCheckout, verifyStripeSignature } from "../stripe-lite";
import { esc, leadEmail, withheldEmail } from "../partner-emails";
import { FREE_LEADS, PACK_LEADS, PACK_PRICE_PENCE, PRICE_PER_LEAD_GBP } from "../partner-offer";

const SECRET = "whsec_test";
const sign = (body: string, t: number, secret = SECRET) => `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`;

describe("verifyStripeSignature", () => {
  const body = JSON.stringify({ type: "checkout.session.completed" });
  it("accepts a fresh, correctly signed payload", () => {
    expect(verifyStripeSignature(body, sign(body, 1000), SECRET, 1010)).toBe(true);
  });
  it("refuses a changed body, a wrong secret, an old timestamp and a missing header", () => {
    expect(verifyStripeSignature(`${body} `, sign(body, 1000), SECRET, 1010)).toBe(false);
    expect(verifyStripeSignature(body, sign(body, 1000, "whsec_other"), SECRET, 1010)).toBe(false);
    expect(verifyStripeSignature(body, sign(body, 1000), SECRET, 1000 + 301)).toBe(false);
    expect(verifyStripeSignature(body, null, SECRET, 1010)).toBe(false);
    expect(verifyStripeSignature(body, "t=1000", SECRET, 1010)).toBe(false);
  });
});

describe("parseCompletedCheckout", () => {
  const event = (over: Record<string, unknown> = {}) => ({
    type: "checkout.session.completed",
    data: { object: { id: "cs_1", payment_status: "paid", amount_total: 17500, metadata: { partner_id: "p1", credits: "5" }, ...over } },
  });
  it("reads the partner, credits and amount from a paid session", () => {
    expect(parseCompletedCheckout(event())).toEqual({ sessionId: "cs_1", partnerId: "p1", credits: 5, amountPence: 17500 });
  });
  it("ignores unpaid sessions, other events and sessions without our metadata", () => {
    expect(parseCompletedCheckout(event({ payment_status: "unpaid" }))).toBeNull();
    expect(parseCompletedCheckout({ type: "payment_intent.succeeded", data: { object: {} } })).toBeNull();
    expect(parseCompletedCheckout(event({ metadata: {} }))).toBeNull();
    expect(parseCompletedCheckout(event({ metadata: { partner_id: "p1", credits: "-3" } }))).toBeNull();
    expect(parseCompletedCheckout(null)).toBeNull();
  });
});

describe("checkoutParams", () => {
  it("charges the pack price in pounds and carries the credits through", () => {
    const p = checkoutParams({ partnerId: "p1", email: "a@b.co", productName: "x", amountPence: PACK_PRICE_PENCE, credits: PACK_LEADS, successUrl: "s", cancelUrl: "c" });
    expect(p.get("mode")).toBe("payment");
    expect(p.get("line_items[0][price_data][currency]")).toBe("gbp");
    expect(p.get("line_items[0][price_data][unit_amount]")).toBe(String(PACK_PRICE_PENCE));
    expect(p.get("metadata[credits]")).toBe(String(PACK_LEADS));
    expect(p.get("metadata[partner_id]")).toBe("p1");
  });
});

describe("the offer", () => {
  it("adds up", () => {
    expect(PRICE_PER_LEAD_GBP * PACK_LEADS * 100).toBe(PACK_PRICE_PENCE);
    expect(FREE_LEADS).toBeGreaterThan(0);
  });
});

describe("emails", () => {
  const partner = { id: "p1", company_name: "Soft & Co", contact_name: "Sam", email: "sam@soft.co", access_token: "tok" };
  const lead = { name: '<img src=x onerror="alert(1)">', email: "jo@example.com", phone: "07700900123", postcode_district: "RG41", hardness_value: 235.4, hardness_label: "hard" };
  it("escapes what a homeowner typed", () => {
    expect(esc(`<a href="x">'&`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;");
    expect(leadEmail(lead, partner, 2).html).not.toContain("<img");
  });
  it("puts contact details in the paid email and keeps them out of the waiting one", () => {
    expect(leadEmail(lead, partner, 2).html).toContain("07700900123");
    const teaser = withheldEmail(lead, partner).html;
    expect(teaser).toContain("RG41");
    expect(teaser).toContain("235 mg/L");
    expect(teaser).not.toContain("07700900123");
    expect(teaser).not.toContain("jo@example.com");
    expect(teaser).not.toContain("alert(1)");
  });
  it("offers the top-up once the account is empty", () => {
    expect(leadEmail(lead, partner, 0).html).toContain("/partners/top-up?p=p1&t=tok");
  });
});
