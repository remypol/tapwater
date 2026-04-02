import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Simple in-memory rate limiter: max 3 requests per IP per 60s
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { email?: string; postcode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const postcode = body.postcode?.trim().toUpperCase() || null;

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const token = crypto.randomUUID();

  // Upsert subscriber — if they already exist for this postcode, update token
  const { error: dbError } = await supabase
    .from("subscribers")
    .upsert(
      {
        email,
        postcode_district: postcode,
        verification_token: token,
        verified: false,
        unsubscribed: false,
      },
      { onConflict: "email,postcode_district" }
    );

  if (dbError) {
    console.error("[subscribe] DB error:", dbError);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }

  // Send verification email via Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      const verifyUrl = `https://tapwater.uk/api/subscribe/verify?token=${token}`;

      await resend.emails.send({
        from: "TapWater.uk <alerts@tapwater.uk>",
        to: email,
        subject: postcode
          ? `Confirm your water quality alerts for ${postcode}`
          : "Confirm your TapWater.uk subscription",
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #1a1a1a; font-size: 20px;">Confirm your subscription</h2>
            <p style="color: #555; line-height: 1.6;">
              You signed up for water quality alerts${postcode ? ` for <strong>${postcode}</strong>` : ""} on TapWater.uk.
              Click below to confirm:
            </p>
            <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 500; margin: 16px 0;">
              Confirm subscription
            </a>
            <p style="color: #999; font-size: 13px; margin-top: 24px;">
              If you didn't sign up, you can ignore this email.
            </p>
          </div>
        `,
      });
    } catch (err) {
      // Log but don't fail — subscriber is saved, email can be resent
      console.error("[subscribe] Resend error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
