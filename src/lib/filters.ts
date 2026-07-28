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

/**
 * What a visitor with clean, normal water sees, in display order: the jug with
 * actual recorded orders, the under-sink step-up on the site's own 7% programme,
 * and the budget anchor. Curated on purpose; see the comment at the use site.
 */
const DEFAULT_PICK_IDS = ["zerowater-12cup", "waterdrop-10ua", "brita-maxtra-pro"];

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
  //
  // Curated rather than "first three badge products in source order", because source
  // order resolved to three near-identical £25-35 jugs on every clean-water page.
  // A ladder across price points and categories serves the same visitor better and
  // stops routing every click to the lowest-commission products by accident.
  if (flaggedContaminants.length === 0 && !hardWater) {
    const picks: FilterProduct[] = [];
    for (const id of DEFAULT_PICK_IDS) {
      const pick = drinkingFilters.find((f) => f.id === id);
      if (pick) picks.push(pick);
    }
    // If a curated id ever disappears from the catalogue, refill from the badge
    // products so the section never comes up short.
    for (const f of drinkingFilters) {
      if (picks.length >= maxResults) break;
      if (f.badge !== "best-match" && f.badge !== "budget") continue;
      if (picks.some((p) => p.id === f.id)) continue;
      picks.push(f);
    }
    return picks
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

  // Top up any remaining slots from the general picks.
  //
  // Note for hard water specifically: this does not fire. Only three products list
  // Limescale and they are the three Osmio systems, so the loops above already
  // return three and a hard-water report shows £495-£650 and nothing else. An
  // earlier comment here claimed this top-up prevented that; it never did.
  // Padding the list with a £25 jug would be worse rather than better — carbon
  // does nothing about scale — so the real answer is the water_softener category,
  // which is currently empty and excluded at the top of this function.
  if (diverse.length < maxResults) {
    const chosen = new Set(diverse.map((f) => f.id));
    for (const f of topUpOrder(flaggedContaminants, results.length, drinkingFilters)) {
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
 * Which products fill the remaining slots, and in what order.
 *
 * Normally source order is fine — it puts an affordable option next to an expensive
 * one. But scoring only counts name matches against each product's `removes` list,
 * and that list does not cover everything the scoring engine can flag. Nitrite,
 * ammonia, phosphate, bromate, antimony, selenium, boron and aluminium appear in
 * LIMITS and in no product at all, so every candidate scores zero and the whole
 * list comes from here, in source order — which begins with a £25 jug whose own
 * cons read "Does not remove PFAS, fluoride, or nitrates".
 *
 * SW1A flagged nitrite and was shown exactly that, with "What it won't do: does not
 * remove nitrates" printed underneath "Our pick". The visitor with a real problem
 * got the cheapest thing on the shelf and a note saying it would not help.
 *
 * So when something was flagged and nothing in the catalogue claims it, lead with
 * reverse osmosis. RO is a membrane process that rejects dissolved contaminants
 * broadly rather than by name, which is why the site's own PFAS guidance points
 * there. The card still says "no direct match" — that stays honest — but the
 * product behind it is one that plausibly helps.
 */
function topUpOrder(
  flaggedContaminants: string[],
  matchedProductCount: number,
  candidates: FilterProduct[],
): FilterProduct[] {
  const nothingClaimedIt = flaggedContaminants.length > 0 && matchedProductCount === 0;
  if (!nothingClaimedIt) return candidates;

  const breadth: Record<string, number> = {
    reverse_osmosis: 0,
    under_sink: 1,
    whole_house: 2,
    countertop: 3,
  };
  return [...candidates].sort(
    (a, b) => (breadth[a.category] ?? 9) - (breadth[b.category] ?? 9),
  );
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
