import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";
import { subscribeLimiter, isMemoryRateLimited } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

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
    coverageRegions?: string[];
    coveragePostcodes?: string;
    desiredVolume?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const companyName = body.companyName?.trim();
  const contactName = body.contactName?.trim();
  const email = body.email?.trim().toLowerCase();
  const phone = body.phone?.trim();
  const website = body.website?.trim() || null;
  const coverageRegions = body.coverageRegions;
  const desiredVolume = body.desiredVolume?.trim() || null;

  // Parse comma-separated postcodes into uppercase array, filtering empty values
  const coveragePostcodes = body.coveragePostcodes
    ? body.coveragePostcodes
        .split(",")
        .map((p) => p.trim().toUpperCase())
        .filter(Boolean)
    : null;

  if (!companyName || companyName.length > 200) {
    return NextResponse.json(
      { error: "Company name is required (max 200 characters)" },
      { status: 400 }
    );
  }
  if (!contactName || contactName.length > 100) {
    return NextResponse.json(
      { error: "Contact name is required (max 100 characters)" },
      { status: 400 }
    );
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Valid email is required" },
      { status: 400 }
    );
  }
  if (!phone) {
    return NextResponse.json(
      { error: "Phone number is required" },
      { status: 400 }
    );
  }
  if (!coverageRegions || !Array.isArray(coverageRegions) || coverageRegions.length === 0) {
    return NextResponse.json(
      { error: "At least one coverage region is required" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  const { error: dbError } = await supabase.from("installer_partners").insert({
    company_name: companyName,
    contact_name: contactName,
    email,
    phone,
    website,
    coverage_regions: coverageRegions,
    coverage_postcodes: coveragePostcodes,
    desired_volume: desiredVolume,
  });

  if (dbError) {
    console.error("[partners] DB error:", dbError);
    return NextResponse.json(
      { error: "Failed to save your request" },
      { status: 500 }
    );
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      const adminEmail = process.env.ADMIN_EMAIL || "remy@tapwater.uk";

      await resend.emails.send({
        from: "TapWater.uk <alerts@tapwater.uk>",
        to: adminEmail,
        subject: `New installer partner: ${companyName}`,
        html: `
<h2>New Installer Partner Signup</h2>
<table style="border-collapse:collapse;">
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Company:</td><td>${companyName}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Contact:</td><td>${contactName}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Email:</td><td>${email}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Phone:</td><td>${phone}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Website:</td><td>${website || "—"}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Coverage Regions:</td><td>${coverageRegions.join(", ")}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Coverage Postcodes:</td><td>${coveragePostcodes ? coveragePostcodes.join(", ") : "—"}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Desired Volume:</td><td>${desiredVolume || "—"}</td></tr>
</table>`,
      });
    } catch (err) {
      console.error("[partners] Email error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
