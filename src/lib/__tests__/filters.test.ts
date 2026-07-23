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

  it("never recommends showers, testing kits or softeners as drinking water filters", () => {
    const recs = recommendFilters(["Lead", "Nitrate", "Chlorine residual"], 5);
    for (const r of recs) {
      expect(["testing_kit", "shower", "water_softener"]).not.toContain(r.category);
    }
  });
});
