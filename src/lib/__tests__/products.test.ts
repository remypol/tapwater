import { describe, it, expect } from "vitest";
import { PRODUCTS, getProductsByCategory, getProductBySlug } from "../products";
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
