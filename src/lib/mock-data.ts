import type { PostcodeData, FilterProduct, SupplierData } from "./types";

export const MOCK_READINGS = [
  { name: "Lead", value: 0.003, unit: "mg/L", ukLimit: 0.01, whoGuideline: 0.01, status: "pass" as const },
  { name: "Nitrate", value: 28.0, unit: "mg/L", ukLimit: 50.0, whoGuideline: 50.0, status: "pass" as const },
  { name: "PFAS (total)", value: 0.08, unit: "µg/L", ukLimit: null, whoGuideline: 0.1, status: "warning" as const, isPfas: true },
  { name: "PFOS", value: 0.03, unit: "µg/L", ukLimit: null, whoGuideline: 0.1, status: "pass" as const, isPfas: true },
  { name: "Chlorine residual", value: 0.42, unit: "mg/L", ukLimit: 5.0, whoGuideline: 5.0, status: "pass" as const },
  { name: "Turbidity", value: 0.8, unit: "NTU", ukLimit: 4.0, whoGuideline: 4.0, status: "pass" as const },
  { name: "Coliform bacteria", value: 0, unit: "count/100ml", ukLimit: 0, whoGuideline: 0, status: "pass" as const },
  { name: "E. coli", value: 0, unit: "count/100ml", ukLimit: 0, whoGuideline: 0, status: "pass" as const },
  { name: "Iron", value: 0.045, unit: "mg/L", ukLimit: 0.2, whoGuideline: 0.3, status: "pass" as const },
  { name: "Copper", value: 0.12, unit: "mg/L", ukLimit: 2.0, whoGuideline: 2.0, status: "pass" as const },
  { name: "Arsenic", value: 0.002, unit: "µg/L", ukLimit: 0.01, whoGuideline: 0.01, status: "pass" as const },
  { name: "Hardness (CaCO3)", value: 280, unit: "mg/L", ukLimit: null, whoGuideline: null, status: "pass" as const },
];

export const MOCK_POSTCODE: PostcodeData = {
  district: "SW1A",
  areaName: "Westminster",
  city: "London",
  region: "Greater London",
  latitude: 51.5014,
  longitude: -0.1419,
  supplier: "Thames Water",
  supplierId: "thames-water",
  supplyZone: "London Central",
  safetyScore: 7.2,
  scoreGrade: "good",
  contaminantsTested: 12,
  contaminantsFlagged: 2,
  pfasDetected: true,
  pfasLevel: 0.08,
  pfasSource: "environmental",
  lastUpdated: "2026-03-28",
  lastSampleDate: "2026-03-14",
  readings: MOCK_READINGS,
  nearbyPostcodes: ["SW1B", "SW1E", "SW1H", "SW1P", "SW1V", "SW1W", "SW1X", "SW1Y", "W1", "WC2"],
  dataSource: "ea-only",
  drinkingWaterReadings: [],
  environmentalReadings: [],
  sampleCount: 0,
  dateRange: null,
};

