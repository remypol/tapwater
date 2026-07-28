import { describe, expect, it } from "vitest";
import {
  recommendFilters,
  productAddresses,
  HARD_WATER_THRESHOLD,
} from "../filters";

/**
 * These cover the gap between how readings name a substance and how products describe
 * what they remove. Matching those as exact strings dropped real matches silently, so
 * a postcode flagged for "Chlorine residual" was shown nothing that removes chlorine.
 */
describe("productAddresses", () => {
  it("matches official reading names to product capabilities", () => {
    const chlorineFilter = { removes: ["Chlorine", "Lead"] };

    // The reading is called "Chlorine residual", the product says "Chlorine".
    expect(productAddresses(chlorineFilter, "Chlorine residual")).toBe(true);
    // Exact names still work.
    expect(productAddresses(chlorineFilter, "Lead")).toBe(true);
    // And it does not invent matches.
    expect(productAddresses(chlorineFilter, "Arsenic")).toBe(false);
  });

  it("maps bacteria readings and PFAS variants onto product wording", () => {
    expect(productAddresses({ removes: ["Bacteria"] }, "Coliform bacteria")).toBe(true);
    expect(productAddresses({ removes: ["Bacteria"] }, "E. coli")).toBe(true);
    expect(productAddresses({ removes: ["PFAS (total)"] }, "PFOS")).toBe(true);
  });

  it("treats singular and plural nitrate as the same substance", () => {
    expect(productAddresses({ removes: ["Nitrate"] }, "Nitrate")).toBe(true);
    expect(productAddresses({ removes: ["Nitrates"] }, "Nitrate")).toBe(true);
  });

  it("is case and whitespace insensitive", () => {
    expect(productAddresses({ removes: ["  chlorine "] }, "CHLORINE RESIDUAL")).toBe(true);
  });
});

describe("recommendFilters", () => {
  /**
   * Scoring only counts name matches against each product's `removes` list, and that
   * list does not cover everything the scoring engine can flag. Nitrite, ammonia,
   * phosphate, bromate, antimony, selenium, boron and aluminium sit in LIMITS and in
   * no product at all, so every candidate scored zero and the whole list fell through
   * to the top-up in source order — which starts with a £25 jug whose own cons read
   * "Does not remove PFAS, fluoride, or nitrates".
   *
   * SW1A flagged nitrite and got exactly that, with "What it won't do: does not
   * remove nitrates" printed under the words "Our pick".
   */
  it("does not answer a flagged contaminant with a jug that says it cannot help", () => {
    const recs = recommendFilters(["Nitrite"], 3);
    const hero = recs[0];

    expect(hero.id).not.toBe("brita-maxtra-pro");
    expect(hero.cons.join(" ").toLowerCase()).not.toContain("does not remove");
  });

  it("leads with reverse osmosis when nothing in the catalogue claims the contaminant", () => {
    // RO rejects dissolved contaminants broadly rather than by name, which is why the
    // site's own PFAS guidance points there. The card still says "no direct match".
    for (const contaminant of ["Nitrite", "Ammonia", "Aluminium"]) {
      const hero = recommendFilters([contaminant], 3)[0];
      expect(hero.category, `hero for ${contaminant}`).toBe("reverse_osmosis");
      expect(hero.matchedCount).toBe(0);
    }
  });

  it("leaves the ordering alone when a product genuinely matches", () => {
    // Lead is covered, so the real match must still win over the broad-spectrum answer.
    const hero = recommendFilters(["Lead"], 3)[0];
    expect(hero.matchedCount).toBeGreaterThan(0);
    expect(hero.matchedContaminants).toContain("Lead");
  });

  it("still shows affordable jugs when nothing is flagged", () => {
    const recs = recommendFilters([], 3, { hardnessValue: 40 });
    expect(recs.every((r) => r.matchedCount === 0)).toBe(true);
    expect(recs[0].priceGbp).toBeLessThan(100);
  });

  it("recommends something that removes chlorine when chlorine residual is flagged", () => {
    const recs = recommendFilters(["Chlorine residual"], 3);

    expect(recs.length).toBeGreaterThan(0);
    expect(
      recs.every((r) => productAddresses(r, "Chlorine residual")),
    ).toBe(true);
    // The match is attributed back to the reading that caused it.
    expect(recs[0].matchedContaminants).toContain("Chlorine residual");
  });

  it("puts an RO system first when PFAS is flagged", () => {
    const recs = recommendFilters(["PFAS (total)"], 3);
    expect(recs[0].category).toBe("reverse_osmosis");
  });

  it("does not recommend a jug as top pick for clean but hard water", () => {
    const soft = recommendFilters([], 3, { hardnessValue: 40 });
    const hard = recommendFilters([], 3, { hardnessValue: 320 });

    // With soft water and nothing flagged, the general picks are fine.
    expect(soft.length).toBeGreaterThan(0);

    // With hard water the top pick must actually address scale, which a jug does not.
    expect(hard.length).toBeGreaterThan(0);
    expect(productAddresses(hard[0], "hardness (caco3)")).toBe(true);
    expect(hard[0].category).not.toBe("jug");
  });

  it("only treats water at or above the site's hard threshold as hard", () => {
    const below = recommendFilters([], 3, { hardnessValue: HARD_WATER_THRESHOLD - 1 });
    const at = recommendFilters([], 3, { hardnessValue: HARD_WATER_THRESHOLD });

    expect(below.every((r) => r.matchedCount === 0)).toBe(true);
    expect(at.some((r) => r.matchedCount > 0)).toBe(true);
  });

  it("still works when hardness is unknown", () => {
    expect(recommendFilters([], 3).length).toBeGreaterThan(0);
    expect(recommendFilters([], 3, { hardnessValue: null }).length).toBeGreaterThan(0);
  });

  it("ladders the clean-water picks across types instead of three identical jugs", () => {
    const recs = recommendFilters([], 3, { hardnessValue: 40 });

    // Display order is deliberate: proven seller, own-programme step-up, budget anchor.
    expect(recs.map((r) => r.id)).toEqual([
      "zerowater-12cup",
      "waterdrop-10ua",
      "brita-maxtra-pro",
    ]);
    // The old failure mode was a wall of one product type.
    expect(new Set(recs.map((r) => r.category)).size).toBeGreaterThan(1);
  });

  it("never recommends showers, testing kits or softeners as drinking water filters", () => {
    const recs = recommendFilters(["Lead", "Nitrate", "Chlorine residual"], 5);
    for (const r of recs) {
      expect(["testing_kit", "shower", "water_softener"]).not.toContain(r.category);
    }
  });
});
