import type { FilterProduct, ProductCategory } from "./types";

export const FILTERS: FilterProduct[] = [
  // JUGS — entry level, most popular
  {
    id: "brita-maxtra-pro",
    brand: "BRITA",
    model: "Marella XL + MAXTRA PRO",
    slug: "brita-marella-xl-maxtra-pro",
    category: "jug",
    removes: ["Chlorine", "Lead", "Copper", "Mercury", "Cadmium"],
    certifications: ["TUV SUD"],
    priceGbp: 25,
    priceTier: "budget",
    affiliateUrl: "https://www.amazon.co.uk/dp/B0BT1HTR9Q?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/brita-marella.png",
    rating: 4.5,
    badge: "budget",
    pros: ["Affordable", "No installation", "Widely available"],
    cons: ["Limited contaminant removal", "Frequent filter changes"],
    bestFor: "Basic chlorine and taste improvement on a budget",
  },
  {
    id: "zerowater-12cup",
    brand: "ZeroWater",
    model: "12-Cup Ready-Pour",
    slug: "zerowater-12-cup-ready-pour",
    category: "jug",
    removes: [
      "Lead",
      "Chromium",
      "Mercury",
      "PFAS (total)",
      "Fluoride",
      "Nitrate",
      "Arsenic",
      "Cadmium",
    ],
    certifications: ["NSF/ANSI 53", "NSF/ANSI 401"],
    priceGbp: 40,
    priceTier: "mid",
    affiliateUrl: "https://www.amazon.co.uk/dp/B07J2HJMKQ?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/zerowater-12cup.jpg",
    rating: 4.3,
    badge: "best-match",
    pros: ["Removes PFAS", "NSF certified", "TDS meter included"],
    cons: ["Filters need frequent replacement", "Slower filtering"],
    bestFor: "Households concerned about PFAS and heavy metals",
  },
  {
    id: "aqua-optima-evolve",
    brand: "Aqua Optima",
    model: "Liscia + Evolve+",
    slug: "aqua-optima-liscia-evolve-plus",
    category: "jug",
    removes: ["Chlorine", "Lead", "Copper", "Mercury"],
    certifications: ["TUV SUD"],
    priceGbp: 20,
    priceTier: "budget",
    affiliateUrl: "https://www.amazon.co.uk/dp/B09ZL1LN6V?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/aqua-optima.png",
    rating: 4.4,
    badge: "budget",
    pros: ["Cheapest option", "Compatible with Brita", "Slim design"],
    cons: ["Fewer contaminants removed", "Smaller capacity"],
    bestFor: "Budget-conscious buyers wanting basic filtration",
  },
  // REVERSE OSMOSIS — best performance
  {
    id: "waterdrop-g3p800",
    brand: "Waterdrop",
    model: "G3P600 Reverse Osmosis",
    slug: "waterdrop-g3p600-reverse-osmosis",
    category: "reverse_osmosis",
    removes: [
      "Lead",
      "PFAS (total)",
      "Fluoride",
      "Arsenic",
      "Nitrate",
      "Chlorine",
      "Trihalomethanes",
      "Mercury",
      "Cadmium",
      "Chromium",
      "Copper",
      "Nickel",
    ],
    certifications: ["NSF/ANSI 58", "NSF/ANSI 372"],
    priceGbp: 399,
    priceTier: "premium",
    affiliateUrl: "https://www.amazon.co.uk/dp/B0BKP8LNR3?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/waterdrop-g3p600.png",
    rating: 4.6,
    badge: "best-match",
    pros: ["Removes 12+ contaminants", "Tankless design", "Smart monitoring"],
    cons: ["Requires installation", "Higher upfront cost"],
    bestFor: "Maximum contaminant removal including PFAS and fluoride",
  },
  {
    id: "frizzlife-pd600",
    brand: "Frizzlife",
    model: "PD600 Under Sink RO",
    slug: "frizzlife-pd600-under-sink-ro",
    category: "reverse_osmosis",
    removes: [
      "Lead",
      "PFAS (total)",
      "Fluoride",
      "Arsenic",
      "Nitrate",
      "Chlorine",
      "Trihalomethanes",
      "Mercury",
      "Cadmium",
      "Chromium",
    ],
    certifications: ["NSF/ANSI 58"],
    priceGbp: 329,
    priceTier: "premium",
    affiliateUrl: "https://www.amazon.co.uk/dp/B083DFW1QS?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/frizzlife-pd600.png",
    rating: 4.5,
    badge: "best-value",
    pros: ["Lower cost than Waterdrop RO", "Compact design", "Easy filter swap"],
    cons: ["Requires installation", "Fewer certifications"],
    bestFor: "Best value reverse osmosis for UK kitchens",
  },
  // TAP-MOUNTED — clips onto your kitchen tap
  {
    id: "waterdrop-fc06",
    brand: "Waterdrop",
    model: "WD-FC-06 Tap Filter",
    slug: "waterdrop-wd-fc-06-tap-filter",
    category: "countertop",
    removes: ["Chlorine", "Lead", "Fluoride"],
    certifications: ["NSF/ANSI 42"],
    priceGbp: 0,
    priceTier: "budget",
    affiliateUrl: "https://www.amazon.co.uk/dp/B08JPCYHYQ?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/waterdrop-fc06.png",
    rating: 4.3,
    badge: "budget",
    pros: ["No installation", "Clips onto tap", "Affordable"],
    cons: ["Limited contaminant removal", "Not all taps compatible"],
    bestFor: "Quick chlorine and lead reduction without plumbing",
  },
  // UNDER-SINK — high capacity point-of-use
  {
    id: "waterdrop-10ua",
    brand: "Waterdrop",
    model: "10UA Under Sink (11,000 gal)",
    slug: "waterdrop-10ua-under-sink",
    category: "under_sink",
    removes: [
      "Chlorine",
      "Lead",
      "PFAS (total)",
    ],
    certifications: ["NSF/ANSI 42"],
    priceGbp: 0,
    priceTier: "mid",
    affiliateUrl: "https://www.amazon.co.uk/dp/B083NPW1DN?tag=tapwater21-21",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater21-21",
    imageUrl: "/filters/waterdrop-10ua.png",
    rating: 4.4,
    badge: "budget",
    pros: ["High capacity", "Simple installation", "Long filter life"],
    cons: ["Fewer contaminants than RO", "Needs dedicated tap"],
    bestFor: "High-volume under-sink filtration without RO complexity",
  },
];

