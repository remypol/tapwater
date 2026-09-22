import { describe, it, expect } from "vitest";
import { PRODUCTS, CATEGORY_META, getProductsByCategory, getProductBySlug, estimatedEarningsGbp } from "../products";
import { BRAND_COMPARISONS } from "../brand-comparisons";
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
      // Awin: publisher id, not the merchant id, is the part that pays us. 3091503
      // is CCC Impact BV. Awin redirects for any live publisher id whether or not
      // it has joined the merchant, so a working link proves nothing: check the
      // merchant is on the Joined tab of this account before adding one.
      "awin1.com": (u) => u.searchParams.get("awinaffid") === "3091503",
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
      "shower", "testing_kit", "countertop", "filter_tap",
      "kettle", "boiling_tap",
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

  it("returns null rather than a guess when the rate or price is unconfirmed", () => {
    for (const p of PRODUCTS) {
      const earnings = estimatedEarningsGbp(p);
      // A percentage of an unknown price (priceGbp 0 renders "Check price") is
      // not an estimate either, so it must come back blank, not zero.
      const knowable =
        p.commission && (p.commission.type === "fixed" || p.priceGbp > 0);
      if (knowable) expect(earnings).toBeGreaterThan(0);
      else expect(earnings).toBeNull();
    }
  });

  it("every softener consumable is an Amazon product with a check-price placeholder", () => {
    const salt = getProductsByCategory("softener_salt");
    expect(salt.length).toBe(7);
    for (const p of salt) {
      expect(p.affiliateProgram).toBe("amazon");
      expect(p.priceGbp).toBe(0);
      expect(p.imageUrl).toMatch(/^https:\/\/m\.media-amazon\.com\//);
    }
  });

  it("values a fixed bounty far above an Amazon percentage, which is the point", () => {
    const osmio = PRODUCTS.find((p) => p.id === "osmio-zero")!;
    const jug = PRODUCTS.find((p) => p.id === "brita-maxtra-pro")!;

    expect(estimatedEarningsGbp(osmio)).toBe(65);
    expect(estimatedEarningsGbp(jug)).toBeCloseTo(0.75, 2);
  });
});

// The guides work out most price gaps from priceGbp, but the sentences around
// them still say which product is cheaper ("£100 less than the Waterdrop", "only
// the Osmio Fusion 3.0 costs more"). A price change can make those false without
// touching a word: on 22 Sept the Frizzlife was still "£70 less" than the
// Waterdrop although frizzlife.co.uk had it at £449.99 against £549.98.
describe("prices the guide copy compares", () => {
  const price = (id: string) => {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p) throw new Error(`No product ${id}`);
    return p.priceGbp;
  };

  it("the Frizzlife PD600 stays cheaper than the Waterdrop G3P600", () => {
    expect(price("frizzlife-pd600")).toBeLessThan(price("waterdrop-g3p600"));
  });

  it("the Osmio Zero and Fusion 2.0 still cost more than the Frizzlife PD600", () => {
    expect(price("osmio-zero")).toBeGreaterThan(price("frizzlife-pd600"));
    expect(price("osmio-fusion-2")).toBeGreaterThan(price("frizzlife-pd600"));
  });

  it("only the Osmio Fusion 3.0 costs more than the Waterdrop G3P600", () => {
    const dearer = getProductsByCategory("reverse_osmosis")
      .filter((p) => p.priceGbp > price("waterdrop-g3p600"))
      .map((p) => p.id);
    expect(dearer).toEqual(["osmio-fusion-3"]);
  });

  it("the Waterdrop G3P600 is the dearest of the PFAS guide's four picks", () => {
    for (const id of ["frizzlife-pd600", "zerowater-12cup", "tapp-water-ecopro"]) {
      expect(price(id)).toBeLessThan(price("waterdrop-g3p600"));
    }
  });

  // The comparison page prints the catalogue price in its table, with this
  // hand-written line a few rows below it.
  it("comparison pages quote the catalogue price for upfront cost", () => {
    for (const c of BRAND_COMPARISONS) {
      const point = c.comparisonPoints.find((pt) => pt.category === "Upfront cost");
      if (!point) continue;
      expect(point.brand1).toMatch(new RegExp(`^£${price(c.brand1ProductId)}\\b`));
      expect(point.brand2).toMatch(new RegExp(`^£${price(c.brand2ProductId)}\\b`));
    }
  });

  it("category price ranges span the products listed in them", () => {
    for (const [category, meta] of Object.entries(CATEGORY_META)) {
      const prices = getProductsByCategory(category as ProductCategory).map((p) => p.priceGbp);
      // Empty categories and "Check price" products (0) keep hand-written ranges.
      if (prices.length === 0 || prices.some((p) => p <= 0)) continue;
      const lo = Math.min(...prices);
      const hi = Math.max(...prices);
      expect(meta.priceRange, category).toBe(lo === hi ? `£${lo}` : `£${lo}–£${hi}`);
    }
  });
});
