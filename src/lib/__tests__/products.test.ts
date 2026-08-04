import { describe, it, expect } from "vitest";
import { PRODUCTS, getProductsByCategory, getProductBySlug, estimatedEarningsGbp } from "../products";
import type { ProductCategory } from "../types";

describe("PRODUCTS catalogue", () => {
  it("has at least 20 products", () => {
    expect(PRODUCTS.length).toBeGreaterThanOrEqual(20);
  });

  it("every product has required fields", () => {
    for (const p of PRODUCTS) {
      expect(p.id).toBeTruthy();
      expect(p.brand).toBeTruthy();
      expect(p.model).toBeTruthy();
      expect(p.slug).toBeTruthy();
      expect(p.category).toBeTruthy();
      expect(p.affiliateUrl).toMatch(/^https:\/\//);
      expect(p.rating).toBeGreaterThan(0);
      expect(p.rating).toBeLessThanOrEqual(5);
      expect(p.pros.length).toBeGreaterThan(0);
      expect(p.cons.length).toBeGreaterThan(0);
      expect(p.bestFor).toBeTruthy();
      expect(p.priceTier).toMatch(/^(budget|mid|premium)$/);
      expect(p.affiliateProgram).toMatch(/^(amazon|impact|awin|direct)$/);
    }
  });

  it("has no duplicate IDs", () => {
    const ids = PRODUCTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has no duplicate slugs", () => {
    const slugs = PRODUCTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  // A product whose link is missing its tracking still sends the visitor to the shop —
  // we just earn nothing on the sale, which is worse than not linking at all. Deep links
  // sometimes have to be fetched from a partner dashboard after the product is written,
  // so this fails loudly for as long as a placeholder is left in place.
  it("has no placeholder affiliate URLs", () => {
    const unfinished = PRODUCTS.filter((p) =>
      /placeholder/i.test(p.affiliateUrl),
    ).map((p) => p.id);

    expect(unfinished).toEqual([]);
  });

  // The placeholder check above only catches links we knew were unfinished. This one
  // catches the worse case: a link that looks completely normal and works for the
  // visitor, but carries someone else's tracking or none at all. Three products sat
  // in this catalogue that way — a £499 system paying a stranger's Impact account, and
  // two bare shop links including the most expensive item on the site. Nothing on the
  // page, in the build, or in the click log looked wrong, because nothing was wrong
  // except who got paid. So every link must prove which of our accounts it credits.
  it("every product carries our affiliate tracking", () => {
    const OUR_TRACKING: Record<string, (url: URL) => boolean> = {
      // Amazon Associates: the tag is the whole attribution.
      "amazon.co.uk": (u) => u.searchParams.get("tag") === "tapwater2107-21",
      // Awin: publisher id, not the merchant id, is the part that pays us.
      "awin1.com": (u) => u.searchParams.get("awinaffid") === "2996923",
      // Osmio runs its own Magento program. The account id sits inside a base64
      // payload, so a truncated or hand-edited token has to be decoded to be caught.
      "osmiowater.co.uk": (u) => {
        const token = u.searchParams.get("aw_affiliate");
        if (!token) return false;
        try {
          const payload = JSON.parse(
            Buffer.from(token, "base64").toString("utf8"),
          );
          return payload.account_id === 213 && Boolean(payload.campaign_id);
        } catch {
          return false;
        }
      },
    };

    const untracked = PRODUCTS.filter((p) => {
      const url = new URL(p.affiliateUrl);
      const host = url.hostname.replace(/^www\./, "");
      const check = OUR_TRACKING[host];
      return !check || !check(url);
    }).map((p) => `${p.id} -> ${p.affiliateUrl}`);

    expect(untracked).toEqual([]);
  });

  it("has products in every category", () => {
    const categories: ProductCategory[] = [
      "jug", "under_sink", "reverse_osmosis", "whole_house",
      "shower", "testing_kit", "countertop",
    ];
    for (const cat of categories) {
      const products = getProductsByCategory(cat);
      expect(products.length).toBeGreaterThan(0);
    }
  });

  it("getProductBySlug returns correct product", () => {
    const first = PRODUCTS[0];
    const found = getProductBySlug(first.slug);
    expect(found).toBeDefined();
    expect(found!.id).toBe(first.id);
  });

  it("getProductBySlug returns undefined for unknown slug", () => {
    expect(getProductBySlug("nonexistent-product")).toBeUndefined();
  });
});

describe("commission data", () => {
  it("never records a commission of zero or below", () => {
    for (const p of PRODUCTS) {
      if (!p.commission) continue;
      const value =
        p.commission.type === "fixed" ? p.commission.gbp : p.commission.rate;
      expect(value).toBeGreaterThan(0);
    }
  });

  it("returns null rather than a guess when the rate is unconfirmed", () => {
    for (const p of PRODUCTS) {
      const earnings = estimatedEarningsGbp(p);
      if (p.commission) expect(earnings).toBeGreaterThan(0);
      else expect(earnings).toBeNull();
    }
  });

  it("values a fixed bounty far above an Amazon percentage, which is the point", () => {
    const osmio = PRODUCTS.find((p) => p.id === "osmio-zero")!;
    const jug = PRODUCTS.find((p) => p.id === "brita-maxtra-pro")!;

    expect(estimatedEarningsGbp(osmio)).toBe(65);
    expect(estimatedEarningsGbp(jug)).toBeCloseTo(0.75, 2);
  });
});
