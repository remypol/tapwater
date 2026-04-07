import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";
import { subscribeLimiter, isMemoryRateLimited } from "@/lib/rate-limit";

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
  const source = body.source ?? "postcode_page";

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
  if (!postcode || !/^[A-Z]{1,2}[0-9][0-9A-Z]?$/.test(postcode)) {
    return NextResponse.json(
      { error: "Invalid postcode district" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  const { error: dbError } = await supabase.from("softener_leads").insert({
    name,
    email,
    phone,
    postcode_district: postcode,
    hardness_value: hardnessValue,
    hardness_label: hardnessLabel,
    source,
  });

  if (dbError) {
    console.error("[softener-leads] DB error:", dbError);
    return NextResponse.json(
      { error: "Failed to save your request" },
      { status: 500 }
    );
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
        Thanks ${name}, we've got your water softener assessment request for <strong style="color:#ffffff;">${postcode}</strong>.
      </p>
      ${hardnessValue ? `<p style="margin:0 0 16px;font-size:15px;color:#94a3b8;line-height:1.6;">Your area has <strong style="color:#f59e0b;">${hardnessLabel} water (${Math.round(hardnessValue)} mg/L)</strong>. A water softener can reduce limescale and protect your appliances.</p>` : ""}
      <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.6;">
        Up to 3 local installers will contact you within 24–48 hours with free, no-obligation quotes.
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
        from: "TapWater.uk <alerts@tapwater.uk>",
        to: adminEmail,
        subject: `New softener lead: ${name} (${postcode})`,
        html: `
<h2>New Water Softener Lead</h2>
<table style="border-collapse:collapse;">
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Name:</td><td>${name}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Email:</td><td>${email}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Phone:</td><td>${phone}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Postcode:</td><td>${postcode}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Hardness:</td><td>${hardnessValue ? `${Math.round(hardnessValue)} mg/L (${hardnessLabel})` : "Unknown"}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Source:</td><td>${source}</td></tr>
</table>
<p>Forward this lead to Bark/Checkatrade/MyBuilder.</p>`,
      });
    } catch (err) {
      console.error("[softener-leads] Email error:", err);
    }
  }

  // Forward lead to matching installer partners
  try {
    const { data: partners } = await supabase
      .from("installer_partners")
      .select("id, company_name, contact_name, email, coverage_regions, coverage_postcodes")
      .eq("status", "active");

    if (partners && partners.length > 0 && resendKey) {
      const postcodePrefix = postcode.replace(/[0-9]/g, "");
      const matchedPartners = partners.filter((p: { coverage_postcodes: string[] | null }) => {
        if (p.coverage_postcodes && p.coverage_postcodes.length > 0) {
          return p.coverage_postcodes.some((cp: string) =>
            postcode.startsWith(cp) || postcodePrefix === cp
          );
        }
        return false;
      });

      if (matchedPartners.length > 0) {
        const resend = new Resend(resendKey);
        for (const partner of matchedPartners.slice(0, 3)) {
          await resend.emails.send({
            from: "TapWater.uk Leads <alerts@tapwater.uk>",
            to: partner.email,
            subject: `New water softener lead in ${postcode}`,
            html: `
<h2>New Water Softener Lead</h2>
<p>A homeowner in your coverage area has requested water softener quotes.</p>
<table style="border-collapse:collapse;">
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Name:</td><td>${name}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Phone:</td><td>${phone}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Email:</td><td>${email}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Postcode:</td><td>${postcode}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Hardness:</td><td>${hardnessValue ? `${Math.round(hardnessValue)} mg/L (${hardnessLabel})` : "Unknown"}</td></tr>
</table>
<p style="margin-top:16px;color:#666;font-size:13px;">This lead was sent to up to 3 installers in the area. Please contact the homeowner within 24 hours.</p>
<p style="color:#999;font-size:12px;">TapWater.uk Lead Service</p>`,
          });
        }

        // Update lead status to forwarded
        await supabase
          .from("softener_leads")
          .update({ status: "forwarded", forwarded_at: new Date().toISOString() })
          .eq("postcode_district", postcode)
          .eq("email", email)
          .eq("status", "new")
          .order("created_at", { ascending: false })
          .limit(1);
      }
    }
  } catch (err) {
    console.error("[softener-leads] Installer forwarding error:", err);
  }

  return NextResponse.json({ ok: true });
}
