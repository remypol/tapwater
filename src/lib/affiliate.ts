export interface AffiliateAttribution {
  campaign: string;
  productSlug: string;
}

export interface AffiliateContext {
  pageType: string;
  pathname: string;
  postcodeArea?: string;
  waterScoreBand?: string;
  recommendationReason: string;
  productCategory: string;
  productSlug: string;
  placement: string;
  campaign: string;
  destinationUrl: string;
}

export type AffiliateEventPayload = Record<string, string>;

export function buildAffiliateUrl(
  baseUrl: string,
  attribution: AffiliateAttribution,
): string {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    return baseUrl;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return "#";
  if (/(^|\.)amazon\./.test(url.hostname)) return url.toString();
  url.searchParams.set("utm_source", "tapwater");
  url.searchParams.set("utm_medium", "affiliate");
  url.searchParams.set("utm_campaign", attribution.campaign);
  url.searchParams.set("utm_content", attribution.productSlug);
  return url.toString();
}

function outwardPostcode(postcode?: string): string {
  const clean = postcode?.trim().toUpperCase() ?? "";
  const fullPostcode = clean.match(/^([A-Z]{1,2}\d[A-Z\d]?)\s*\d[A-Z]{2}$/);
  return fullPostcode?.[1] ?? clean.split(/\s+/)[0];
}

export function getDestinationHost(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "unknown";
    return parsed.hostname;
  } catch {
    return "unknown";
  }
}

export function createAffiliatePayload(
  context: AffiliateContext,
): AffiliateEventPayload {
  return {
    page_type: context.pageType,
    pathname: context.pathname,
    postcode_area: outwardPostcode(context.postcodeArea),
    water_score_band: context.waterScoreBand ?? "unknown",
    recommendation_reason: context.recommendationReason,
    product_category: context.productCategory,
    product_slug: context.productSlug,
    placement: context.placement,
    campaign: context.campaign,
    destination_host: getDestinationHost(context.destinationUrl),
  };
}
