import type { FilterProduct, ProductCategory } from "./types";

/**
 * Canonical product catalogue — single source of truth for all filter products.
 * 22 products across 7 categories (water_softener is defined but empty: Osmio pays
 * no bounty on softeners, so that segment waits on a lead partner).
 *
 * Every entry must carry our own affiliate tracking. `every product carries our
 * affiliate tracking` in products.test.ts enforces it: an untracked link renders
 * and clicks through exactly like a tracked one, so nothing on the page or in the
 * click log reveals the loss. Three products sat here untracked for weeks that way.
 */
export const PRODUCTS: FilterProduct[] = [
  // ─── JUGS ───────────────────────────────────────────────────────────
  {
    id: "brita-maxtra-pro",
    brand: "BRITA",
    model: "Marella XL + MAXTRA PRO",
    slug: "brita-marella-xl",
    category: "jug",
    removes: ["Chlorine", "Lead", "Copper", "Mercury", "Cadmium"],
    certifications: ["TUV SUD"],
    priceGbp: 25,
    priceTier: "budget",
    affiliateUrl: "https://www.amazon.co.uk/dp/B0BT1HTR9Q?tag=tapwater2107-21",
    affiliateProgram: "amazon",
    commission: { type: "percent", rate: 0.03 },
    affiliateTag: "tapwater2107-21",
    imageUrl: "/filters/brita-marella.png",
    rating: 4.5,
    badge: "budget",
    pros: [
      "Affordable running costs with widely available filters",
      "No installation — ready to use out of the box",
      "3.5L capacity suits families of up to four",
    ],
    cons: [
      "Does not remove PFAS, fluoride, or nitrates",
      "MAXTRA PRO filters need replacing every 4 weeks",
      "Jug takes up fridge space",
    ],
    bestFor: "Basic chlorine and taste improvement on a budget",
    filterLife: "4 weeks per cartridge",
    annualCost: 52,
  },
  {
    id: "zerowater-12cup",
    brand: "ZeroWater",
    model: "12-Cup Ready-Pour",
    slug: "zerowater-12-cup",
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
    affiliateUrl: "https://www.amazon.co.uk/dp/B07J2HJMKQ?tag=tapwater2107-21",
    affiliateProgram: "amazon",
    commission: { type: "percent", rate: 0.03 },
    affiliateTag: "tapwater2107-21",
    imageUrl: "/filters/zerowater-12cup.jpg",
    rating: 4.3,
    badge: "best-match",
    pros: [
      "NSF-certified to remove PFAS and heavy metals",
      "Includes TDS meter so you can verify performance",
      "5-stage filtration in a simple jug format",
    ],
    cons: [
      "Filters last only 2–3 weeks in hard water areas",
      "Slower pour rate than BRITA — takes 5+ minutes to fill",
      "Replacement filters cost more than competitors",
    ],
    bestFor: "Households concerned about PFAS and heavy metals",
    filterLife: "2–4 weeks depending on TDS",
    annualCost: 120,
  },
  {
    id: "aqua-optima-evolve",
    brand: "Aqua Optima",
    model: "Liscia + Evolve+",
    slug: "aqua-optima-liscia",
    category: "jug",
    removes: ["Chlorine", "Lead", "Copper", "Mercury"],
    certifications: ["TUV SUD"],
    priceGbp: 20,
    priceTier: "budget",
    affiliateUrl: "https://www.amazon.co.uk/dp/B09ZL1LN6V?tag=tapwater2107-21",
    affiliateProgram: "amazon",
    commission: { type: "percent", rate: 0.03 },
    affiliateTag: "tapwater2107-21",
    imageUrl: "/filters/aqua-optima.png",
    rating: 4.4,
    badge: "budget",
    pros: [
      "Cheapest jug option with BRITA-compatible filters",
      "Slim fridge-door design saves space",
      "Evolve+ filters last 30 days",
    ],
    cons: [
      "Fewer contaminants removed than ZeroWater",
      "2.4L filtered capacity — small for families",
      "Lid can leak if not seated properly",
    ],
    bestFor: "Budget-conscious buyers wanting basic filtration",
    filterLife: "30 days per cartridge",
    annualCost: 36,
  },
  {
    id: "pur-plus-pitcher",
    brand: "PUR",
    model: "Plus 11-Cup Pitcher",
    slug: "pur-plus-pitcher",
    category: "jug",
    removes: ["Chlorine", "Lead", "Mercury", "Cadmium", "Copper"],
    certifications: ["NSF/ANSI 42", "NSF/ANSI 53"],
    priceGbp: 35,
    priceTier: "mid",
    affiliateUrl: "https://www.amazon.co.uk/dp/B09LKTLVNR?tag=tapwater2107-21",
    affiliateProgram: "amazon",
    commission: { type: "percent", rate: 0.03 },
    affiliateTag: "tapwater2107-21",
    imageUrl: "/filters/pur-plus-pitcher.jpg",
    rating: 4.2,
    badge: "best-value",
    pros: [
      "NSF 53 certified for lead removal",
      "Large 11-cup capacity suits bigger households",
      "Filter-change indicator light on lid",
    ],
    cons: [
      "Does not remove PFAS or fluoride",
      "Harder to find replacement filters in UK shops",
      "Filtering a full jug takes 10+ minutes",
    ],
    bestFor: "Families wanting certified lead removal in a large jug",
    filterLife: "2 months per cartridge",
    annualCost: 60,
  },

  // ─── COUNTERTOP ─────────────────────────────────────────────────────
  {
    id: "waterdrop-fc06",
    brand: "Waterdrop",
    model: "WD-FC-06 Tap Filter",
    slug: "waterdrop-fc-06",
    category: "countertop",
    removes: ["Chlorine", "Lead", "Fluoride"],
    certifications: ["NSF/ANSI 42"],
    priceGbp: 30,
    priceTier: "budget",
    affiliateUrl: "https://www.amazon.co.uk/dp/B0CT8JWHMX?tag=tapwater2107-21",
    affiliateProgram: "amazon",
    commission: { type: "percent", rate: 0.03 },
    affiliateTag: "tapwater2107-21",
    imageUrl: "/filters/waterdrop-fc06.png",
    rating: 4.3,
    badge: "budget",
    pros: [
      "Clips onto most standard UK taps in minutes",
      "Switch between filtered and unfiltered flow",
      "Compact design that doesn't dominate the counter",
    ],
    cons: [
      "Not compatible with pull-out or spray taps",
      "Limited contaminant removal compared to under-sink",
      "Filter lasts only 3 months at average use",
    ],
    bestFor: "Quick chlorine and lead reduction without plumbing",
    filterLife: "3 months",
    annualCost: 48,
    flowRate: "2.0 L/min",
  },
  {
    id: "tapp-water-ecopro",
    brand: "TAPP Water",
    model: "EcoPro",
    slug: "tapp-water-ecopro",
    category: "countertop",
    removes: ["Chlorine", "Lead", "Microplastics", "PFAS (total)"],
    certifications: ["SGS tested"],
    priceGbp: 60,
    priceTier: "mid",
    affiliateUrl: "https://www.amazon.co.uk/dp/B0CNY1KBT6?tag=tapwater2107-21",
    affiliateProgram: "amazon",
    commission: { type: "percent", rate: 0.03 },
    affiliateTag: "tapwater2107-21",
    imageUrl: "/filters/tapp-ecopro.jpeg",
    rating: 4.4,
    badge: "best-match",
    pros: [
      "Removes microplastics and PFAS — rare for a tap filter",
      "Biodegradable filter cartridges reduce waste",
      "Subscription model means filters arrive on time",
    ],
    cons: [
      "SGS tested rather than NSF certified",
      "Higher upfront cost than basic tap filters",
      "Requires specific tap adapter — check compatibility first",
    ],
    bestFor: "Eco-conscious households wanting PFAS removal at the tap",
    filterLife: "3 months",
    annualCost: 80,
    flowRate: "4.0 L/min",
  },

  // ─── UNDER-SINK (NON-RO) ───────────────────────────────────────────
  {
    id: "waterdrop-10ua",
    brand: "Waterdrop",
    model: "10UA Under Sink",
    slug: "waterdrop-10ua",
    category: "under_sink",
    removes: ["Chlorine", "Lead", "PFAS (total)"],
    certifications: ["NSF/ANSI 42"],
    // Checked at source 25 July: waterdropfilter.co.uk lists the WD-10UA variant at
    // £74.99. Our £59 came from an earlier reading and has since drifted; the guide
    // and the running-cost table both quote this figure.
    priceGbp: 75,
    priceTier: "budget",
    // Waterdrop's own UK programme via Awin pays 7%, where the Amazon listing paid 3%.
    affiliateUrl:
      "https://www.awin1.com/cread.php?awinmid=117649&awinaffid=2996923&ued=https%3A%2F%2Fwww.waterdropfilter.co.uk%2Fproducts%2Funder-sink-water-filter-direct-connect-filtration-system",
    affiliateProgram: "awin",
    commission: { type: "percent", rate: 0.07 },
    affiliateTag: "awin-2996923",
    imageUrl: "/filters/waterdrop-10ua.png",
    rating: 4.4,
    badge: "budget",
    pros: [
      "Massive 11,000-gallon filter life — lasts most households a year",
      "Simple DIY installation with push-fit connectors",
      "Compact body fits easily under standard UK sinks",
    ],
    cons: [
      "Fewer contaminants removed than RO systems",
      "Needs a dedicated filtered-water tap or adapter",
      "Single-stage filtration won't catch everything",
    ],
    bestFor: "High-volume under-sink filtration without RO complexity",
    filterLife: "12 months",
    annualCost: 30,
    flowRate: "3.8 L/min",
  },
  {
    id: "doulton-hip-ultracarb",
    brand: "Doulton",
    model: "HIP Ultracarb",
    slug: "doulton-hip-ultracarb",
    category: "under_sink",
    removes: ["Chlorine", "Lead", "Bacteria", "Microplastics", "Copper"],
    certifications: ["NSF/ANSI 42", "NSF/ANSI 53"],
    priceGbp: 120,
    priceTier: "mid",
    affiliateUrl: "https://www.amazon.co.uk/dp/B01LWRZBC6?tag=tapwater2107-21",
    affiliateProgram: "amazon",
    commission: { type: "percent", rate: 0.03 },
    affiliateTag: "tapwater2107-21",
    imageUrl: "/filters/doulton-hip-ultracarb.jpg",
    rating: 4.6,
    badge: "best-match",
    pros: [
      "Ceramic element removes 99.99% of bacteria",
      "British-made with over 190 years of heritage",
      "NSF 42 + 53 dual certification for lead and cysts",
    ],
    cons: [
      "Higher upfront cost than basic carbon filters",
      "Flow rate drops as ceramic element loads — needs periodic cleaning",
      "Does not remove PFAS or fluoride",
    ],
    bestFor: "Families wanting bacteria and lead removal from a trusted UK brand",
    filterLife: "6 months",
    annualCost: 80,
    flowRate: "2.0 L/min",
  },

  // ─── REVERSE OSMOSIS ───────────────────────────────────────────────
  {
    id: "waterdrop-g3p600",
    brand: "Waterdrop",
    model: "G3P600 Reverse Osmosis",
    slug: "waterdrop-g3p600",
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
    // Was an Impact link on publisher 5514161 — not our account. Ours (CCC Impact,
    // 6413869) was declined by Impact in January for not meeting their partner
    // standards, so nothing here was ever going to reach us. Waterdrop is on Awin
    // as merchant 117649, which we joined on 21 July, so this now runs through our
    // own publisher id at 7%.
    //
    // Price corrected at source: the old £399 matched neither store. waterdropfilter
    // .co.uk lists £549.98 and the .eu store the old link pointed at lists €549.99.
    priceGbp: 550,
    priceTier: "premium",
    affiliateUrl:
      "https://www.awin1.com/cread.php?awinmid=117649&awinaffid=2996923&ued=https%3A%2F%2Fwww.waterdropfilter.co.uk%2Fproducts%2Fwaterdrop-reverse-osmosis-water-filtration-system",
    affiliateProgram: "awin",
    commission: { type: "percent", rate: 0.07 },
    affiliateTag: "awin-2996923",
    imageUrl: "/filters/waterdrop-g3p600.png",
    rating: 4.6,
    badge: "best-match",
    pros: [
      "Removes 12+ contaminants including PFAS and fluoride",
      "Tankless design saves under-sink space",
      "Smart TDS monitoring panel shows real-time water quality",
    ],
    cons: [
      "Professional installation recommended — plumbing required",
      "Higher upfront cost than any jug or tap filter",
      "Wastes some water during the RO process (3:1 ratio)",
    ],
    bestFor: "Maximum contaminant removal including PFAS and fluoride",
    filterLife: "12–24 months depending on stage",
    annualCost: 80,
    flowRate: "2.3 L/min",
  },
  {
    id: "frizzlife-pd600",
    brand: "Frizzlife",
    model: "PD600 Under Sink RO",
    slug: "frizzlife-pd600",
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
    affiliateUrl: "https://www.amazon.co.uk/dp/B0GQGCDFWG?tag=tapwater2107-21",
    affiliateProgram: "amazon",
    commission: { type: "percent", rate: 0.03 },
    affiliateTag: "tapwater2107-21",
    imageUrl: "/filters/frizzlife-pd600.png",
    rating: 4.5,
    badge: "best-value",
    pros: [
      "Lower price than Waterdrop G3P600 with similar performance",
      "Twist-and-lock filter replacement — no tools needed",
      "600 GPD flow rate fills a glass in seconds",
    ],
    cons: [
      "Lacks the smart TDS monitoring panel",
      "Slightly noisier pump than Waterdrop",
      "Fewer certifications — NSF 58 only",
    ],
    bestFor: "Best value reverse osmosis for UK kitchens",
    filterLife: "12 months (composite filter)",
    annualCost: 70,
    flowRate: "2.3 L/min",
  },

  {
    id: "osmio-fusion-2",
    brand: "Osmio",
    model: "Fusion 2.0 Installed RO",
    slug: "osmio-fusion-2",
    category: "reverse_osmosis",
    removes: [
      "Chlorine",
      "Lead",
      "Bacteria",
      "Nitrates",
      "Fluoride",
      "Limescale",
      "Hormones",
      "Pharmaceutical residues",
      "Heavy metals",
    ],
    certifications: [],
    priceGbp: 495,
    priceTier: "premium",
    affiliateUrl:
      "https://www.osmiowater.co.uk/osmio-fusion.html?aw_affiliate=eyJjYW1wYWlnbl9pZCI6IjkiLCJ0cmFmZmljX3NvdXJjZSI6Im5vX3NvdXJjZSIsImFjY291bnRfaWQiOjIxM30",
    affiliateProgram: "direct",
    commission: { type: "fixed", gbp: 65 },
    affiliateTag: "osmio-213",
    imageUrl: "",
    rating: 4.3,
    badge: "premium",
    pros: [
      "Bioceramic remineralisation stage puts minerals back and lifts pH, which flat RO water lacks",
      "Widest contaminant list here, covering fluoride and nitrates as well as chlorine and lead",
      "UK company with UK-based support and spares",
    ],
    cons: [
      "No NSF or WRAS certification stated, unlike the Waterdrop G3P600",
      "Filters need replacing every 6 months at around £126/year",
      "Needs plumbing into the cold feed, so not a DIY job for most homes",
    ],
    bestFor: "Households wanting remineralised RO water from a UK supplier",
    filterLife: "6 months per filter set",
    annualCost: 126,
  },
  {
    id: "osmio-fusion-3",
    brand: "Osmio",
    model: "Fusion 3.0 Installed Hydrogen RO",
    slug: "osmio-fusion-3",
    category: "reverse_osmosis",
    removes: [
      "Chlorine",
      "Lead",
      "Bacteria",
      "Nitrates",
      "Fluoride",
      "Limescale",
      "Hormones",
      "Pharmaceutical residues",
      "Heavy metals",
    ],
    certifications: [],
    priceGbp: 650,
    priceTier: "premium",
    affiliateUrl:
      "https://www.osmiowater.co.uk/osmio-fusion-3-0-installed-hydrogen-reverse-osmosis-system-black.html?aw_affiliate=eyJjYW1wYWlnbl9pZCI6IjE4IiwidHJhZmZpY19zb3VyY2UiOiJub19zb3VyY2UiLCJhY2NvdW50X2lkIjoyMTN9",
    affiliateProgram: "direct",
    commission: { type: "fixed", gbp: 75 },
    affiliateTag: "osmio-213",
    imageUrl: "",
    rating: 4.1,
    badge: "premium",
    pros: [
      "Direct feed without a storage tank, so there is no waiting for the tank to refill",
      "Adds a hydrogen generator and chilled water in the same unit",
      "Same broad contaminant coverage as the Fusion 2.0",
    ],
    cons: [
      "£155 more than the Fusion 2.0 for features unrelated to filtration quality",
      "Manufacturer warranty is only 12 months, shorter than most systems here",
      "Osmio does not publish a filter replacement interval, so annual running cost is unknown",
    ],
    bestFor: "Buyers who specifically want tankless RO with hydrogen and chilled water",
    filterLife: "Not published by manufacturer",
  },
  {
    id: "osmio-zero",
    brand: "Osmio",
    model: "Zero 2.0 Countertop RO",
    slug: "osmio-zero",
    category: "reverse_osmosis",
    removes: [
      "Chlorine",
      "Lead",
      "Bacteria",
      "Nitrate",
      "Fluoride",
      "Limescale",
      "Heavy metals",
    ],
    certifications: [],
    priceGbp: 495,
    priceTier: "premium",
    affiliateUrl:
      "https://www.osmiowater.co.uk/zip-portable-reverse-osmosis-system.html?aw_affiliate=eyJjYW1wYWlnbl9pZCI6IjEiLCJ0cmFmZmljX3NvdXJjZSI6Im5vX3NvdXJjZSIsImFjY291bnRfaWQiOjIxM30",
    affiliateProgram: "direct",
    commission: { type: "fixed", gbp: 65 },
    affiliateTag: "osmio-213",
    imageUrl: "",
    rating: 4.4,
    badge: "best-value",
    pros: [
      "Plugs into a socket — the only RO here that needs no plumbing, so renters can use it",
      "Wastes 1 litre for every 5 produced, far less than a typical under-sink RO",
      "Dispenses at drinking temperature through to near-boiling, so it replaces the kettle too",
    ],
    cons: [
      "No NSF or WRAS certification stated",
      "Osmio does not publish a filter replacement interval, so annual running cost is unclear",
      "Takes up real worktop space at 38cm tall and 7kg",
    ],
    bestFor: "Renters and anyone who wants RO water without a plumber",
    flowRate: "7.8 L/hour",
    filterLife: "6 months per filter set",
    annualCost: 130,
  },
  // ─── WHOLE HOUSE ────────────────────────────────────────────────────
  {
    id: "bwt-e1-whole-house",
    brand: "BWT",
    model: "E1 Single Lever",
    slug: "bwt-e1-whole-house",
    category: "whole_house",
    removes: ["Sediment", "Chlorine", "Particles"],
    certifications: ["WRAS approved"],
    priceGbp: 250,
    priceTier: "mid",
    affiliateUrl: "https://www.amazon.co.uk/dp/B07DXR6TDF?tag=tapwater2107-21",
    affiliateProgram: "amazon",
    commission: { type: "percent", rate: 0.03 },
    affiliateTag: "tapwater2107-21",
    imageUrl: "/filters/bwt-e1.png",
    rating: 4.3,
    badge: "best-value",
    pros: [
      "WRAS approved — meets UK plumbing standards",
      "Single-lever backwash makes maintenance straightforward",
      "Protects boilers and appliances from sediment damage",
    ],
    cons: [
      "Only removes sediment and particles — not heavy metals or PFAS",
      "Requires professional installation at the mains inlet",
      "Backwash cycle wastes some water",
    ],
    bestFor: "Protecting whole-house plumbing from sediment and particles",
    filterLife: "No replacement needed — backwash cleans the filter",
    annualCost: 0,
    flowRate: "25 L/min",
  },

  {
    id: "osmio-pro-iii-ultimate",
    brand: "Osmio",
    model: "PRO-III Ultimate Whole House",
    slug: "osmio-pro-iii-ultimate",
    category: "whole_house",
    removes: [
      "Chlorine",
      "Lead",
      "Bacteria",
      "Sediment",
      "Nitrates",
      "Heavy metals",
      "Hormones",
      "Pharmaceutical residues",
    ],
    certifications: ["NSF/ANSI 42", "NSF/ANSI 61", "WaterMark"],
    priceGbp: 499,
    priceTier: "premium",
    affiliateUrl:
      "https://www.osmiowater.co.uk/osmio-pro-iii-ultimate-whole-house-water-filter-system.html?aw_affiliate=eyJjYW1wYWlnbl9pZCI6IjE3IiwidHJhZmZpY19zb3VyY2UiOiJub19zb3VyY2UiLCJhY2NvdW50X2lkIjoyMTN9",
    affiliateProgram: "direct",
    commission: { type: "fixed", gbp: 50 },
    affiliateTag: "osmio-213",
    imageUrl: "",
    rating: 4.4,
    badge: "best-match",
    pros: [
      "The only whole-house unit here that also targets bacteria, nitrates and pharmaceutical residues",
      "NSF/ANSI 42 and 61 certified via IAPMO, with WaterMark approval as well",
      "Ceramic stage runs three years, so most years need only a carbon change",
    ],
    cons: [
      "Does not touch limescale, so hard-water homes still need a separate softener",
      "No PFAS certification, even though Osmio sells a dedicated PFAS filter separately",
      "Around £188/year once all three stages are counted, the highest running cost here",
    ],
    bestFor:
      "Whole-house treatment where bacteria and heavy metals matter more than limescale",
    filterLife: "Ceramic 3 years, carbon 6-12 months, GAC+KDF 12-18 months",
    annualCost: 188,
  },
  // ─── SHOWER ─────────────────────────────────────────────────────────
  {
    id: "jolie-filtered-showerhead",
    brand: "Jolie",
    model: "Filtered Showerhead",
    slug: "jolie-filtered-showerhead",
    category: "shower",
    removes: ["Chlorine", "Heavy metals", "Chloramine"],
    certifications: [],
    priceGbp: 85,
    priceTier: "premium",
    affiliateUrl: "https://www.amazon.co.uk/dp/B0BM3DXSR3?tag=tapwater2107-21",
    affiliateProgram: "amazon",
    commission: { type: "percent", rate: 0.03 },
    affiliateTag: "tapwater2107-21",
    imageUrl: "/filters/jolie-showerhead.jpeg",
    rating: 4.5,
    badge: "premium",
    pros: [
      "Premium brushed-steel design that looks great in any bathroom",
      "KDF-55 and calcium sulphite media target chlorine and chloramine",
      "Noticeable improvement in hair and skin softness within a week",
    ],
    cons: [
      "Expensive for a showerhead at £85",
      "Filter replacement every 3 months adds ongoing cost",
      "Won't remove fluoride, PFAS, or heavy metals beyond basic levels",
    ],
    bestFor: "Anyone noticing dry skin or hair from chlorinated shower water",
    filterLife: "3 months",
    annualCost: 60,
  },
  {
    id: "aquabliss-sf220",
    brand: "AquaBliss",
    model: "SF220 Shower Filter",
    slug: "aquabliss-sf220",
    category: "shower",
    removes: ["Chlorine", "Heavy metals", "Sediment"],
    certifications: [],
    priceGbp: 25,
    priceTier: "budget",
    affiliateUrl: "https://www.amazon.co.uk/dp/B01MUBU0YC?tag=tapwater2107-21",
    affiliateProgram: "amazon",
    commission: { type: "percent", rate: 0.03 },
    affiliateTag: "tapwater2107-21",
    imageUrl: "/filters/aquabliss-sf220.jpg",
    rating: 4.2,
    badge: "budget",
    pros: [
      "Budget-friendly entry point at just £25",
      "Multi-stage sediment, KDF, and carbon block filtration",
      "Universal fit works with any standard shower arm",
    ],
    cons: [
      "Plastic housing feels less premium than Jolie",
      "Flow rate drops noticeably after 2 months",
      "Replacement cartridges can be hard to source in the UK",
    ],
    bestFor: "Affordable shower filtration for renters or first-time buyers",
    filterLife: "6 months",
    annualCost: 20,
  },
  {
    id: "philips-awp1775",
    brand: "Philips",
    model: "AWP1775 Shower Filter",
    slug: "philips-awp1775",
    category: "shower",
    removes: ["Chlorine", "Sediment"],
    certifications: [],
    priceGbp: 35,
    priceTier: "mid",
    affiliateUrl: "https://www.amazon.co.uk/dp/B07358SY5W?tag=tapwater2107-21",
    affiliateProgram: "amazon",
    commission: { type: "percent", rate: 0.03 },
    affiliateTag: "tapwater2107-21",
    imageUrl: "/filters/philips-awp1775.jpg",
    rating: 4.3,
    badge: "best-value",
    pros: [
      "Trusted Philips brand with reliable build quality",
      "Activated carbon fibre media removes chlorine effectively",
      "Sleek in-line design doesn't change your showerhead",
    ],
    cons: [
      "Only removes chlorine and sediment — no heavy metals",
      "Filter cartridge is Philips-proprietary — no third-party options",
      "Slightly reduces water pressure in low-pressure systems",
    ],
    bestFor: "Mid-range chlorine removal from a brand you recognise",
    filterLife: "3 months",
    annualCost: 48,
  },
  {
    id: "osmio-vitafresh-inline",
    brand: "Osmio",
    model: "Vitafresh Inline Vitamin C Combo Pack",
    slug: "osmio-vitafresh-inline",
    category: "shower",
    removes: ["Chlorine", "Chloramine"],
    certifications: [],
    priceGbp: 59,
    priceTier: "mid",
    affiliateUrl:
      "https://www.osmiowater.co.uk/water-filters/shower-filters/osmio-vitafresh-advanced-shower-filter-combo-pack.html?aw_affiliate=eyJjYW1wYWlnbl9pZCI6IjQiLCJ0cmFmZmljX3NvdXJjZSI6Im5vX3NvdXJjZSIsImFjY291bnRfaWQiOjIxM30",
    affiliateProgram: "direct",
    commission: { type: "fixed", gbp: 10 },
    affiliateTag: "osmio-213",
    imageUrl: "",
    rating: 4.3,
    badge: "best-value",
    pros: [
      "Vitamin C neutralises chlorine chemically rather than adsorbing it, so it keeps working at shower temperature",
      "Fits inline above your existing head, so you keep the showerhead you already have",
      "Pharmaceutical food grade vitamin C, stated as compliant with UK and European standards",
    ],
    cons: [
      "Cartridges last around 2 months, the shortest here, so roughly £70/year in replacements",
      "The fabric pre-filter is a separate consumable on top of that",
      "No independent certification listed, unlike the NSF-certified systems elsewhere on this site",
    ],
    bestFor: "Chlorine-heavy supplies where you want to keep your own showerhead",
    filterLife: "2 months per cartridge",
    annualCost: 70,
  },
  {
    id: "osmio-vitafresh-handheld",
    brand: "Osmio",
    model: "Vitafresh Handheld Vitamin C",
    slug: "osmio-vitafresh-handheld",
    category: "shower",
    removes: ["Chlorine", "Chloramine"],
    certifications: [],
    priceGbp: 37.5,
    priceTier: "budget",
    affiliateUrl:
      "https://www.osmiowater.co.uk/water-filters/shower-filters/vitamin-c-shower-filter.html?aw_affiliate=eyJjYW1wYWlnbl9pZCI6IjMiLCJ0cmFmZmljX3NvdXJjZSI6Im5vX3NvdXJjZSIsImFjY291bnRfaWQiOjIxM30",
    affiliateProgram: "direct",
    commission: { type: "fixed", gbp: 5 },
    affiliateTag: "osmio-213",
    imageUrl: "",
    rating: 4.2,
    badge: "budget",
    pros: [
      "Replaces the handset itself and fits in seconds with no tools",
      "Same pharmaceutical-grade vitamin C stage as the inline version at a lower entry price",
      "Cartridge goes clear when the vitamin C is spent, so you can see when to change it",
    ],
    cons: [
      "Cartridges last around 2 months, so the £70/year running cost is the same as the inline version",
      "You lose your existing handset, unlike the inline option",
      "Osmio warn the stainless steel plate is unsuitable for some electric showers",
    ],
    bestFor: "The cheapest way into vitamin C shower filtering",
    filterLife: "2 months per cartridge",
    annualCost: 70,
  },

  // ─── WATER SOFTENERS ─────────────────────────────────────────────────

  // ─── TESTING KITS ──────────────────────────────────────────────────
  {
    id: "simplexhealth-17-in-1",
    brand: "SimplexHealth",
    model: "17-in-1 Water Test Kit",
    slug: "simplexhealth-17-in-1",
    category: "testing_kit",
    removes: [],
    certifications: [],
    priceGbp: 13,
    priceTier: "budget",
    affiliateUrl: "https://www.amazon.co.uk/dp/B078FG1PWV?tag=tapwater2107-21",
    affiliateProgram: "amazon",
    commission: { type: "percent", rate: 0.03 },
    affiliateTag: "tapwater2107-21",
    imageUrl: "/filters/simplexhealth-13.jpg",
    rating: 4.1,
    badge: "budget",
    pros: [
      "Tests 17 parameters including lead, pH, and hardness",
      "Results in 2 minutes with colour-match strips",
      "Cheapest way to get a quick snapshot of your water",
    ],
    cons: [
      "Strip tests are less accurate than lab analysis",
      "Colour matching can be subjective in poor lighting",
      "Does not test for PFAS or microplastics",
    ],
    bestFor: "Quick DIY screening before investing in a filter",
  },
  {
    id: "sj-wave-16-in-1",
    brand: "SJ WAVE",
    model: "16-in-1 Premium Water Test",
    slug: "sj-wave-16-in-1",
    category: "testing_kit",
    removes: [],
    certifications: [],
    priceGbp: 15,
    priceTier: "budget",
    affiliateUrl: "https://www.amazon.co.uk/dp/B0CXXLF9Q1?tag=tapwater2107-21",
    affiliateProgram: "amazon",
    commission: { type: "percent", rate: 0.03 },
    affiliateTag: "tapwater2107-21",
    imageUrl: "/filters/sj-wave-16.jpg",
    rating: 4.0,
    badge: "budget",
    pros: [
      "150 strips included — enough for regular monthly testing",
      "Tests bacteria, lead, iron, copper, and more",
      "Clear colour chart printed on the bottle label",
    ],
    cons: [
      "Bacteria test requires 48-hour incubation period",
      "No digital readout — manual colour comparison only",
      "Cannot detect PFAS or pharmaceutical residues",
    ],
    bestFor: "Ongoing monthly monitoring with plenty of test strips",
  },
];

