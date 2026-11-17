import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";
import { subscribeLimiter, isMemoryRateLimited } from "@/lib/rate-limit";
import { isSoftenerLeadSource } from "@/lib/softener-lead-source";
import { isDuplicateLead } from "@/lib/lead-routing";
import { offerNewLead, type LeadRow } from "@/lib/lead-delivery";
import { DUPLICATE_WINDOW_HOURS } from "@/lib/partner-offer";
import { FROM_SITE, esc } from "@/lib/partner-emails";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UK_PHONE_RE = /^(?:0|\+?44)\d{9,10}$/;

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const limited = subscribeLimiter
    ? !(await subscribeLimiter.limit(`softener:${ip}`)).success
    : isMemoryRateLimited(`softener:${ip}`, 3, 3_600_000);

  if (limited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: {
    name?: string;
    email?: string;
    phone?: string;
    postcode?: string;
    hardnessValue?: number;
    hardnessLabel?: string;
    source?: string;
    consent?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const phone = body.phone?.replace(/[\s\-()]/g, "");
  const postcode = body.postcode?.trim().toUpperCase();
  const hardnessValue = body.hardnessValue ?? null;
  const hardnessLabel = body.hardnessLabel ?? null;
  // Unknown sources are kept out of the lead table rather than silently
  // renamed, so a typo in a new entry point shows up as a 400 in testing.
  const source = body.source ?? "postcode_page";
  if (!isSoftenerLeadSource(source)) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  if (!name || name.length > 100) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (!phone || !UK_PHONE_RE.test(phone)) {
    return NextResponse.json(
      { error: "Valid UK phone number is required" },
      { status: 400 }
    );
  }
  // The form will not submit without the box ticked. Until 22 Sept 2026 the tick
  // never reached this route, so every lead was stored as "no consent" and could
  // not lawfully be passed to an installer. A request without it is refused.
  if (body.consent !== true) {
    return NextResponse.json(
      { error: "Please tick the box so installers can contact you" },
      { status: 400 }
    );
  }
  if (!postcode || !/^[A-Z]{1,2}[0-9][0-9A-Z]?$/.test(postcode)) {
    return NextResponse.json(
      { error: "Invalid postcode district" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // A double tap on the button, or the same person asking again the same day, is
  // one request. Answer as if it were saved so the form shows its thank-you.
  const now = new Date();
  const { data: recent } = await supabase
    .from("softener_leads")
    .select("email, postcode_district, created_at")
    .eq("email", email)
    .gte("created_at", new Date(now.getTime() - DUPLICATE_WINDOW_HOURS * 3_600_000).toISOString());
  if (recent && isDuplicateLead({ email, district: postcode, at: now }, recent)) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const { data: saved, error: dbError } = await supabase
    .from("softener_leads")
    .insert({
      name,
      email,
      phone,
      postcode_district: postcode,
      hardness_value: hardnessValue,
      hardness_label: hardnessLabel,
      source,
      consent_to_installer_sharing: true,
      consent_recorded_at: now.toISOString(),
    })
    .select("id, name, email, phone, postcode_district, hardness_value, hardness_label, status, consent_to_installer_sharing, created_at")
    .single();

  if (dbError || !saved) {
    console.error("[softener-leads] DB error:", dbError);
    return NextResponse.json(
      { error: "Failed to save your request" },
      { status: 500 }
    );
  }

  // Installers who cover this district and have leads on their account get it now.
  let sentTo: string[] = [];
  let withheld = 0;
  try {
    const offer = await offerNewLead(supabase, saved as LeadRow);
    sentTo = offer.sentTo;
    withheld = offer.withheld;
  } catch (err) {
    console.error("[softener-leads] Installer forwarding error:", err);
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);

      await resend.emails.send({
        from: "TapWater.uk <alerts@tapwater.uk>",
        to: email,
        subject: "Your water softener assessment request",
        html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">tap</span><span style="font-size:22px;font-weight:700;color:#0891b2;letter-spacing:-0.02em;">water</span><span style="font-size:14px;color:#0891b2;">.uk</span>
    </div>
    <div style="background:#1e293b;border-radius:16px;padding:32px 28px;border:1px solid #334155;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
        We've received your request
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#94a3b8;line-height:1.6;">
        Thanks ${esc(name)}, we've got your water softener assessment request for <strong style="color:#ffffff;">${postcode}</strong>.
      </p>
      ${hardnessValue ? `<p style="margin:0 0 16px;font-size:15px;color:#94a3b8;line-height:1.6;">Your area has <strong style="color:#f59e0b;">${esc(hardnessLabel)} water (${Math.round(hardnessValue)} mg/L)</strong>. A water softener can reduce limescale and protect your appliances.</p>` : ""}
      <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.6;">
        ${sentTo.length > 0 ? `We have passed your request to ${esc(sentTo.join(" and "))}. Expect a call or an email from them in the next few days.` : "We&rsquo;ll be in touch as soon as we can match you with installers covering your area."} No obligation, and you can opt out any time.
      </p>
      <div style="border-top:1px solid #334155;padding-top:20px;margin-top:8px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">In the meantime</p>
        <a href="https://www.tapwater.uk/hardness" style="display:inline-block;padding:10px 20px;background:#0891b2;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
          Learn more about water hardness
        </a>
      </div>
    </div>
    <div style="text-align:center;margin-top:28px;">
      <p style="font-size:12px;color:#334155;margin:0;">
        <a href="https://www.tapwater.uk" style="color:#0891b2;text-decoration:none;">tapwater.uk</a>
        &nbsp;&middot;&nbsp;
        <a href="https://www.tapwater.uk/privacy" style="color:#475569;text-decoration:none;">Privacy</a>
      </p>
    </div>
  </div>
</body>
</html>`,
      });

      const adminEmail = process.env.ADMIN_EMAIL || "remy@tapwater.uk";
      await resend.emails.send({
        from: FROM_SITE,
        to: adminEmail,
        subject: `New softener lead: ${postcode}${sentTo.length > 0 ? `, sent to ${sentTo.join(" and ")}` : ", no installer yet"}`,
        html: `
<h2>New Water Softener Lead</h2>
<table style="border-collapse:collapse;">
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Name:</td><td>${esc(name)}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Email:</td><td>${esc(email)}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Phone:</td><td>${esc(phone)}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Postcode:</td><td>${postcode}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Hardness:</td><td>${hardnessValue ? `${Math.round(hardnessValue)} mg/L (${esc(hardnessLabel)})` : "Unknown"}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Source:</td><td>${source}</td></tr>
</table>
<p>${sentTo.length > 0 ? `Sent to ${esc(sentTo.join(" and "))}.` : withheld > 0 ? `${withheld} installer${withheld === 1 ? " covers" : "s cover"} this district but had no leads left on their account; they were told a request is waiting.` : "No approved installer covers this district yet. It will go to the first one who signs up for this area within 30 days."}</p>`,
      });
    } catch (err) {
      console.error("[softener-leads] Email error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
