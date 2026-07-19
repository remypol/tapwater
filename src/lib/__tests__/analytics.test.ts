import { afterEach, describe, expect, it, vi } from "vitest";
import { events } from "../analytics";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("conversion analytics", () => {
  it("keeps the legacy postcode search event while sending the canonical event", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });

    events.postcodeSearch("AL1");

    expect(gtag).toHaveBeenNthCalledWith(1, "event", "postcode_search_submitted", {
      postcode_area: "AL1",
    });
    expect(gtag).toHaveBeenNthCalledWith(2, "event", "postcode_search", {
      district: "AL1",
    });
  });

  it("sends the canonical affiliate click event", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });

    events.affiliateClick({
      page_type: "postcode",
      product_slug: "brita-marella-xl",
      campaign: "postcode-result",
    });

    expect(gtag).toHaveBeenCalledWith("event", "affiliate_click", {
      page_type: "postcode",
      product_slug: "brita-marella-xl",
      campaign: "postcode-result",
    });
  });

  it("sends recommendation impressions and water report views", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });

    events.recommendationImpression({ placement: "postcode-summary" });
    events.waterReportViewed("AL1", "good");

    expect(gtag).toHaveBeenNthCalledWith(1, "event", "recommendation_impression", {
      placement: "postcode-summary",
    });
    expect(gtag).toHaveBeenNthCalledWith(2, "event", "water_report_viewed", {
      postcode_area: "AL1",
      water_score_band: "good",
    });
  });
});
