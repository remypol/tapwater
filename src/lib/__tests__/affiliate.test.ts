import { describe, expect, it } from "vitest";
import { buildAffiliateUrl, createAffiliatePayload, getDestinationHost } from "../affiliate";

describe("buildAffiliateUrl", () => {
  it("preserves Amazon special links without decorating them", () => {
    const original = "https://www.amazon.co.uk/dp/B0BT1HTR9Q?tag=tapwater2107-21";
    const url = buildAffiliateUrl(
      original,
      { campaign: "postcode-result", productSlug: "brita-marella-xl" },
    );

    expect(url).toBe(original);
  });

  // Adding our own tracking must never cost us the partner's. Osmio pays a £50-75
  // fixed bounty and identifies the sale purely by aw_affiliate; drop or mangle that
  // parameter and the sale still happens, we just never get paid for it.
  it("keeps a partner's own tracking parameter intact while adding ours", () => {
    const affiliateParam =
      "eyJjYW1wYWlnbl9pZCI6IjEiLCJ0cmFmZmljX3NvdXJjZSI6Im5vX3NvdXJjZSIsImFjY291bnRfaWQiOjIxM30";
    const url = buildAffiliateUrl(
      `https://www.osmiowater.co.uk/zip-portable-reverse-osmosis-system.html?aw_affiliate=${affiliateParam}`,
      { campaign: "best-reverse-osmosis-guide", productSlug: "osmio-zero" },
    );
    const parsed = new URL(url);

    expect(parsed.searchParams.get("aw_affiliate")).toBe(affiliateParam);
    expect(parsed.searchParams.get("utm_campaign")).toBe("best-reverse-osmosis-guide");
  });

  it("replaces stale campaign values instead of duplicating them", () => {
    const url = buildAffiliateUrl(
      "https://example.com/product?utm_campaign=unknown&utm_source=old",
      { campaign: "filter-category", productSlug: "test-product" },
    );
    const parsed = new URL(url);

    expect(parsed.searchParams.getAll("utm_campaign")).toEqual(["filter-category"]);
    expect(parsed.searchParams.getAll("utm_source")).toEqual(["tapwater"]);
  });

  it("never crashes a page when a future catalogue URL is malformed", () => {
    expect(buildAffiliateUrl("#", {
      campaign: "postcode-result",
      productSlug: "future-product",
    })).toBe("#");
    expect(getDestinationHost("#")).toBe("unknown");
  });

  it("blocks non-http catalogue protocols", () => {
    expect(buildAffiliateUrl("javascript:alert(1)", {
      campaign: "postcode-result",
      productSlug: "future-product",
    })).toBe("#");
  });
});

describe("createAffiliatePayload", () => {
  it("uses only the outward postcode area and includes conversion context", () => {
    expect(createAffiliatePayload({
      pageType: "postcode",
      pathname: "/postcode/AL1",
      postcodeArea: "al1 2ab",
      waterScoreBand: "good",
      recommendationReason: "lead",
      productCategory: "jug",
      productSlug: "zerowater-12-cup",
      placement: "postcode-summary",
      campaign: "postcode-result",
      destinationUrl: "https://www.amazon.co.uk/dp/example",
    })).toEqual({
      page_type: "postcode",
      pathname: "/postcode/AL1",
      postcode_area: "AL1",
      water_score_band: "good",
      recommendation_reason: "lead",
      product_category: "jug",
      product_slug: "zerowater-12-cup",
      placement: "postcode-summary",
      campaign: "postcode-result",
      destination_host: "www.amazon.co.uk",
    });
  });

  it("removes the inward code from an unspaced full postcode", () => {
    const payload = createAffiliatePayload({
      pageType: "postcode",
      pathname: "/postcode/AL1",
      postcodeArea: "AL12AB",
      productCategory: "jug",
      productSlug: "brita-marella-xl",
      recommendationReason: "taste",
      placement: "postcode-summary",
      campaign: "postcode-result",
      destinationUrl: "https://www.amazon.co.uk/dp/example",
    });

    expect(payload.postcode_area).toBe("AL1");
  });
});
