/**
 * Hands softener leads to installers and records every hand-over.
 *
 * Two entry points:
 *   offerNewLead      a homeowner has just asked for quotes
 *   releaseToPartner  an installer was approved or topped up, so send what is
 *                     waiting for them (recent requests in their areas)
 *
 * A homeowner's contact details only ever leave in a "sent" delivery, which
 * costs the installer one credit. The rules about who qualifies are in
 * lead-routing.ts.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { isDeliverableBacklog, partnerCovers, pickPartners, type RoutablePartner } from "./lead-routing";
import { BACKLOG_MAX_AGE_DAYS, MAX_INSTALLERS_PER_LEAD } from "./partner-offer";
import { FROM_LEADS, FROM_SITE, leadEmail, matchedEmail, withheldEmail, type EmailLead, type Mail } from "./partner-emails";

export interface LeadRow extends EmailLead {
  id: string;
  status: string;
  consent_to_installer_sharing: boolean | null;
  created_at: string;
}

export interface PartnerRow extends RoutablePartner {
  company_name: string;
  contact_name: string;
  email: string;
  access_token: string | null;
  lead_credits: number;
}

const PARTNER_COLUMNS =
  "id, status, company_name, contact_name, email, access_token, lead_credits, coverage_areas, coverage_postcodes, approved_at, created_at";
const LEAD_COLUMNS =
  "id, name, email, phone, postcode_district, hardness_value, hardness_label, status, consent_to_installer_sharing, created_at";

type Send = (to: string, from: string, mail: Mail) => Promise<boolean>;

function mailer(): Send | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  const resend = new Resend(key);
  return async (to, from, mail) => {
    try {
      const { error } = await resend.emails.send({ from, to, subject: mail.subject, html: mail.html });
      if (error) console.error("[lead-delivery] email refused:", error);
      return !error;
    } catch (err) {
      console.error("[lead-delivery] email failed:", err);
      return false;
    }
  };
}

/**
 * Spend one of the partner's credits and email them the lead. If the email does
 * not go out the credit is handed back, so an installer never pays for a lead
 * they did not receive. Returns true when the details were sent.
 */
async function sendLead(sb: SupabaseClient, send: Send, lead: LeadRow, partner: PartnerRow): Promise<boolean> {
  const { data: spent, error } = await sb.rpc("consume_partner_credit", { p_partner: partner.id });
  if (error) {
    console.error("[lead-delivery] credit check failed:", error);
    return false;
  }
  if (spent !== true) return false;

  const creditsLeft = Math.max(0, partner.lead_credits - 1);
  const ok = await send(partner.email, FROM_LEADS, leadEmail(lead, partner, creditsLeft));
  if (!ok) {
    await sb.rpc("add_partner_credits", { p_partner: partner.id, p_credits: 1 });
    return false;
  }
  partner.lead_credits = creditsLeft;
  const now = new Date().toISOString();
  const { error: logError } = await sb
    .from("lead_deliveries")
    .upsert({ lead_id: lead.id, partner_id: partner.id, status: "sent", sent_at: now }, { onConflict: "lead_id,partner_id" });
  if (logError) console.error("[lead-delivery] delivery not recorded:", logError);
  return true;
}

async function markForwarded(sb: SupabaseClient, leadId: string): Promise<void> {
  const now = new Date().toISOString();
  await sb.from("softener_leads").update({ status: "forwarded", forwarded_at: now, forwarding_attempted_at: now }).eq("id", leadId);
}

export interface OfferResult {
  /** Company names the homeowner's details went to. */
  sentTo: string[];
  /** Installers who cover the district but had no credits. */
  withheld: number;
}

