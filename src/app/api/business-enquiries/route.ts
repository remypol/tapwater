import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";
import { subscribeLimiter, isMemoryRateLimited } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Pilot and pricing enquiries from /for-business. Stored first, emailed second. */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = subscribeLimiter
    ? !(await subscribeLimiter.limit(`biz:${ip}`)).success
    : isMemoryRateLimited(`biz:${ip}`, 3, 3_600_000);
  if (limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body: { company?: string; contactName?: string; email?: string; website?: string; useCase?: string; expectedVolume?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const company = body.company?.trim();
  const contactName = body.contactName?.trim();
  const email = body.email?.trim().toLowerCase();
  const website = body.website?.trim() || null;
  const useCase = body.useCase?.trim();
  const expectedVolume = body.expectedVolume?.trim() || null;

  if (!company || company.length > 200) return NextResponse.json({ error: "Company is required" }, { status: 400 });
  if (!contactName || contactName.length > 100) return NextResponse.json({ error: "Your name is required" }, { status: 400 });
  if (!email || !EMAIL_RE.test(email)) return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  if (!useCase || useCase.length > 2000) return NextResponse.json({ error: "Tell us what you want to build" }, { status: 400 });

  const supabase = getSupabase();
  const { error } = await supabase.from("business_enquiries").insert({
    company, contact_name: contactName, email, website, use_case: useCase, expected_volume: expectedVolume,
  });
  if (error) {
    console.error("[business-enquiries] insert failed:", error);
    return NextResponse.json({ error: "Could not save your enquiry. Email hello@tapwater.uk instead." }, { status: 500 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      const adminEmail = process.env.ADMIN_EMAIL || "remy@tapwater.uk";
      await resend.emails.send({
        from: "TapWater.uk Business <alerts@tapwater.uk>",
        to: adminEmail,
        replyTo: email,
        subject: `Data enquiry: ${company}`,
        text: `Company: ${company}\nContact: ${contactName} <${email}>\nWebsite: ${website ?? "-"}\nVolume: ${expectedVolume ?? "-"}\n\n${useCase}\n\nMint a pilot key:\n  npx tsx scripts/create-api-key.ts "${company}" ${email} pilot 1000`,
      });
      await resend.emails.send({
        from: "TapWater.uk <alerts@tapwater.uk>",
        to: email,
        subject: "Your TapWater.uk data enquiry",
        text: `Hi ${contactName.split(" ")[0]},\n\nThanks for asking about TapWater.uk data for ${company}. We reply within one working day with a pilot key so you can try the report API against your own addresses.\n\nUntil then, the format is documented at https://www.tapwater.uk/for-business and every report links back to a public page you can check, for example https://www.tapwater.uk/postcode/SW1A.\n\nRemy\nTapWater.uk`,
      });
    } catch (err) {
      console.error("[business-enquiries] email failed:", err);
    }
  }

  return NextResponse.json({ success: true });
}
