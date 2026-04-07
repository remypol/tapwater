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
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">

    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">tap</span><span style="font-size:22px;font-weight:700;color:#0891b2;letter-spacing:-0.02em;">water</span><span style="font-size:14px;color:#0891b2;">.uk</span>
    </div>

    <!-- Card -->
    <div style="background:#1e293b;border-radius:16px;padding:32px 28px;border:1px solid #334155;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
        Confirm your alerts${postcode ? ` for ${postcode}` : ""}
      </h1>
      <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.6;">
        You signed up for water quality alerts${postcode ? ` for <strong style="color:#ffffff;">${postcode}</strong>` : ""}.
        We'll email you when new data is available for your area.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;background:#0891b2;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;letter-spacing:0.01em;">
          Confirm subscription
        </a>
      </div>

      <!-- What you'll get -->
      <div style="border-top:1px solid #334155;padding-top:20px;margin-top:24px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">What you'll get</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:14px;color:#cbd5e1;">New contaminant data for your area</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:14px;color:#cbd5e1;">PFAS and water safety updates</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:14px;color:#cbd5e1;">Filter recommendations matched to your water</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:28px;">
      <p style="font-size:12px;color:#475569;line-height:1.5;margin:0;">
        If you didn't sign up, you can safely ignore this email.
      </p>
      <p style="font-size:12px;color:#334155;margin:12px 0 0;">
        <a href="https://www.tapwater.uk" style="color:#0891b2;text-decoration:none;">tapwater.uk</a>
        &nbsp;&middot;&nbsp;
        <a href="https://www.tapwater.uk/privacy" style="color:#475569;text-decoration:none;">Privacy</a>
      </p>
    </div>

  </div>
</body>
</html>
        `,
      });
    } catch (err) {
      // Log but don't fail — subscriber is saved, email can be resent
      console.error("[subscribe] Resend error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
