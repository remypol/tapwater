import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabase } from "@/lib/supabase";
import { subscribeLimiter, isMemoryRateLimited } from "@/lib/rate-limit";
import { normaliseAreas } from "@/lib/lead-routing";
import { waitingByArea } from "@/lib/lead-delivery";
import { BACKLOG_MAX_AGE_DAYS } from "@/lib/partner-offer";
import { FROM_SITE, adminApplicationEmail, applicationEmail } from "@/lib/partner-emails";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UK_PHONE_RE = /^(?:0|\+?44)\d{9,10}$/;
const MAX_AREAS = 12;

/**
 * Installer signup. Stores the application as "pending" and emails us a link to
 * approve it. Nothing is shared with the installer until that approval: these
 * are homeowners' phone numbers, so a stranger filling in a form is not enough.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const limited = subscribeLimiter
    ? !(await subscribeLimiter.limit(`partner:${ip}`)).success
    : isMemoryRateLimited(`partner:${ip}`, 3, 3_600_000);
  if (limited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: {
    companyName?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    website?: string;
    areas?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const companyName = body.companyName?.trim();
  const contactName = body.contactName?.trim();
  const email = body.email?.trim().toLowerCase();
  const phone = body.phone?.replace(/[\s\-()]/g, "");
  const website = body.website?.trim().slice(0, 200) || null;
  const areas = normaliseAreas(body.areas);

  if (!companyName || companyName.length > 200) {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  }
  if (!contactName || contactName.length > 100) {
    return NextResponse.json({ error: "Your name is required" }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (!phone || !UK_PHONE_RE.test(phone)) {
    return NextResponse.json({ error: "A valid UK phone number is required" }, { status: 400 });
  }
  if (areas.length === 0) {
    return NextResponse.json({ error: "Pick at least one postcode area you cover" }, { status: 400 });
  }
  if (areas.length > MAX_AREAS) {
    return NextResponse.json({ error: `Pick up to ${MAX_AREAS} postcode areas` }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: existing } = await supabase.from("installer_partners").select("id").eq("email", email).limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "This email already has an application. Reply to our last email if you need to change it." },
      { status: 409 },
    );
  }

  const accessToken = randomBytes(24).toString("base64url");
  const { data: created, error: dbError } = await supabase
    .from("installer_partners")
    .insert({
      company_name: companyName,
      contact_name: contactName,
      email,
      phone,
      website,
      coverage_regions: [],
      coverage_areas: areas,
      access_token: accessToken,
    })
    .select("id")
    .single();

  if (dbError || !created) {
    console.error("[partners] DB error:", dbError);
    return NextResponse.json({ error: "We could not save your application. Please try again." }, { status: 500 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      const partner = { id: created.id as string, company_name: companyName, contact_name: contactName, email, access_token: accessToken };
      const counts = await waitingByArea(supabase, BACKLOG_MAX_AGE_DAYS);
      const waiting = areas.reduce((sum, a) => sum + (counts.get(a) ?? 0), 0);

      const toInstaller = applicationEmail(partner, areas);
      await resend.emails.send({ from: FROM_SITE, to: email, subject: toInstaller.subject, html: toInstaller.html });

      const toAdmin = adminApplicationEmail({ ...partner, phone, website }, areas, waiting);
      await resend.emails.send({
        from: FROM_SITE,
        to: process.env.ADMIN_EMAIL || "remy@tapwater.uk",
        subject: toAdmin.subject,
        html: toAdmin.html,
      });
      await supabase.from("installer_partners").update({ notification_status: "sent" }).eq("id", created.id);
    } catch (err) {
      console.error("[partners] Email error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
