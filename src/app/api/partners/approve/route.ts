import { timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { Resend } from "resend";
import { getSupabase } from "@/lib/supabase";
import { releaseToPartner } from "@/lib/lead-delivery";
import { FROM_SITE, esc, welcomeEmail } from "@/lib/partner-emails";

/**
 * The approve link in the "new installer" email. Opening it only shows a
 * confirmation page: mail scanners follow links, and a scanner must not be able
 * to switch an installer on. The button on that page posts back here.
 */

interface Partner {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string | null;
  status: string;
  access_token: string | null;
  coverage_areas: string[] | null;
  lead_credits: number;
}

function page(title: string, body: string, status = 200): Response {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title></head>
<body style="margin:0;background:#eef5ff;color:#031349;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<main style="max-width:560px;margin:0 auto;padding:64px 24px;line-height:1.55;">
<h1 style="font-size:28px;line-height:1.15;margin:0 0 16px;">${esc(title)}</h1>${body}</main></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );
}

function sameToken(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

async function load(request: NextRequest): Promise<Partner | null> {
  const id = request.nextUrl.searchParams.get("p") ?? "";
  const token = request.nextUrl.searchParams.get("t") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id) || token.length < 16) return null;
  const { data } = await getSupabase()
    .from("installer_partners")
    .select("id, company_name, contact_name, email, phone, website, status, access_token, coverage_areas, lead_credits")
    .eq("id", id)
    .maybeSingle();
  const partner = data as Partner | null;
  if (!partner?.access_token || !sameToken(partner.access_token, token)) return null;
  return partner;
}

const NOT_FOUND = () => page("This link is not valid", "<p>It may have been mistyped or replaced. Open the newest email about this installer.</p>", 404);

export async function GET(request: NextRequest) {
  const partner = await load(request);
  if (!partner) return NOT_FOUND();
  if (partner.status === "active") {
    return page(`${partner.company_name} is already live`, "<p>Nothing more to do. New requests in their areas reach them automatically.</p>");
  }
  const areas = (partner.coverage_areas ?? []).join(", ");
  return page(
    `Approve ${partner.company_name}?`,
    `<p>${esc(partner.contact_name)} · ${esc(partner.email)} · ${esc(partner.phone)}${partner.website ? ` · ${esc(partner.website)}` : ""}</p>
<p>Areas: <strong>${esc(areas)}</strong></p>
<p>Approving emails them a welcome and sends up to ${partner.lead_credits} recent requests waiting in those areas, with homeowners' names and phone numbers. Only approve an installer you have checked.</p>
<form method="post"><button type="submit" style="margin-top:16px;min-height:56px;padding:0 28px;border:0;border-radius:999px;background:#031349;color:#fff;font-size:16px;font-weight:700;cursor:pointer;">Approve and send leads</button></form>`,
  );
}

export async function POST(request: NextRequest) {
  const partner = await load(request);
  if (!partner) return NOT_FOUND();
  if (partner.status === "active") {
    return page(`${partner.company_name} is already live`, "<p>Nothing more to do.</p>");
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("installer_partners")
    .update({ status: "active", approved_at: new Date().toISOString() })
    .eq("id", partner.id)
    .neq("status", "active");
  if (error) {
    console.error("[partners/approve] update failed:", error);
    return page("That did not work", "<p>The installer was not approved. Try the link again in a minute.</p>", 500);
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const mail = welcomeEmail(partner, partner.coverage_areas ?? [], partner.lead_credits);
      await new Resend(resendKey).emails.send({ from: FROM_SITE, to: partner.email, subject: mail.subject, html: mail.html });
    } catch (err) {
      console.error("[partners/approve] welcome email failed:", err);
    }
  }

  const delivered = await releaseToPartner(supabase, partner.id);
  return page(
    `${partner.company_name} is live`,
    `<p>They have been emailed. ${delivered > 0 ? `${delivered} waiting request${delivered === 1 ? " was" : "s were"} sent to them, and each homeowner was told who will call.` : "No recent requests were waiting in their areas; the next one goes to them as it arrives."}</p>`,
  );
}
