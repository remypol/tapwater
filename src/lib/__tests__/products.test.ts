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
      expect(p.affiliateProgram).toMatch(/^(amazon|impact|direct)$/);
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
