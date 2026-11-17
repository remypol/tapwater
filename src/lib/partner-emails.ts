/**
 * Every email the installer marketplace sends, as plain functions that return a
 * subject and HTML. Anything typed into a form is escaped before it reaches HTML.
 */

import { FREE_LEADS, PACK_LEADS, PACK_PRICE_GBP, PRICE_PER_LEAD_GBP, formatGbp } from "./partner-offer";

export const SITE_URL = "https://www.tapwater.uk";
export const FROM_LEADS = "TapWater.uk Leads <alerts@tapwater.uk>";
export const FROM_SITE = "TapWater.uk <alerts@tapwater.uk>";

export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface EmailLead {
  name: string;
  email: string;
  phone: string;
  postcode_district: string;
  hardness_value: number | null;
  hardness_label: string | null;
  created_at?: string | null;
}

export interface EmailPartner {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  access_token: string | null;
}

export interface Mail {
  subject: string;
  html: string;
}

const wrap = (body: string) =>
  `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.55;color:#031349;max-width:560px;">${body}<p style="margin-top:28px;font-size:12px;color:#5b6b8c;">TapWater.uk · <a href="${SITE_URL}/partners" style="color:#5b6b8c;">Installer programme</a></p></div>`;

const row = (label: string, value: string) =>
  `<tr><td style="padding:4px 16px 4px 0;font-weight:600;white-space:nowrap;">${label}</td><td style="padding:4px 0;">${value}</td></tr>`;

const button = (href: string, label: string) =>
  `<p style="margin:24px 0;"><a href="${href}" style="display:inline-block;padding:14px 26px;border-radius:999px;background:#031349;color:#ffffff;text-decoration:none;font-weight:700;">${label}</a></p>`;

function hardnessText(lead: Pick<EmailLead, "hardness_value" | "hardness_label">): string {
  if (lead.hardness_value == null) return "Not measured";
  return `${Math.round(lead.hardness_value)} mg/L${lead.hardness_label ? ` (${esc(lead.hardness_label)})` : ""}`;
}

function askedOn(lead: EmailLead): string {
  if (!lead.created_at) return "";
  const d = new Date(lead.created_at);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });
}

export function topUpUrl(partner: Pick<EmailPartner, "id" | "access_token">): string {
  return `${SITE_URL}/partners/top-up?p=${encodeURIComponent(partner.id)}&t=${encodeURIComponent(partner.access_token ?? "")}`;
}

export function approveUrl(partner: Pick<EmailPartner, "id" | "access_token">): string {
  return `${SITE_URL}/api/partners/approve?p=${encodeURIComponent(partner.id)}&t=${encodeURIComponent(partner.access_token ?? "")}`;
}

/** To the installer: a homeowner's full details. Uses one credit. */
export function leadEmail(lead: EmailLead, partner: EmailPartner, creditsLeft: number): Mail {
  const asked = askedOn(lead);
  const left =
    creditsLeft > 0
      ? `You have ${creditsLeft} lead${creditsLeft === 1 ? "" : "s"} left on your account.`
      : `That was your last lead. <a href="${topUpUrl(partner)}">Add ${PACK_LEADS} more for ${formatGbp(PACK_PRICE_GBP)}</a> so the next request in your area reaches you.`;
  return {
    subject: `Softener quote request in ${lead.postcode_district}`,
    html: wrap(`
<h2 style="margin:0 0 8px;font-size:20px;">A homeowner in ${esc(lead.postcode_district)} wants softener quotes</h2>
<p>They checked their water on TapWater.uk, saw how hard it is, and asked to be contacted by a local installer.</p>
<table style="border-collapse:collapse;margin:16px 0;">
${row("Name", esc(lead.name))}
${row("Phone", `<a href="tel:${esc(lead.phone)}">${esc(lead.phone)}</a>`)}
${row("Email", `<a href="mailto:${esc(lead.email)}">${esc(lead.email)}</a>`)}
${row("Postcode district", esc(lead.postcode_district))}
${row("Water hardness", hardnessText(lead))}
${asked ? row("Asked on", asked) : ""}
</table>
<p>Call within a day if you can: the first installer to ring usually gets the visit. This request went to at most two installers.</p>
<p style="color:#5b6b8c;font-size:13px;">${left}</p>`),
  };
}

