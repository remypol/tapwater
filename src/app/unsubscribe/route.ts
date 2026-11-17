import { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * The unsubscribe link in every email. Opening it shows who is about to be
 * unsubscribed and a button; the button posts back here. A plain GET never
 * changes anything, because mail scanners follow links.
 *
 * New emails carry the subscriber's token (?t=). Emails sent before this route
 * existed carry the address (?email=), so both are accepted.
 */

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function page(title: string, body: string, status = 200): Response {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title></head>
<body style="margin:0;background:#eef6ff;color:#08122e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<main style="max-width:520px;margin:0 auto;padding:72px 24px;line-height:1.55;font-size:17px;">
<h1 style="font-size:28px;line-height:1.15;margin:0 0 16px;">${esc(title)}</h1>${body}
<p style="margin-top:32px;"><a href="/" style="color:#06257a;font-weight:600;">Back to TapWater.uk</a></p></main></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );
}

interface Found {
  id: string | number;
  email: string;
  unsubscribed: boolean | null;
}

async function find(request: NextRequest): Promise<Found | null> {
  const token = request.nextUrl.searchParams.get("t")?.trim() ?? "";
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? "";
  const supabase = getSupabase();
  if (token.length >= 16) {
    const { data } = await supabase.from("subscribers").select("id, email, unsubscribed").eq("unsubscribe_token", token).limit(1);
    return (data?.[0] as Found | undefined) ?? null;
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const { data } = await supabase.from("subscribers").select("id, email, unsubscribed").eq("email", email).limit(1);
    return (data?.[0] as Found | undefined) ?? null;
  }
  return null;
}

const DONE = (email: string) =>
  page("You are unsubscribed", `<p>We will not email ${esc(email)} again. If this was a mistake, check your postcode and sign up again.</p>`);

export async function GET(request: NextRequest) {
  const sub = await find(request);
  // Same answer whether or not the address is on the list, so the page cannot be used to test addresses.
  if (!sub) return page("You are unsubscribed", "<p>That address is not on our list, so there is nothing more to do.</p>");
  if (sub.unsubscribed) return DONE(sub.email);
  return page(
    "Stop emails from TapWater.uk?",
    `<p>This stops every email to <strong>${esc(sub.email)}</strong>: water alerts and anything else.</p>
<form method="post"><button type="submit" style="margin-top:12px;min-height:56px;padding:0 28px;border:0;border-radius:999px;background:#06257a;color:#fff;font-size:16px;font-weight:700;cursor:pointer;">Unsubscribe</button></form>`,
  );
}

export async function POST(request: NextRequest) {
  const sub = await find(request);
  if (!sub) return page("You are unsubscribed", "<p>That address is not on our list, so there is nothing more to do.</p>");
  const { error } = await getSupabase().from("subscribers").update({ unsubscribed: true }).eq("id", sub.id);
  if (error) {
    console.error("[unsubscribe] update failed:", error);
    return page("That did not work", "<p>You are still subscribed. Try the link again in a minute, or write to hello@tapwater.uk and we will remove you by hand.</p>", 500);
  }
  return DONE(sub.email);
}