/** A new request: send it to the installers who cover the district and have credits. */
export async function offerNewLead(sb: SupabaseClient, lead: LeadRow): Promise<OfferResult> {
  const result: OfferResult = { sentTo: [], withheld: 0 };
  const send = mailer();
  if (!send || lead.consent_to_installer_sharing !== true) return result;

  const { data, error } = await sb.from("installer_partners").select(PARTNER_COLUMNS).eq("status", "active");
  if (error || !data) {
    if (error) console.error("[lead-delivery] partner load failed:", error);
    return result;
  }
  const covering = (data as PartnerRow[]).filter((p) => partnerCovers(p, lead.postcode_district));
  if (covering.length === 0) return result;

  const offered = new Set<string>();
  // Installers with credits first, longest standing first, until the cap is reached.
  // A failed send (credit raced away, email bounced) lets the next one in.
  for (const partner of pickPartners(covering.filter((p) => p.lead_credits > 0), lead.postcode_district, new Set(), covering.length)) {
    if (result.sentTo.length >= MAX_INSTALLERS_PER_LEAD) break;
    if (await sendLead(sb, send, lead, partner)) {
      result.sentTo.push(partner.company_name);
      offered.add(partner.id);
    }
  }

  // Everyone else who covers the district hears that a request came in, without
  // the homeowner's details, and can top up to receive it.
  for (const partner of covering) {
    if (offered.has(partner.id)) continue;
    const { error: logError } = await sb
      .from("lead_deliveries")
      .upsert({ lead_id: lead.id, partner_id: partner.id, status: "withheld" }, { onConflict: "lead_id,partner_id", ignoreDuplicates: true });
    if (logError) continue;
    if (await send(partner.email, FROM_LEADS, withheldEmail(lead, partner))) result.withheld++;
  }

  if (result.sentTo.length > 0) await markForwarded(sb, lead.id);
  return result;
}

/**
 * Send an installer the requests waiting for them, newest first, for as long as
 * they have credits: ones withheld from them earlier, and recent ones in their
 * areas that have not yet reached the cap. Each homeowner is told who will call.
 */
export async function releaseToPartner(sb: SupabaseClient, partnerId: string, now = new Date()): Promise<number> {
  const send = mailer();
  if (!send) return 0;

  const { data: partnerData } = await sb.from("installer_partners").select(PARTNER_COLUMNS).eq("id", partnerId).maybeSingle();
  const partner = partnerData as PartnerRow | null;
  if (!partner || partner.status !== "active" || partner.lead_credits <= 0) return 0;

  const since = new Date(now.getTime() - BACKLOG_MAX_AGE_DAYS * 86_400_000).toISOString();
  const { data: leadData } = await sb
    .from("softener_leads")
    .select(LEAD_COLUMNS)
    .eq("consent_to_installer_sharing", true)
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  const leads = ((leadData ?? []) as LeadRow[]).filter(
    (l) => isDeliverableBacklog(l, now) && partnerCovers(partner, l.postcode_district),
  );
  if (leads.length === 0) return 0;

  const { data: deliveryData } = await sb
    .from("lead_deliveries")
    .select("lead_id, partner_id, status")
    .in("lead_id", leads.map((l) => l.id))
    .eq("status", "sent");
  const sentTo = new Map<string, Set<string>>();
  for (const d of (deliveryData ?? []) as { lead_id: string; partner_id: string }[]) {
    const set = sentTo.get(d.lead_id) ?? new Set<string>();
    set.add(d.partner_id);
    sentTo.set(d.lead_id, set);
  }

  // Requests saved before repeats were caught at the door: the same person asking
  // twice for the same district must not cost an installer two credits.
  const seen = new Set<string>();
  const personKey = (l: LeadRow) => `${l.email.trim().toLowerCase()}|${l.postcode_district.toUpperCase()}`;
  for (const lead of leads) {
    if (sentTo.get(lead.id)?.has(partner.id)) seen.add(personKey(lead));
  }

  let delivered = 0;
  for (const lead of leads) {
    if (partner.lead_credits <= 0) break;
    const already = sentTo.get(lead.id) ?? new Set<string>();
    if (already.has(partner.id) || already.size >= MAX_INSTALLERS_PER_LEAD) continue;
    if (seen.has(personKey(lead))) continue;
    seen.add(personKey(lead));
    if (!(await sendLead(sb, send, lead, partner))) break;
    delivered++;
    await markForwarded(sb, lead.id);
    await send(lead.email, FROM_SITE, matchedEmail(lead, [partner.company_name]));
  }
  return delivered;
}

/** Recent, shareable requests per postcode area, for the partner page and the approval email. */
export async function waitingByArea(sb: SupabaseClient, days: number, now = new Date()): Promise<Map<string, number>> {
  const since = new Date(now.getTime() - days * 86_400_000).toISOString();
  const { data } = await sb.from("softener_leads").select("postcode_district, email").gte("created_at", since);
  const counts = new Map<string, number>();
  // One person asking twice for the same district is one request.
  const seen = new Set<string>();
  for (const row of (data ?? []) as { postcode_district: string; email: string }[]) {
    const district = row.postcode_district.toUpperCase();
    const key = `${row.email.trim().toLowerCase()}|${district}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const area = district.replace(/[0-9].*$/, "");
    if (area) counts.set(area, (counts.get(area) ?? 0) + 1);
  }
  return counts;
}