export const MOCK_POSTCODES: Record<string, PostcodeData> = {
  SW1A: MOCK_POSTCODE,
  E1: {
    ...MOCK_POSTCODE,
    district: "E1",
    areaName: "Whitechapel",
    city: "London",
    safetyScore: 6.8,
    scoreGrade: "fair",
    contaminantsFlagged: 3,
    pfasLevel: 0.09,
    readings: MOCK_READINGS.map((r) =>
      r.name === "PFAS (total)" ? { ...r, value: 0.09 } : r.name === "Lead" ? { ...r, value: 0.007 } : r
    ),
    nearbyPostcodes: ["E2", "E3", "E14", "EC1", "EC2", "EC3"],
  },
  M1: {
    ...MOCK_POSTCODE,
    district: "M1",
    areaName: "Manchester City Centre",
    city: "Manchester",
    region: "North West",
    supplier: "United Utilities",
    supplierId: "united-utilities",
    supplyZone: "Manchester Central",
    safetyScore: 8.1,
    scoreGrade: "good",
    contaminantsFlagged: 0,
    pfasDetected: false,
    pfasLevel: null,
    pfasSource: null,
    nearbyPostcodes: ["M2", "M3", "M4", "M5", "M6", "M7", "M8"],
  },
  B1: {
    ...MOCK_POSTCODE,
    district: "B1",
    areaName: "Birmingham City Centre",
    city: "Birmingham",
    region: "West Midlands",
    supplier: "Severn Trent",
    supplierId: "severn-trent",
    supplyZone: "Birmingham Central",
    safetyScore: 6.4,
    scoreGrade: "fair",
    contaminantsFlagged: 3,
    pfasDetected: true,
    pfasLevel: 0.06,
    pfasSource: "environmental",
    nearbyPostcodes: ["B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9"],
  },
  LS1: {
    ...MOCK_POSTCODE,
    district: "LS1",
    areaName: "Leeds City Centre",
    city: "Leeds",
    region: "Yorkshire",
    supplier: "Yorkshire Water",
    supplierId: "yorkshire-water",
    supplyZone: "Leeds Central",
    safetyScore: 7.8,
    scoreGrade: "good",
    contaminantsFlagged: 1,
    pfasDetected: false,
    pfasLevel: null,
    pfasSource: null,
    nearbyPostcodes: ["LS2", "LS3", "LS4", "LS5", "LS6", "LS7"],
  },
};

export const MOCK_FILTERS: FilterProduct[] = [
  {
    id: "brita-maxtra-pro",
    brand: "BRITA",
    model: "MAXTRA PRO All-in-1",
    slug: "brita-maxtra-pro-all-in-1",
    category: "jug",
    removes: ["chlorine", "lead", "copper", "pfas"],
    certifications: ["TÜV SÜD"],
    priceGbp: 29.99,
    priceTier: "budget",
    affiliateUrl: "#",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater2107-21",
    imageUrl: "",
    rating: 4.5,
    badge: "budget",
    pros: ["Affordable", "No installation"],
    cons: ["Limited contaminant removal"],
    bestFor: "Basic chlorine and taste improvement",
  },
  {
    id: "zerowater-ready-pour",
    brand: "ZeroWater",
    model: "Ready-Pour 10-Cup",
    slug: "zerowater-ready-pour-10-cup",
    category: "jug",
    removes: ["pfas", "lead", "chlorine", "chromium", "mercury"],
    certifications: ["NSF 53", "NSF 401"],
    priceGbp: 39.99,
    priceTier: "mid",
    affiliateUrl: "#",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater2107-21",
    imageUrl: "",
    rating: 4.3,
    badge: "best-match",
    pros: ["Removes PFAS", "NSF certified"],
    cons: ["Filters need frequent replacement"],
    bestFor: "Households concerned about PFAS",
  },
  {
    id: "osmio-zero",
    brand: "Osmio",
    model: "Zero Installation Reverse Osmosis",
    slug: "osmio-zero-installation-ro",
    category: "countertop",
    removes: ["pfas", "lead", "nitrate", "chlorine", "arsenic", "fluoride", "bacteria"],
    certifications: ["NSF 58"],
    priceGbp: 349,
    priceTier: "premium",
    affiliateUrl: "#",
    affiliateProgram: "amazon",
    affiliateTag: "tapwater2107-21",
    imageUrl: "",
    rating: 4.7,
    badge: "premium",
    pros: ["No installation needed", "Comprehensive removal"],
    cons: ["Higher upfront cost", "Counter space required"],
    bestFor: "Maximum filtration without plumbing changes",
  },
];

