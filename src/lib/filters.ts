import type { FilterProduct, ProductCategory } from "./types";
import { PRODUCTS } from "./products";

// Re-export for backwards compatibility
export const FILTERS = PRODUCTS;

export { CATEGORY_META, CATEGORY_ORDER, getProductsByCategory, getProductBySlug } from "./products";

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  jug: "Jug Filter",
  under_sink: "Under-Sink Filter",
  reverse_osmosis: "Reverse Osmosis",
  whole_house: "Whole House",
  countertop: "Countertop",
  shower: "Shower Filter",
  testing_kit: "Testing Kit",
  water_softener: "Water Softener",
};

/**
 * Recommend filters based on flagged contaminants.
 * Upgraded: PFAS boosts RO systems, excludes shower/testing from primary recs.
 */
export function recommendFilters(
  flaggedContaminants: string[],
  maxResults: number = 3,
): (FilterProduct & { matchedCount: number; matchedContaminants: string[] })[] {
  const drinkingFilters = PRODUCTS.filter(
    (f) => f.category !== "testing_kit" && f.category !== "shower" && f.category !== "water_softener",
  );

  if (flaggedContaminants.length === 0) {
    return drinkingFilters
      .filter((f) => f.badge === "best-match" || f.badge === "budget")
      .slice(0, maxResults)
      .map((f) => ({ ...f, matchedCount: 0, matchedContaminants: [] }));
  }

  const hasPfas = flaggedContaminants.some((c) =>
    c.toLowerCase().includes("pfas"),
  );

  const results = drinkingFilters.map((f) => {
    const matched = flaggedContaminants.filter((c) =>
      f.removes.some((r) => r.toLowerCase() === c.toLowerCase()),
    );
    const pfasBoost = hasPfas && f.category === "reverse_osmosis" ? 100 : 0;
    return {
      ...f,
      matchedCount: matched.length + pfasBoost,
      matchedContaminants: matched,
    };
  })
    .filter((f) => f.matchedCount > 0)
    .sort((a, b) => {
      if (b.matchedCount !== a.matchedCount) return b.matchedCount - a.matchedCount;
      return b.rating - a.rating;
    });

  const seen = new Set<string>();
  const diverse: typeof results = [];
  for (const f of results) {
    if (diverse.length >= maxResults) break;
    if (!seen.has(f.category)) {
      diverse.push(f);
      seen.add(f.category);
    }
  }
  for (const f of results) {
    if (diverse.length >= maxResults) break;
    if (!diverse.includes(f)) diverse.push(f);
  }

  return diverse;
}

/**
 * Recommend supplementary products — shower filters and testing kits.
 */
export function recommendSupplementary(
  flaggedContaminants: string[],
  pfasDetected: boolean,
): { showerFilters: FilterProduct[]; testingKits: FilterProduct[] } {
  const showerFilters = PRODUCTS.filter((p) => p.category === "shower")
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 2);

  const hasLead = flaggedContaminants.some((c) =>
    c.toLowerCase().includes("lead"),
  );

  const testingKits = PRODUCTS.filter((p) => p.category === "testing_kit")
    .sort((a, b) => {
      if (pfasDetected || hasLead) {
        if (a.priceTier === "premium" && b.priceTier !== "premium") return -1;
        if (b.priceTier === "premium" && a.priceTier !== "premium") return 1;
      }
      return b.rating - a.rating;
    })
    .slice(0, 2);

  return { showerFilters, testingKits };
}
