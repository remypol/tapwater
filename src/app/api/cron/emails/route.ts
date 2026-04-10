import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";
import { getNextEmail, shouldSendEmail } from "@/lib/email-sequences";
import type { SubscriberSequenceState } from "@/lib/types";

export const maxDuration = 60;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.length < 24) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const supabase = getSupabase();
  const now = new Date();

  const { data: subscribers, error } = await supabase
    .from("subscribers")
    .select("*")
    .eq("verified", true)
    .eq("unsubscribed", false)
    .or("last_email_sent.is.null,last_email_sent.lt.30")
    .limit(50);

  if (error || !subscribers) {
    return NextResponse.json({ error: "DB error", details: error?.message }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;

  for (const sub of subscribers) {
    if (!sub.water_data_snapshot) {
      skipped++;
      continue;
    }

    const state: SubscriberSequenceState = {
      email: sub.email,
      postcodeDistrict: sub.postcode_district,
      waterDataSnapshot: sub.water_data_snapshot,
      subscribedAt: sub.created_at,
      lastEmailSent: sub.last_email_sent,
      lastEmailSentAt: sub.last_email_sent_at,
    };

    const nextEmail = getNextEmail(state);
    if (!nextEmail) { skipped++; continue; }
    if (!shouldSendEmail(state, nextEmail.step, now)) { skipped++; continue; }

    try {
      await resend.emails.send({
        from: "TapWater.uk <hello@tapwater.uk>",
        to: state.email,
        subject: nextEmail.subject,
        html: nextEmail.html,
      });

      await supabase
        .from("subscribers")
        .update({
          last_email_sent: nextEmail.step,
          last_email_sent_at: now.toISOString(),
        })
        .eq("email", state.email);

      sent++;
    } catch (err) {
      Sentry.captureException(err, {
        tags: { pipeline: "drip-emails", email: state.email, step: String(nextEmail.step) },
      });
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped, total: subscribers.length });
}
