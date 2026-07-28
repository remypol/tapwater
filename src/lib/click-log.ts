/**
 * First-party affiliate click logging.
 *
 * GA4 lives on an account the site's operators cannot read, Amazon cannot
 * report per product for plain /dp/ links, and the partner dashboards sit
 * behind their own logins. This is the one record of "which product, on which
 * page, toward which programme" that the site itself controls. Deliberately
 * no visitor identity: product, partner, page, placement, campaign, nothing
 * else.
 */

export type ClickPartner = "amazon" | "awin" | "osmio" | "impact" | "other";

export interface ClickPayload {
  productSlug: string;
  partner: ClickPartner;
  page: string;
  placement?: string;
  campaign?: string;
}

function matchesDomain(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

/** Which programme a destination URL pays into. */
export function partnerFromUrl(url: string): ClickPartner {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return "other";
  }
  if (matchesDomain(host, "amazon.co.uk") || matchesDomain(host, "amazon.com") || matchesDomain(host, "amzn.to")) {
    return "amazon";
  }
  if (matchesDomain(host, "awin1.com") || matchesDomain(host, "tidd.ly")) return "awin";
  if (matchesDomain(host, "osmiowater.co.uk")) return "osmio";
  if (matchesDomain(host, "sjv.io") || matchesDomain(host, "pxf.io") || matchesDomain(host, "impact.com")) {
    return "impact";
  }
  return "other";
}

export function buildClickPayload(input: {
  destinationUrl: string;
  productSlug?: string;
  pathname?: string;
  placement?: string;
  campaign?: string;
}): ClickPayload {
  return {
    productSlug: input.productSlug || "unknown",
    partner: partnerFromUrl(input.destinationUrl),
    page: input.pathname || "unknown",
    placement: input.placement,
    campaign: input.campaign,
  };
}

/** Fire-and-forget; must never block or break the outbound click. */
export function sendClickBeacon(payload: ClickPayload): void {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify(payload);
    const sent = navigator.sendBeacon?.(
      "/api/click",
      new Blob([body], { type: "application/json" }),
    );
    if (!sent) {
      void fetch("/api/click", {
        method: "POST",
        body,
        keepalive: true,
        headers: { "Content-Type": "application/json" },
      }).catch(() => {});
    }
  } catch {
    // Logging must never cost a click.
  }
}
