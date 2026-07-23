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
 * Readings and products name the same substance differently. Monitoring data uses
 * official names ("Chlorine residual", "Coliform bacteria", "Hardness (CaCO3)"),
 * products describe what they remove ("Chlorine", "Bacteria", "Limescale"). Comparing
 * those as exact strings silently drops real matches: a postcode flagged for
 * "Chlorine residual" would be shown no chlorine-capable filter at all.
 *
 * Keys are measured names (lowercased), values are product capabilities that genuinely
 * address them. Anything not listed falls back to matching on its own name.
 */
const CONTAMINANT_ALIASES: Record<string, string[]> = {
  "chlorine residual": ["chlorine", "chloramine"],
  "coliform bacteria": ["bacteria"],
  "e. coli": ["bacteria"],
  pfos: ["pfas (total)"],
  pfoa: ["pfas (total)"],
  nitrate: ["nitrate", "nitrates"],
  nitrates: ["nitrate", "nitrates"],
  turbidity: ["sediment", "particles"],
  "hardness (caco3)": ["limescale", "calcium", "magnesium"],
  trihalomethanes: ["trihalomethanes"],
};

/** Product capabilities that genuinely address a given measured contaminant. */
function capabilitiesFor(measured: string): string[] {
  const key = measured.trim().toLowerCase();
  return CONTAMINANT_ALIASES[key] ?? [key];
}

/** Does this product address the measured contaminant, allowing for naming differences? */
export function productAddresses(
  product: Pick<FilterProduct, "removes">,
  measured: string,
): boolean {
  const wanted = capabilitiesFor(measured);
  return product.removes.some((r) => wanted.includes(r.trim().toLowerCase()));
}

/** Hard water threshold in mg/L CaCO3, matching the site's "hard" classification. */
export const HARD_WATER_THRESHOLD = 180;

export interface RecommendationContext {
  /** Measured hardness in mg/L CaCO3 for this location, when known. */
  hardnessValue?: number | null;
}

/**
 * Recommend filters based on flagged contaminants.
 * PFAS boosts RO systems; hard water boosts products that actually treat scale;
 * shower, testing and softener products are excluded from primary recommendations.
 */
export function recommendFilters(
  flaggedContaminants: string[],
  maxResults: number = 3,
  context: RecommendationContext = {},
): (FilterProduct & { matchedCount: number; matchedContaminants: string[] })[] {
  const drinkingFilters = PRODUCTS.filter(
    (f) => f.category !== "testing_kit" && f.category !== "shower" && f.category !== "water_softener",
  );

  const hardWater =
    typeof context.hardnessValue === "number" &&
    context.hardnessValue >= HARD_WATER_THRESHOLD;

  // Nothing flagged and normal water: fall back to the general picks. Nothing flagged
  // but hard water is a different situation, so it drops through to the scoring below
  // rather than recommending a jug that does nothing about scale.
  if (flaggedContaminants.length === 0 && !hardWater) {
    return drinkingFilters
      .filter((f) => f.badge === "best-match" || f.badge === "budget")
      .slice(0, maxResults)
      .map((f) => ({ ...f, matchedCount: 0, matchedContaminants: [] }));
  }

  const hasPfas = flaggedContaminants.some((c) =>
    c.toLowerCase().includes("pfas"),
  );

  const results = drinkingFilters.map((f) => {
    const matched = flaggedContaminants.filter((c) => productAddresses(f, c));
    const pfasBoost = hasPfas && f.category === "reverse_osmosis" ? 100 : 0;
    // Hardness is a property of the supply rather than a flagged contaminant, so it
    // never appears in the loop above. At this level a jug does nothing about scale,
    // while a system that treats it genuinely is the better answer.
    const hardWaterBoost =
      hardWater && productAddresses(f, "hardness (caco3)") ? 50 : 0;
    return {
      ...f,
      matchedCount: matched.length + pfasBoost + hardWaterBoost,
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

  // Few products treat scale, so hard water alone can leave the list one or two short
  // and showing only £500 systems. Top it up with the general picks so there is still
  // an affordable option next to them.
  if (diverse.length < maxResults) {
    const chosen = new Set(diverse.map((f) => f.id));
    for (const f of drinkingFilters) {
      if (diverse.length >= maxResults) break;
      if (chosen.has(f.id)) continue;
      if (f.badge !== "best-match" && f.badge !== "budget") continue;
      diverse.push({ ...f, matchedCount: 0, matchedContaminants: [] });
      chosen.add(f.id);
    }
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
