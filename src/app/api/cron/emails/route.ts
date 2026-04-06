import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";
import { getNextEmail, shouldSendEmail } from "@/lib/email-sequences";
import type { SubscriberSequenceState } from "@/lib/types";

export async function GET(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped, total: subscribers.length });
}