/**
 * Recommend filters based on flagged contaminants.
 * Returns filters sorted by: most contaminants matched, then by rating.
 */
export function recommendFilters(
  flaggedContaminants: string[],
  maxResults: number = 3,
): (FilterProduct & { matchedCount: number; matchedContaminants: string[] })[] {
  if (flaggedContaminants.length === 0) {
    // No contaminants flagged — recommend general-purpose filters
    return FILTERS.filter(
      (f) => f.badge === "best-match" || f.badge === "budget",
    )
      .slice(0, maxResults)
      .map((f) => ({ ...f, matchedCount: 0, matchedContaminants: [] }));
  }

  const results = FILTERS.map((f) => {
    const matched = flaggedContaminants.filter((c) =>
      f.removes.some((r) => r.toLowerCase() === c.toLowerCase()),
    );
    return { ...f, matchedCount: matched.length, matchedContaminants: matched };
  })
    .filter((f) => f.matchedCount > 0)
    .sort((a, b) => {
      // Primary: more matches first
      if (b.matchedCount !== a.matchedCount)
        return b.matchedCount - a.matchedCount;
      // Secondary: higher rating
      return b.rating - a.rating;
    });

  // Ensure variety: try to include different categories
  const seen = new Set<string>();
  const diverse: typeof results = [];
  for (const f of results) {
    if (diverse.length >= maxResults) break;
    if (!seen.has(f.category)) {
      diverse.push(f);
      seen.add(f.category);
    }
  }
  // Fill remaining slots with best remaining matches
  for (const f of results) {
    if (diverse.length >= maxResults) break;
    if (!diverse.includes(f)) diverse.push(f);
  }

  return diverse;
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  jug: "Jug Filter",
  under_sink: "Under-Sink Filter",
  reverse_osmosis: "Reverse Osmosis",
  whole_house: "Whole House",
  countertop: "Countertop",
  shower: "Shower Filter",
  testing_kit: "Testing Kit",
};
