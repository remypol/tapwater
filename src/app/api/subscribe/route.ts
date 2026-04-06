import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";
import { subscribeLimiter, isMemoryRateLimited } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const limited = subscribeLimiter
    ? !(await subscribeLimiter.limit(ip)).success
    : isMemoryRateLimited(ip, 3, 60_000);

  if (limited) {
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

  // Validate postcode district format if provided (e.g. "SW1", "EC2A", "B1")
  if (postcode && !/^[A-Z]{1,2}[0-9][0-9A-Z]?$/.test(postcode)) {
    return NextResponse.json({ error: "Invalid postcode district" }, { status: 400 });
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
        token_created_at: new Date().toISOString(),
        verified: false,
        unsubscribed: false,
      },
      { onConflict: "email,postcode_district" }
    );

  if (dbError) {
    console.error("[subscribe] DB error:", dbError);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }

  // Store water data snapshot for email drip sequence
  // Query page_data directly instead of loading the full data cache
  if (postcode) {
    try {
      const { data: pageRow } = await supabase
        .from("page_data")
        .select("safety_score, score_grade, contaminants_flagged, pfas_detected, all_readings, drinking_water_readings")
        .eq("postcode_district", postcode)
        .single();

      if (pageRow) {
        const readings = (pageRow.drinking_water_readings ?? pageRow.all_readings ?? []) as { name: string; status: string }[];
        const snapshot = {
          safetyScore: pageRow.safety_score,
          scoreGrade: pageRow.score_grade,
          contaminantsFlagged: pageRow.contaminants_flagged,
          topConcerns: readings
            .filter((r) => r.status === "fail" || r.status === "warning")
            .slice(0, 3)
            .map((r) => r.name),
          pfasDetected: pageRow.pfas_detected,
        };

        await supabase
          .from("subscribers")
          .update({ water_data_snapshot: snapshot })
          .eq("email", email);
      }
    } catch (err) {
      // Best-effort — don't let snapshot failure block subscription
      console.error("[subscribe] Snapshot error:", err);
    }
  }

  // Send verification email via Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      const verifyUrl = `https://www.tapwater.uk/api/subscribe/verify?token=${token}`;

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
