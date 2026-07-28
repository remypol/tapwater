import { describe, expect, it } from "vitest";
import { buildClickPayload, partnerFromUrl } from "../click-log";

describe("partnerFromUrl", () => {
  it("recognises every programme the site actually links to", () => {
    expect(
      partnerFromUrl("https://www.amazon.co.uk/dp/B0BT1HTR9Q?tag=tapwater2107-21"),
    ).toBe("amazon");
    expect(
      partnerFromUrl("https://www.awin1.com/cread.php?awinmid=117649&awinaffid=2996923&ued=x"),
    ).toBe("awin");
    expect(
      partnerFromUrl("https://www.osmiowater.co.uk/osmio-fusion.html?aw_affiliate=abc"),
    ).toBe("osmio");
    expect(partnerFromUrl("https://echowater.sjv.io/7XbX9d")).toBe("impact");
  });

  it("does not misfile lookalike or broken urls", () => {
    expect(partnerFromUrl("https://notamazon.co.uk/dp/x")).toBe("other");
    expect(partnerFromUrl("https://example.com/awin1.com")).toBe("other");
    expect(partnerFromUrl("https://evilawin1.com/x")).toBe("other");
    expect(partnerFromUrl("not a url")).toBe("other");
  });
});

describe("buildClickPayload", () => {
  it("fills exactly the fields the log table stores, nothing personal", () => {
    const p = buildClickPayload({
      destinationUrl: "https://www.amazon.co.uk/dp/X?tag=t",
      productSlug: "brita-maxtra-pro",
      pathname: "/postcode/W6",
      placement: "postcode-summary",
      campaign: "postcode-result",
    });
    expect(p).toEqual({
      productSlug: "brita-maxtra-pro",
      partner: "amazon",
      page: "/postcode/W6",
      placement: "postcode-summary",
      campaign: "postcode-result",
    });
  });

  it("never sends empty identifiers", () => {
    const p = buildClickPayload({ destinationUrl: "not a url" });
    expect(p.productSlug).toBe("unknown");
    expect(p.page).toBe("unknown");
    expect(p.partner).toBe("other");
  });
});
