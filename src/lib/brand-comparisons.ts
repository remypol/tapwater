/**
 * Brand comparison config — powers /compare/filter/[brand1]/vs/[brand2] pages.
 * 4 matchups, each with product IDs, editorial content, comparison points, and FAQs.
 */

export interface ComparisonPoint {
  category: string;
  brand1: string;
  brand2: string;
  winner: 1 | 2 | null;
}

export interface BrandComparison {
  brand1Slug: string;
  brand2Slug: string;
  brand1Label: string;
  brand2Label: string;
  brand1ProductId: string;
  brand2ProductId: string;
  category: string;
  keyDifference: string;
  verdict: string;
  brand1BestFor: string;
  brand2BestFor: string;
  comparisonPoints: ComparisonPoint[];
  faqs: { question: string; answer: string }[];
}

export const BRAND_COMPARISONS: BrandComparison[] = [
  // ── 1. BRITA vs ZeroWater ──────────────────────────────────────────────
  {
    brand1Slug: "brita",
    brand2Slug: "zerowater",
    brand1Label: "BRITA",
    brand2Label: "ZeroWater",
    brand1ProductId: "brita-maxtra-pro",
    brand2ProductId: "zerowater-12cup",
    category: "Water Filter Jug",
    keyDifference:
      "ZeroWater uses 5-stage filtration certified to NSF 53 and 401 — it removes PFAS, fluoride, and arsenic that BRITA's basic carbon filter simply cannot touch. The trade-off is cost: ZeroWater filters run out faster and cost more to replace.",
    verdict:
      "If you want genuine contaminant removal — particularly PFAS, heavy metals, or nitrate — ZeroWater is the clear winner. BRITA is the better choice for households who just want improved taste at the lowest possible running cost. In hard water areas, ZeroWater filters can last as little as two weeks, pushing annual costs well above £100, so factor that in.",
    brand1BestFor: "Everyday taste improvement at low running cost",
    brand2BestFor: "Households concerned about PFAS, heavy metals, or fluoride",
    comparisonPoints: [
      {
        category: "Filtration depth",
        brand1: "Basic activated carbon — removes chlorine, lead, copper, mercury",
        brand2: "5-stage ion exchange — removes PFAS, fluoride, arsenic, nitrate, heavy metals",
        winner: 2,
      },
      {
        category: "Running cost",
        brand1: "~£52/year — MAXTRA PRO filters widely available, competitively priced",
        brand2: "~£120/year — replacement filters cost more and deplete faster",
        winner: 1,
      },
      {
        category: "Taste improvement",
        brand1: "Good — effective chlorine removal improves taste noticeably",
        brand2: "Excellent — removes virtually all dissolved solids for flat, pure taste",
        winner: 2,
      },
      {
        category: "Convenience",
        brand1: "Fast pour rate, 4-week filter life, filter-change indicator",
        brand2: "Slower pour (5+ min to fill), 2–4 week filter life, TDS meter included",
        winner: 1,
      },
      {
        category: "Certifications",
        brand1: "TUV SUD tested — not NSF certified",
        brand2: "NSF/ANSI 53 and 401 certified — independently verified removal claims",
        winner: 2,
      },
    ],
    faqs: [
      {
        question: "Does BRITA remove PFAS?",
        answer:
          "No. BRITA MAXTRA PRO filters use activated carbon, which is not fine enough to reliably remove PFAS (forever chemicals). If your postcode has flagged PFAS contamination, you need ZeroWater or an under-sink reverse osmosis system instead.",
      },
      {
        question: "Is ZeroWater worth the higher running cost?",
        answer:
          "It depends on what you want to remove. ZeroWater is NSF/ANSI 401 certified to remove PFAS and NSF/ANSI 53 certified for heavy metals — claims BRITA cannot make. If you are in a high-PFAS or high-lead area, the extra cost is worth it. If you just want better-tasting water, BRITA delivers that at roughly half the annual running cost.",
      },
      {
        question: "How do I know when a ZeroWater filter needs replacing?",
        answer:
          "ZeroWater includes a TDS (total dissolved solids) meter in the box. When your filtered water reads 006 ppm on the meter — matching your unfiltered tap water — the filter is spent. In soft water areas this might last 4 weeks; in hard water areas it can be as little as 2 weeks.",
      },
      {
        question: "Which jug is better for hard water areas?",
        answer:
          "BRITA is more practical in hard water areas. Because ZeroWater's 5-stage filter captures all dissolved minerals, it depletes very quickly in hard water — sometimes in under two weeks. BRITA's filter life is less affected by hardness, making it more economical if you live in London, the South East, or the Midlands.",
      },
    ],
  },

  // ── 2. BRITA vs Waterdrop ──────────────────────────────────────────────
  {
    brand1Slug: "brita",
    brand2Slug: "waterdrop",
    brand1Label: "BRITA",
    brand2Label: "Waterdrop",
    brand1ProductId: "brita-maxtra-pro",
    brand2ProductId: "waterdrop-fc06",
    category: "Water Filter",
    keyDifference:
      "Waterdrop's tap filter clips directly onto your kitchen tap and filters water on demand — no jug to fill, no waiting. BRITA is a traditional pour-through jug that needs refilling. Different form factors for different habits.",
    verdict:
      "Waterdrop suits renters and households who want filtered water straight from the tap without permanent plumbing changes. BRITA suits those who prefer a portable jug they can carry to the table or fridge. On contaminant removal, Waterdrop's NSF 42 certification covers chlorine and basic filtration; BRITA is comparable. For budget-conscious buyers, BRITA's lower upfront cost and widely available replacement filters make it the pragmatic pick.",
    brand1BestFor: "Portable, fridge-friendly filtration at the lowest entry price",
    brand2BestFor: "On-demand filtered water straight from the tap without plumbing",
    comparisonPoints: [
      {
        category: "Form factor",
        brand1: "Pour-through jug — fill, wait, pour into glass or pot",
        brand2: "Tap-mounted — filtered water on demand, switch between filtered and unfiltered",
        winner: null,
      },
      {
        category: "Upfront cost",
        brand1: "£25 — affordable entry point, widely stocked",
        brand2: "£30 — slightly higher but no jug to store",
        winner: 1,
      },
      {
        category: "Running cost",
        brand1: "~£52/year — MAXTRA PRO cartridges available everywhere",
        brand2: "~£48/year — 3-month filter life keeps annual cost low",
        winner: 2,
      },
      {
        category: "Contaminant removal",
        brand1: "Chlorine, lead, copper, mercury, cadmium",
        brand2: "Chlorine, lead, fluoride — NSF/ANSI 42 certified",
        winner: null,
      },
      {
        category: "Compatibility",
        brand1: "Works anywhere — no tap attachment needed",
        brand2: "Not compatible with pull-out, spray, or non-standard taps",
        winner: 1,
      },
    ],
    faqs: [
      {
        question: "Can the Waterdrop FC-06 replace a BRITA jug?",
        answer:
          "For most purposes, yes. The Waterdrop FC-06 clips onto a standard UK tap and filters water on demand, so you never need to pre-fill a jug. It covers the same basic chlorine and lead reduction as BRITA. The limitation is tap compatibility — if you have a pull-out or spray tap, it will not fit.",
      },
      {
        question: "Does Waterdrop work on UK taps?",
        answer:
          "The Waterdrop FC-06 comes with adapters for most standard UK taps. It does not work on pull-out taps, spray taps, or non-standard fittings. Check the tap thread before buying — Waterdrop sells a universal adapter separately for less common fittings.",
      },
      {
        question: "Which is easier to use — BRITA or Waterdrop tap filter?",
        answer:
          "It depends on your habits. BRITA is simple — fill it, put it in the fridge, pour from it. Waterdrop is more convenient for cooking since filtered water comes straight from the tap at full pressure. If you frequently fill pots or kettles, Waterdrop wins on convenience. If you mostly want a cold glass of water from the fridge, BRITA is just as easy.",
      },
    ],
  },

  // ── 3. ZeroWater vs Waterdrop ─────────────────────────────────────────
  {
    brand1Slug: "zerowater",
    brand2Slug: "waterdrop",
    brand1Label: "ZeroWater",
    brand2Label: "Waterdrop",
    brand1ProductId: "zerowater-12cup",
    brand2ProductId: "waterdrop-fc06",
    category: "Water Filter",
    keyDifference:
      "ZeroWater goes further than almost any jug or tap filter on the market — its 5-stage system strips water to near-zero dissolved solids. Waterdrop takes a more balanced approach, targeting chlorine and lead without stripping minerals that contribute to taste.",
    verdict:
      "If maximum contaminant removal is your priority — particularly PFAS, fluoride, nitrate, or arsenic — ZeroWater is the more capable filter and the only jug certified to NSF/ANSI 401. Waterdrop is the better option if you want filtered water at the tap without fussing over a jug, and do not need that level of contaminant removal. ZeroWater's higher running cost is the key downside, especially in hard water areas.",
    brand1BestFor: "Maximum contaminant removal including PFAS and fluoride",
    brand2BestFor: "Convenient tap-mounted filtration for chlorine and basic contaminants",
    comparisonPoints: [
      {
        category: "Filtration technology",
        brand1: "5-stage ion exchange — removes virtually all dissolved solids",
        brand2: "Single-stage carbon block — targets chlorine and lead",
        winner: 1,
      },
      {
        category: "Certifications",
        brand1: "NSF/ANSI 53 (heavy metals) + NSF/ANSI 401 (PFAS, pharmaceuticals)",
        brand2: "NSF/ANSI 42 (chlorine and taste only)",
        winner: 1,
      },
      {
        category: "Running cost",
        brand1: "~£120/year — filters exhaust quickly in hard water areas",
        brand2: "~£48/year — 3-month cartridges are cost-effective",
        winner: 2,
      },
      {
        category: "Convenience",
        brand1: "Jug format — 12-cup capacity, slow pour, needs pre-filling",
        brand2: "Tap-mounted — instant filtered water on demand at full flow",
        winner: 2,
      },
      {
        category: "TDS monitoring",
        brand1: "Includes TDS meter — know exactly when to replace the filter",
        brand2: "No TDS monitoring — replace on schedule (3 months)",
        winner: 1,
      },
    ],
    faqs: [
      {
        question: "Does ZeroWater remove fluoride?",
        answer:
          "Yes. ZeroWater's 5-stage ion exchange filtration removes fluoride along with most other dissolved minerals. This makes it one of the only jug filters that can genuinely claim fluoride removal. If fluoride is a specific concern, ZeroWater is the right choice at this price point — the alternative is an under-sink reverse osmosis system.",
      },
      {
        question: "Is ZeroWater or Waterdrop better for tap water taste?",
        answer:
          "It depends on what you find pleasant. ZeroWater removes virtually all dissolved solids, producing very flat, pure-tasting water — some people love it, others find it almost too neutral. Waterdrop removes chlorine but leaves minerals in, giving a crisper taste that is closer to good bottled water. Taste is subjective, but most people find the Waterdrop result more palatable as an everyday drink.",
      },
      {
        question: "How often does a ZeroWater filter need replacing?",
        answer:
          "ZeroWater recommends replacing filters when the TDS meter reads 006 ppm. In soft water areas (below 100 mg/L hardness), a filter can last 4–6 weeks. In hard water areas like London or the South East (above 200 mg/L), you might need to replace every 2 weeks. Budget accordingly — at £120+ per year, ZeroWater is one of the pricier jug options to run.",
      },
    ],
  },

  // ── 4. Waterdrop vs Frizzlife ─────────────────────────────────────────
  {
    brand1Slug: "waterdrop",
    brand2Slug: "frizzlife",
    brand1Label: "Waterdrop",
    brand2Label: "Frizzlife",
    brand1ProductId: "waterdrop-10ua",
    brand2ProductId: "frizzlife-pd600",
    category: "Under-Sink Filter",
    keyDifference:
      "Both are under-sink systems, but they sit in different categories: Waterdrop 10UA is a carbon-block filter that handles chlorine, lead, and PFAS at a fraction of the cost, while Frizzlife PD600 is a full reverse osmosis system that removes 12+ contaminants including fluoride, arsenic, and nitrate.",
    verdict:
      "Frizzlife PD600 is the better choice if you want the most thorough filtration possible — reverse osmosis removes virtually everything, and at £329 it undercuts the comparable Waterdrop G3P600 by £70. Waterdrop 10UA is the smarter buy if you want high-capacity under-sink filtration without the cost or complexity of RO: it filters 11,000 gallons per cartridge and costs just £30 per year to run. The decision comes down to whether you need fluoride and nitrate removal.",
    brand1BestFor: "High-capacity under-sink filtration at the lowest annual running cost",
    brand2BestFor: "Maximum contaminant removal including fluoride, arsenic, and nitrate",
    comparisonPoints: [
      {
        category: "Filtration type",
        brand1: "Carbon block — single-stage, removes chlorine, lead, PFAS",
        brand2: "Reverse osmosis — removes 12+ contaminants including fluoride and arsenic",
        winner: 2,
      },
      {
        category: "Upfront cost",
        brand1: "£45 — significantly lower barrier to entry",
        brand2: "£329 — premium system with professional installation advised",
        winner: 1,
      },
      {
        category: "Running cost",
        brand1: "~£30/year — 11,000-gallon filter life, annual replacement only",
        brand2: "~£70/year — multiple filter stages with staggered replacement cycles",
        winner: 1,
      },
      {
        category: "Flow rate",
        brand1: "3.8 L/min — strong flow for a carbon filter",
        brand2: "2.3 L/min — typical for RO; slower but expected given purification level",
        winner: 1,
      },
      {
        category: "Certifications",
        brand1: "NSF/ANSI 42 — chlorine reduction verified",
        brand2: "NSF/ANSI 58 — full RO performance independently certified",
        winner: 2,
      },
    ],
    faqs: [
      {
        question: "Does the Waterdrop 10UA remove PFAS?",
        answer:
          "Waterdrop lists PFAS removal on the 10UA product page, though its single-stage carbon block design is not as comprehensively tested as ZeroWater or RO systems. If PFAS are your primary concern, a certified RO system like the Frizzlife PD600 (NSF/ANSI 58) gives more reliable removal down to sub-nanometre scale.",
      },
      {
        question: "Is reverse osmosis worth it under the sink?",
        answer:
          "If your postcode has flagged fluoride, nitrate, arsenic, or persistent PFAS, reverse osmosis is the most thorough solution available for home use. The Frizzlife PD600 at £329 is competitively priced for an RO system, and its NSF 58 certification means the performance claims are independently verified. The trade-offs are higher upfront cost, water waste during the RO process (roughly 3 parts waste for every 1 part filtered), and the need for a dedicated filtered tap.",
      },
      {
        question: "How hard is it to install the Waterdrop 10UA?",
        answer:
          "The Waterdrop 10UA is designed as a DIY install. It uses push-fit connectors and sits inside your existing cabinet, tapping into the cold water supply under the sink. Most people complete the installation in under an hour without plumbing experience. The Frizzlife PD600 (reverse osmosis) is more involved — you need to drill a hole for the dedicated filtered tap and connect to the waste pipe, so professional installation is recommended.",
      },
      {
        question: "Does the Frizzlife PD600 remove fluoride?",
        answer:
          "Yes. The Frizzlife PD600 uses a reverse osmosis membrane certified to NSF/ANSI 58, which removes fluoride alongside arsenic, nitrate, lead, PFAS, chromium, cadmium, mercury, and trihalomethanes. No jug or basic carbon filter can match this level of removal.",
      },
    ],
  },
];

/**
 * Look up a comparison by the two brand slugs (order-independent).
 */
export function getBrandComparison(
  slugA: string,
  slugB: string,
): BrandComparison | undefined {
  return BRAND_COMPARISONS.find(
    (c) =>
      (c.brand1Slug === slugA && c.brand2Slug === slugB) ||
      (c.brand1Slug === slugB && c.brand2Slug === slugA),
  );
}

/**
 * All unique brand slug pairs (alphabetically ordered) for static generation.
 */
export const BRAND_COMPARISON_PAIRS: [string, string][] = BRAND_COMPARISONS.map(
  (c) => [c.brand1Slug, c.brand2Slug],
);
