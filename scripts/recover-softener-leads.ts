/**
 * Recover the water softener quote requests that arrived while no lead partner
 * was configured.
 *
 * Every lead in `softener_leads` with status "new" and no forwarded_at gets one
 * email: their hardness reading, and a tracked link to the partner's quote form
 * so local installers can actually quote them. The lead is then marked
 * "recovery_sent" so it is never emailed twice.
 *
 * Usage (dry run prints what would be sent, nothing is emailed or written):
 *   NEXT_PUBLIC_SOFTENER_PARTNER_URL="https://www.awin1.com/cread.php?..." \
 *   NEXT_PUBLIC_SOFTENER_PARTNER_NAME="Bark" \
 *   npx tsx scripts/recover-softener-leads.ts
 *
 * Add --send to actually send. Needs RESEND_API_KEY, NEXT_PUBLIC_SUPABASE_URL
 * and SUPABASE_SERVICE_ROLE_KEY (all read from .env.local).
 */
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { config } from "dotenv";

config({ path: ".env.local" });

const SEND = process.argv.includes("--send");
const partnerUrl = (process.env.NEXT_PUBLIC_SOFTENER_PARTNER_URL ?? "").trim();
const partnerName = (process.env.NEXT_PUBLIC_SOFTENER_PARTNER_NAME ?? "our partner").trim();

if (!partnerUrl) {
  console.error("NEXT_PUBLIC_SOFTENER_PARTNER_URL is not set. Nothing to send leads to.");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type Lead = {
  id: string;
  name: string;
  email: string;
  postcode_district: string;
  hardness_value: number | null;
  hardness_label: string | null;
  created_at: string;
};

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

function html(lead: Lead): string {
  const hardness =
    lead.hardness_value && lead.hardness_label
      ? `<p style="margin:0 0 16px;font-size:15px;color:#94a3b8;line-height:1.6;">The water in <strong style="color:#ffffff;">${lead.postcode_district}</strong> is <strong style="color:#f59e0b;">${lead.hardness_label} (${Math.round(lead.hardness_value)} mg/L)</strong>. That is the level where a softener pays for itself in boiler and appliance life.</p>`
      : `<p style="margin:0 0 16px;font-size:15px;color:#94a3b8;line-height:1.6;">You asked us about a water softener for <strong style="color:#ffffff;">${lead.postcode_district}</strong>.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">tap</span><span style="font-size:22px;font-weight:700;color:#0891b2;letter-spacing:-0.02em;">water</span><span style="font-size:14px;color:#0891b2;">.uk</span>
    </div>
    <div style="background:#1e293b;border-radius:16px;padding:32px 28px;border:1px solid #334155;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
        Your softener quotes are ready to request
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#94a3b8;line-height:1.6;">
        Hi ${firstName(lead.name)}, sorry this took longer than it should have.
      </p>
      ${hardness}
      <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.6;">
        We now work with ${partnerName} to match you with vetted local installers. Post your request there and up to five installers covering ${lead.postcode_district} will send you a quote. It is free and there is no obligation.
      </p>
      <a href="${partnerUrl}" style="display:inline-block;padding:12px 22px;background:#0891b2;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
        Get free installer quotes
      </a>
      <div style="border-top:1px solid #334155;padding-top:20px;margin-top:28px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Before you buy</p>
        <p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.6;">
          Our guide to <a href="https://www.tapwater.uk/guides/water-softener-cost-uk" style="color:#0891b2;text-decoration:none;">what a softener really costs</a> covers the unit, fitting and salt, so you can tell a fair quote from a high one.
        </p>
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
</html>`;
}

async function main() {
  const { data, error } = await supabase
    .from("softener_leads")
    .select("id,name,email,postcode_district,hardness_value,hardness_label,created_at")
    .eq("status", "new")
    .is("forwarded_at", null)
    .order("created_at", { ascending: true });

  if (error) throw error;
  const leads = (data ?? []) as Lead[];
  console.log(`${leads.length} lead(s) waiting. Mode: ${SEND ? "SEND" : "dry run"}`);

  const resend = SEND ? new Resend(process.env.RESEND_API_KEY!) : null;
  let sent = 0;

  for (const lead of leads) {
    const line = `${lead.created_at.slice(0, 10)}  ${lead.postcode_district.padEnd(5)}  ${lead.email}`;
    if (!resend) {
      console.log(`  would email  ${line}`);
      continue;
    }
    try {
      await resend.emails.send({
        from: "TapWater.uk <alerts@tapwater.uk>",
        to: lead.email,
        subject: `Free water softener quotes for ${lead.postcode_district}`,
        html: html(lead),
      });
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("softener_leads")
        .update({ status: "recovery_sent", forwarded_at: now, forwarding_attempted_at: now })
        .eq("id", lead.id);
      if (updateError) throw updateError;
      sent++;
      console.log(`  sent         ${line}`);
    } catch (err) {
      console.error(`  FAILED       ${line}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (SEND) console.log(`Done. ${sent}/${leads.length} emailed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
