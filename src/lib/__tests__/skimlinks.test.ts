import { describe, it, expect } from "vitest";
import { PRODUCTS } from "../products";
import { OUR_OWN_PARTNER_DOMAINS } from "../skimlinks";

/** Markers that mean a link already carries affiliate tracking we get paid for. */
const TRACKED = /[?&]tag=|aw_affiliate=|awinmid=|irclickid=|[?&]u1=/;
/** Networks whose domain alone means the link is tracked. */
const TRACKING_HOSTS = /(^|\.)(pxf\.io|sjv\.io|awin1\.com)$/;

function hostOf(url: string): string {
  return new URL(url).hostname;
}

function isExcluded(host: string): boolean {
  return OUR_OWN_PARTNER_DOMAINS.some(
    (d) => host === d || host.endsWith(`.${d}`),
  );
}

describe("Skimlinks exclusions", () => {
  // Skimlinks rewrites merchant links it does not recognise as affiliate links,
  // and it explicitly does that for direct programmes whose tracking lives on the
  // merchant's own domain — our Osmio links, worth a £50-75 bounty each. If a new
  // partner is added and nobody updates the exclusion list, Skimlinks quietly
  // takes those sales and the only symptom is revenue that never appears.
  it("excludes every domain we already earn a commission on", () => {
    const unprotected = PRODUCTS.filter((p) => {
      const host = hostOf(p.affiliateUrl);
      const tracked = TRACKED.test(p.affiliateUrl) || TRACKING_HOSTS.test(host);
      return tracked && !isExcluded(host);
    }).map((p) => `${p.id} → ${hostOf(p.affiliateUrl)}`);

    expect(unprotected).toEqual([]);
  });

  // The flip side: excluding a shop we have no deal with just throws away the
  // revenue Skimlinks was installed to collect.
  it("does not exclude domains we earn nothing on", () => {
    const pointless = PRODUCTS.filter((p) => {
      const host = hostOf(p.affiliateUrl);
      const tracked = TRACKED.test(p.affiliateUrl) || TRACKING_HOSTS.test(host);
      return !tracked && isExcluded(host);
    }).map((p) => `${p.id} → ${hostOf(p.affiliateUrl)}`);

    expect(pointless).toEqual([]);
  });

  it("lists bare domains, so subdomains are covered too", () => {
    for (const domain of OUR_OWN_PARTNER_DOMAINS) {
      expect(domain).not.toMatch(/^www\./);
      expect(domain).not.toMatch(/^https?:/);
      expect(domain).not.toMatch(/\//);
    }
  });
});