/**
 * Metadata for each product category — used by category landing pages and SEO.
 */
export const CATEGORY_META: Record<
  ProductCategory,
  {
    title: string;
    slug: string;
    description: string;
    bestFor: string;
    priceRange: string;
  }
> = {
  jug: {
    title: "Water Filter Jugs",
    slug: "water-filter-jugs",
    description:
      "The simplest way to filter your tap water. Fill, wait, pour. No installation, no plumbing, no fuss.",
    bestFor: "Renters, small households, and anyone wanting a quick improvement",
    priceRange: "£20–£40",
  },
  countertop: {
    title: "Countertop & Tap Filters",
    slug: "countertop-tap-filters",
    description:
      "Clip-on or countertop filters that connect directly to your kitchen tap for on-demand filtered water.",
    bestFor: "Renters who want better filtration than a jug without permanent changes",
    priceRange: "£30–£60",
  },
  under_sink: {
    title: "Under-Sink Filters",
    slug: "under-sink-filters",
    description:
      "Hidden under your kitchen sink, these filters provide high-capacity filtration without cluttering your counter.",
    bestFor: "Homeowners wanting set-and-forget filtration with high capacity",
    priceRange: "£45–£120",
  },
  reverse_osmosis: {
    title: "Reverse Osmosis Systems",
    slug: "reverse-osmosis-systems",
    description:
      "The gold standard. RO systems push water through a semi-permeable membrane, removing virtually everything.",
    bestFor: "Households with PFAS, fluoride, or nitrate concerns",
    priceRange: "£329–£499",
  },
  whole_house: {
    title: "Whole House Filters",
    slug: "whole-house-filters",
    description:
      "Installed at the mains inlet, these systems filter every drop of water entering your home.",
    bestFor: "Homeowners wanting filtered water from every tap and shower",
    priceRange: "£250–£499",
  },
  shower: {
    title: "Shower Filters",
    slug: "shower-filters",
    description:
      "Reduce chlorine and sediment from your shower water to improve skin, hair, and breathing comfort.",
    bestFor: "Anyone with dry skin, eczema, or brittle hair from hard/chlorinated water",
    priceRange: "£25–£85",
  },
  water_softener: {
    title: "Water Softeners",
    slug: "water-softeners",
    description:
      "Ion exchange water softeners remove calcium and magnesium from your supply, eliminating limescale and protecting appliances.",
    bestFor: "Homeowners in hard water areas (200+ mg/L) wanting to protect boilers, pipes, and appliances",
    priceRange: "£800–£3,000 installed",
  },
  testing_kit: {
    title: "Water Testing Kits",
    slug: "water-testing-kits",
    description:
      "Find out exactly what is in your water before deciding which filter to buy.",
    bestFor: "Anyone who wants data before spending money on filtration",
    priceRange: "£13–£15",
  },
};

/**
 * Display order for categories — most commonly purchased first.
 */
export const CATEGORY_ORDER: ProductCategory[] = [
  "jug",
  "countertop",
  "under_sink",
  "reverse_osmosis",
  "whole_house",
  "shower",
  "testing_kit",
  "water_softener",
];

/**
 * Look up products by category.
 */
export function getProductsByCategory(
  category: ProductCategory,
): FilterProduct[] {
  return PRODUCTS.filter((p) => p.category === category && p.availableInUk !== false);
}

/**
 * Look up a single product by its URL slug.
 */
/**
 * What a sale of this product earns us, in pounds. Null when the rate is unconfirmed,
 * so callers show a blank rather than a made-up number.
 */
export function estimatedEarningsGbp(product: FilterProduct): number | null {
  const c = product.commission;
  if (!c) return null;
  return c.type === "fixed" ? c.gbp : product.priceGbp * c.rate;
}

export function getProductBySlug(slug: string): FilterProduct | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

/** Returns a specific product regardless of UK availability (for conditional rendering) */
export function getProductIncludingUnavailable(slug: string): FilterProduct | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
