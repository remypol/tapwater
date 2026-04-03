import type { FilterProduct } from "./types";

export const FILTERS: FilterProduct[] = [
  // JUGS — entry level, most popular
  {
    id: "brita-maxtra-pro",
    brand: "BRITA",
    model: "Marella XL + MAXTRA PRO",
    category: "jug",
    removes: ["Chlorine", "Lead", "Copper", "Mercury", "Cadmium"],
    certifications: ["TUV SUD"],
    priceGbp: 25,
    affiliateUrl: "https://www.amazon.co.uk/dp/B0BT1HTR9Q?tag=tapwater21-21",
    imageUrl: "/filters/brita-marella.jpg",
    rating: 4.5,
    badge: "budget",
  },
  {
    id: "zerowater-12cup",
    brand: "ZeroWater",
    model: "12-Cup Ready-Pour",
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
    affiliateUrl: "https://www.amazon.co.uk/dp/B07J2HJMKQ?tag=tapwater21-21",
    imageUrl: "/filters/zerowater-12cup.jpg",
    rating: 4.3,
    badge: "best-match",
  },
  {
    id: "aqua-optima-evolve",
    brand: "Aqua Optima",
    model: "Liscia + Evolve+",
    category: "jug",
    removes: ["Chlorine", "Lead", "Copper", "Mercury"],
    certifications: ["TUV SUD"],
    priceGbp: 20,
    affiliateUrl: "https://www.amazon.co.uk/dp/B09ZL1LN6V?tag=tapwater21-21",
    imageUrl: "/filters/aqua-optima.jpg",
    rating: 4.4,
    badge: "budget",
  },
  // UNDER-SINK — best performance
  {
    id: "waterdrop-g3p800",
    brand: "Waterdrop",
    model: "G3P800 Reverse Osmosis",
    category: "under_sink",
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
    affiliateUrl: "https://www.amazon.co.uk/dp/B0BKP8LNR3?tag=tapwater21-21",
    imageUrl: "/filters/waterdrop-g3p800.jpg",
    rating: 4.6,
    badge: "best-match",
  },
  {
    id: "frizzlife-pd600",
    brand: "Frizzlife",
    model: "PD600 Under Sink RO",
    category: "under_sink",
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
    affiliateUrl: "https://www.amazon.co.uk/dp/B083DFW1QS?tag=tapwater21-21",
    imageUrl: "/filters/frizzlife-pd600.jpg",
    rating: 4.5,
    badge: "best-match",
  },
  // COUNTERTOP — no installation
  {
    id: "waterdrop-fc06",
    brand: "Waterdrop",
    model: "FC-06 Countertop Stainless Steel",
    category: "countertop",
    removes: ["Chlorine", "Lead", "Fluoride", "Mercury", "Copper"],
    certifications: ["NSF/ANSI 42", "NSF/ANSI 372"],
    priceGbp: 36,
    affiliateUrl: "https://www.amazon.co.uk/dp/B08JPCYHYQ?tag=tapwater21-21",
    imageUrl: "/filters/waterdrop-fc06.jpg",
    rating: 4.3,
    badge: "budget",
  },
  // WHOLE HOUSE / GRAVITY
  {
    id: "waterdrop-gravity",
    brand: "Waterdrop",
    model: "King Tank Gravity Filter",
    category: "whole_house",
    removes: [
      "Chlorine",
      "Lead",
      "Fluoride",
      "Mercury",
      "PFAS (total)",
    ],
    certifications: ["NSF/ANSI 42", "NSF/ANSI 53"],
    priceGbp: 90,
    affiliateUrl: "https://www.amazon.co.uk/dp/B083NPW1DN?tag=tapwater21-21",
    imageUrl: "/filters/waterdrop-gravity.jpg",
    rating: 4.4,
    badge: "whole-house",
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

export const CATEGORY_LABELS: Record<FilterProduct["category"], string> = {
  jug: "Jug Filter",
  under_sink: "Under-Sink",
  countertop: "Countertop",
  whole_house: "Whole House",
};
