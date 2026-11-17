/**
 * Emails subscribers when a supply incident is published for their district.
 * This is the promise the signup on the postcode page makes. Pure, so the
 * matching and the email text are unit-tested; the cron route does the sending.
 */

import type { Incident } from "./incidents-types";
import { INCIDENT_TYPE_LABELS } from "./incidents-types";

const BASE_URL = "https://www.tapwater.uk";

export interface AlertSubscriber {
  id: string | number;
  email: string;
  postcode_district: string | null;
  verified: boolean | null;
  unsubscribed: boolean | null;
  unsubscribe_token: string | null;
}

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Confirmed subscribers whose district is one the incident names. One email per address. */
export function subscribersForIncident<S extends AlertSubscriber>(
  incident: Pick<Incident, "affected_postcodes">,
  subscribers: S[],
): S[] {
  const districts = new Set(incident.affected_postcodes.map((d) => d.trim().toUpperCase()));
  if (districts.size === 0) return [];
  const seen = new Set<string>();
  const out: S[] = [];
  for (const s of subscribers) {
    if (s.verified !== true || s.unsubscribed === true || !s.postcode_district) continue;
    if (!districts.has(s.postcode_district.trim().toUpperCase())) continue;
    const key = s.email.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

export function unsubscribeUrl(sub: Pick<AlertSubscriber, "email" | "unsubscribe_token">): string {
  return sub.unsubscribe_token
    ? `${BASE_URL}/unsubscribe?t=${encodeURIComponent(sub.unsubscribe_token)}`
    : `${BASE_URL}/unsubscribe?email=${encodeURIComponent(sub.email)}`;
}

export function incidentAlertEmail(
  incident: Pick<Incident, "title" | "slug" | "type" | "summary" | "action_required" | "source_url">,
  sub: AlertSubscriber,
): { subject: string; html: string } {
  const district = (sub.postcode_district ?? "").toUpperCase();
  const label = INCIDENT_TYPE_LABELS[incident.type] ?? "Water incident";
  const url = `${BASE_URL}/news/${incident.slug}`;
  return {
    subject: `${label} affecting ${district}: ${incident.title}`,
    html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.55;color:#08122e;max-width:560px;">
<p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#06257a;">${esc(label)} in ${esc(district)}</p>
<h1 style="margin:0 0 14px;font-size:22px;line-height:1.2;">${esc(incident.title)}</h1>
<p>${esc(incident.summary)}</p>
${incident.action_required ? `<p><strong>What to do:</strong> ${esc(incident.action_required)}</p>` : ""}
<p style="margin:24px 0;"><a href="${url}" style="display:inline-block;padding:14px 26px;border-radius:999px;background:#06257a;color:#ffffff;text-decoration:none;font-weight:700;">Read the details</a></p>
${incident.source_url ? `<p style="font-size:14px;">Source: <a href="${esc(incident.source_url)}">${esc(incident.source_url)}</a></p>` : ""}
<p style="margin-top:28px;font-size:12px;color:#4a5a80;">You asked TapWater.uk to email you about the water in ${esc(district)}. <a href="${unsubscribeUrl(sub)}" style="color:#4a5a80;">Unsubscribe</a></p>
</div>`,
  };
}