/**
 * The water companies, with figures that each have a source:
 *
 * - quality, England and Wales: the Drinking Water Inspectorate's Compliance
 *   Risk Index for 2025 (Drinking Water 2025, read from the data behind the
 *   report's company chart on 17 November 2026). The Inspectorate publishes no
 *   percentage per company. The percentages this list carried until then
 *   ("99.96% compliance") had no source and are gone.
 * - quality, Scotland: share of samples at customers' taps that met the
 *   standards in 2025 (DWQR annual report). Northern Ireland: the same for
 *   2024 (Drinking Water Inspectorate for Northern Ireland annual report).
 * - customersM: people supplied with drinking water, from the Inspectorate's
 *   Company Performance Data for 2024, rounded. Northumbrian (2.7) and Essex &
 *   Suffolk (2.0) are the company's own figures, because the Inspectorate
 *   counts them together. Several earlier values were the sewerage population
 *   (Thames 15, Southern 4.7, Wessex 2.8). Null where no sourced figure was found.
 * - postcodeAreas here is only a fallback: getSuppliersList() replaces it with
 *   every district the company really supplies.
 */
export const MOCK_SUPPLIERS: SupplierData[] = [
  { id: "thames-water", name: "Thames Water", region: "London and Thames Valley", customersM: 10.1, quality: { kind: "cri", value: 4.32, year: 2025 }, website: "https://www.thameswater.co.uk", postcodeAreas: ["SW1A", "SW1V", "SW3", "SW6", "SW7", "SW11", "SW15", "SW18", "SW19", "SE1", "SE10", "SE13", "SE15", "E1", "E2", "E3", "E8", "E14", "N1", "N7", "NW1", "NW3", "NW10", "W2", "W4", "W8", "W12", "OX1", "OX2", "RG1"] },
  { id: "severn-trent", name: "Severn Trent", region: "Midlands", customersM: 8.8, quality: { kind: "cri", value: 1.24, year: 2025 }, website: "https://www.stwater.co.uk", postcodeAreas: ["B1", "B2", "B3", "B5", "B8", "B11", "B15", "NG1", "NG2", "NG7", "DE1", "CV1", "CV3", "LE1", "LE2"] },
  { id: "united-utilities", name: "United Utilities", region: "North West", customersM: 7.4, quality: { kind: "cri", value: 2.11, year: 2025 }, website: "https://www.unitedutilities.com", postcodeAreas: ["M1", "M2", "M3", "M4", "M5", "M14", "M20", "M21", "L1", "L2", "L3", "L5", "L8"] },
  { id: "yorkshire-water", name: "Yorkshire Water", region: "Yorkshire", customersM: 5.7, quality: { kind: "cri", value: 3.15, year: 2025 }, website: "https://www.yorkshirewater.com", postcodeAreas: ["LS1", "LS2", "LS3", "LS6", "LS7", "S1", "S2", "S10", "S11", "YO1", "YO10"] },
  { id: "anglian-water", name: "Anglian Water", region: "East of England", customersM: 4.9, quality: { kind: "cri", value: 3.13, year: 2025 }, website: "https://www.anglianwater.co.uk", postcodeAreas: ["CB1", "CB2", "NR1", "NR2"] },
  { id: "affinity-water", name: "Affinity Water", region: "Home counties north and west of London, and parts of Essex and Kent", customersM: 3.8, quality: { kind: "cri", value: 3.17, year: 2025 }, website: "https://www.affinitywater.co.uk", postcodeAreas: ["N11", "N12", "NW9"] },
  { id: "welsh-water", name: "Dŵr Cymru Welsh Water", region: "Wales", customersM: 3.1, quality: { kind: "cri", value: 7.1, year: 2025 }, website: "https://www.dwrcymru.com", postcodeAreas: ["CF10", "CF11", "CF14", "SA1", "SA2"] },
  { id: "southern-water", name: "Southern Water", region: "Kent, Sussex, Hampshire and the Isle of Wight", customersM: 2.7, quality: { kind: "cri", value: 3.19, year: 2025 }, website: "https://www.southernwater.co.uk", postcodeAreas: ["BN1", "BN2", "PO1", "PO2", "SO14", "SO15"] },
  { id: "northumbrian-water", name: "Northumbrian Water", region: "North East", customersM: 2.7, quality: { kind: "cri", value: 3.9, year: 2025, note: "The regulator scores Northumbrian Water and Essex & Suffolk Water together." }, website: "https://www.nwl.co.uk", postcodeAreas: ["NE1", "NE2", "NE3", "NE4", "NE6"] },
  { id: "south-east-water", name: "South East Water", region: "Kent, Sussex, Surrey, Hampshire and Berkshire", customersM: 2.3, quality: { kind: "cri", value: 2.08, year: 2025 }, website: "https://www.southeastwater.co.uk", postcodeAreas: ["BN3"] },
  { id: "south-west-water", name: "South West Water", region: "Devon, Cornwall and the Bournemouth area", customersM: 2.3, quality: { kind: "cri", value: 1.37, year: 2025 }, website: "https://www.southwestwater.co.uk", postcodeAreas: ["EX1", "EX2", "PL1", "PL2"] },
  { id: "essex-suffolk-water", name: "Essex & Suffolk Water", region: "Essex and Suffolk", customersM: 2.0, quality: { kind: "cri", value: 3.9, year: 2025, note: "The regulator scores Essex & Suffolk Water and Northumbrian Water together." }, website: "https://www.eswater.co.uk", postcodeAreas: ["CM1", "CM2", "CM3", "IP17", "IP18", "IG1", "RM8"] },
  { id: "wessex-water", name: "Wessex Water", region: "Somerset, Wiltshire, Dorset and Bath", customersM: 1.4, quality: { kind: "cri", value: 0.92, year: 2025 }, website: "https://www.wessexwater.co.uk", postcodeAreas: ["BA1", "BA2"] },
  { id: "south-staffs-water", name: "South Staffs Water", region: "South Staffordshire and the West Midlands", customersM: 1.4, quality: { kind: "cri", value: 1.26, year: 2025 }, website: "https://www.south-staffs-water.co.uk", postcodeAreas: ["CB3", "CB4"] },
  { id: "bristol-water", name: "Bristol Water", region: "Bristol and surrounding area", customersM: 1.3, quality: { kind: "cri", value: 3.95, year: 2025 }, website: "https://www.bristolwater.co.uk", postcodeAreas: ["BS1", "BS2", "BS3", "BS5", "BS6", "BS8", "BA1", "BA2"] },
  { id: "portsmouth-water", name: "Portsmouth Water", region: "Hampshire and West Sussex", customersM: 0.76, quality: { kind: "cri", value: 0.45, year: 2025 }, website: "https://www.portsmouthwater.co.uk", postcodeAreas: ["PO4", "PO5"] },
  { id: "ses-water", name: "SES Water", region: "East Surrey, West Sussex, west Kent and south London", customersM: 0.75, quality: { kind: "cri", value: 0, year: 2025 }, website: "https://seswater.co.uk", postcodeAreas: ["SM1", "SM2", "RH1", "RH2"] },
  { id: "cambridge-water", name: "Cambridge Water", region: "Cambridge", customersM: 0.35, quality: { kind: "cri", value: 0.53, year: 2025 }, website: "https://www.cambridge-water.co.uk", postcodeAreas: ["CB2", "CB3", "CB4", "CB5"] },
  { id: "hafren-dyfrdwy", name: "Hafren Dyfrdwy", region: "North east and mid Wales", customersM: 0.21, quality: { kind: "cri", value: 1.26, year: 2025 }, website: "https://www.hdcymru.co.uk", postcodeAreas: ["LL11", "LL12", "LL13", "SY16"] },
  { id: "scottish-water", name: "Scottish Water", region: "Scotland", customersM: null, quality: { kind: "percent", value: 99.88, year: 2025, regulator: "Drinking Water Quality Regulator for Scotland" }, website: "https://www.scottishwater.co.uk", postcodeAreas: ["EH1", "EH3", "EH7", "G1", "G2", "G3", "G12", "AB10", "AB11"] },
  { id: "ni-water", name: "NI Water", region: "Northern Ireland", customersM: null, quality: { kind: "percent", value: 99.87, year: 2024, regulator: "Drinking Water Inspectorate for Northern Ireland" }, website: "https://www.niwater.com", postcodeAreas: ["BT1", "BT2", "BT7", "BT9"] },
];

export const MOST_CHECKED = ["SW1A", "E1", "M1", "B1", "LS1", "BS1", "EH1", "CF10", "NE1", "OX1"];