/** To an installer with no credits: what they are missing, without any personal details. */
export function withheldEmail(lead: Pick<EmailLead, "postcode_district" | "hardness_value" | "hardness_label">, partner: EmailPartner): Mail {
  return {
    subject: `New softener request in ${lead.postcode_district} is waiting for you`,
    html: wrap(`
<h2 style="margin:0 0 8px;font-size:20px;">A homeowner in ${esc(lead.postcode_district)} just asked for softener quotes</h2>
<table style="border-collapse:collapse;margin:16px 0;">
${row("Postcode district", esc(lead.postcode_district))}
${row("Water hardness", hardnessText(lead))}
</table>
<p>Your account has no leads left, so we have not sent you their contact details. Add ${PACK_LEADS} leads for ${formatGbp(PACK_PRICE_GBP)} (${formatGbp(PRICE_PER_LEAD_GBP)} each) and this request is sent to you straight away, while it is still open.</p>
${button(topUpUrl(partner), `Add ${PACK_LEADS} leads`)}
<p style="color:#5b6b8c;font-size:13px;">Requests go to at most two installers, so one that waits may be taken by someone else.</p>`),
  };
}

/** To the installer when their account goes live. */
export function welcomeEmail(partner: EmailPartner, areas: string[], credits: number): Mail {
  return {
    subject: "Your TapWater.uk installer account is live",
    html: wrap(`
<h2 style="margin:0 0 8px;font-size:20px;">You are live, ${esc(partner.contact_name)}</h2>
<p>${esc(partner.company_name)} now receives softener quote requests from homeowners in <strong>${esc(areas.join(", "))}</strong>.</p>
<p>Your first ${credits} lead${credits === 1 ? " is" : "s are"} free. Each one arrives by email with the homeowner's name, phone number, email, postcode district and measured water hardness. Any recent requests already waiting in your areas follow this email.</p>
<p>After that, leads are ${formatGbp(PRICE_PER_LEAD_GBP)} each, bought ${PACK_LEADS} at a time by card. No contract and no monthly fee.</p>
${button(topUpUrl(partner), "View your account")}`),
  };
}

/** To the installer straight after signup. */
export function applicationEmail(partner: Pick<EmailPartner, "contact_name" | "company_name">, areas: string[]): Mail {
  return {
    subject: "We have your TapWater.uk installer application",
    html: wrap(`
<h2 style="margin:0 0 8px;font-size:20px;">Thanks, ${esc(partner.contact_name)}</h2>
<p>We have the application for ${esc(partner.company_name)} covering <strong>${esc(areas.join(", "))}</strong>.</p>
<p>We check every installer before sharing homeowners' details, usually within one working day. You will get an email the moment your account is live, and your first ${FREE_LEADS} leads are free.</p>`),
  };
}

/** To us: a new installer to check, with the link that switches them on. */
export function adminApplicationEmail(
  partner: EmailPartner & { phone: string; website: string | null },
  areas: string[],
  waiting: number,
): Mail {
  return {
    subject: `New installer to approve: ${partner.company_name}`,
    html: wrap(`
<h2 style="margin:0 0 8px;font-size:20px;">New installer application</h2>
<table style="border-collapse:collapse;margin:16px 0;">
${row("Company", esc(partner.company_name))}
${row("Contact", esc(partner.contact_name))}
${row("Email", esc(partner.email))}
${row("Phone", esc(partner.phone))}
${row("Website", partner.website ? esc(partner.website) : "none given")}
${row("Areas", esc(areas.join(", ")))}
</table>
<p>Check they are a real softener installer (website, Companies House, a phone call if unsure). Approving sends them their ${FREE_LEADS} free leads${waiting > 0 ? `, starting with ${waiting} recent request${waiting === 1 ? "" : "s"} already waiting in those areas` : ""}.</p>
${button(approveUrl(partner), "Review and approve")}
<p style="color:#5b6b8c;font-size:13px;">The link opens a confirmation page; nothing happens until you press the button there.</p>`),
  };
}

/** To the homeowner when their request has gone to an installer. */
export function matchedEmail(lead: Pick<EmailLead, "name" | "postcode_district">, companies: string[]): Mail {
  const who = companies.length === 1 ? companies[0] : `${companies.slice(0, -1).join(", ")} and ${companies[companies.length - 1]}`;
  return {
    subject: `Your softener quote request for ${lead.postcode_district}`,
    html: wrap(`
<h2 style="margin:0 0 8px;font-size:20px;">We have passed on your request, ${esc(lead.name)}</h2>
<p>Your request for water softener quotes in ${esc(lead.postcode_district)} has gone to <strong>${esc(who)}</strong>. Expect a call or an email from them in the next few days.</p>
<p>There is no obligation to buy. If you would rather not be contacted, reply to this email and we will tell them.</p>
<p><a href="${SITE_URL}/guides/water-softener-cost-uk">What a softener should cost</a> is worth five minutes before the call.</p>`),
  };
}

/** To us: a card payment came in. */
export function adminPurchaseEmail(company: string, credits: number, amountPence: number): Mail {
  return {
    subject: `Installer top-up: ${company} bought ${credits} leads`,
    html: wrap(`<p><strong>${esc(company)}</strong> paid ${formatGbp(amountPence / 100)} for ${credits} leads.</p>`),
  };
}
