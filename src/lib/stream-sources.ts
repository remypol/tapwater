/**
 * Water company → Stream Water Data Portal ArcGIS service registry.
 *
 * Most companies publish to the shared Stream org (XxS6FebPX29TRGDJ).
 * Yorkshire Water uses its own org (1WqkK5cDKUbF0CkH).
 *
 * Field schemas vary between companies:
 * - Yorkshire Water: UPPER_CASE fields, epoch ms dates
 * - Most others: CamelCase fields, string dates ("1/2/2024 12:00:00 AM")
 */

export interface StreamService {
  year: number;
  serviceName: string;
}

export interface StreamSource {
  orgId: string;
  services: StreamService[];
  geoField: string;
  fieldCase: "upper" | "camel";
  dateFormat: "epoch" | "string";
  /**
   * Unit to use, keyed by exact determinand name, when a service leaves the
   * Units field empty or puts the operator ("<", ">", "#") in it. A determinand
   * missing from the map stays unitless, and the scorer drops unitless readings:
   * no unit is better than a guessed one on a health page.
   */
  unitFallback?: Record<string, string>;
}

const STREAM_ORG = "XxS6FebPX29TRGDJ";

/** Every name in `names` gets `unit`. */
function withUnit(unit: string, names: string[]): Record<string, string> {
  return Object.fromEntries(names.map((n) => [n, unit]));
}

/**
 * Units for Southern Water's 2022-2026 extract, whose Units column is null on
 * every row (or holds a copy of the operator).
 *
 * Established on 26 Sept 2026 by matching the extract against Southern's own
 * dated services (_Domestic_Drinking_Water_Quality_2024 and _2025), which do
 * carry units: the same sample appears in both, so same LSOA, same date, same
 * determinand and the same Result. 290,000 extract rows from 2024-25 were
 * checked; for every determinand below the match rate was 97-100% and no value
 * was out by a factor of 1000. Examples: LEAD (UNFLUSHED) 491 exact matches,
 * NITRATE 486, IRON 2,254, E. COLI (CONFIRMED) 6,437, PH 2,250.
 *
 * A few names have no dated counterpart and were placed by their limits of
 * detection, which are a lab's fingerprint for a unit: LEAD reports the same
 * LODs as LEAD (UNFLUSHED) (0.9, 0.09, 0.04 µg/l) and 60 LEAD results equal a
 * LEAD (UNFLUSHED) result at the same address on the same day; COPPER shares
 * COPPER (UNFLUSHED)'s 0.009 mg/l; the unflushed and dissolved iron,
 * unflushed aluminium and plain nickel share their siblings' µg/l LODs.
 *
 * Deliberately left out, so those readings stay unscored:
 * - HARDNESS (TOTAL) is mg/l expressed as calcium, not as CaCO3: it equals
 *   CALCIUM + MAGNESIUM x 40.08/24.31 (median ratio 1.000 over 1,989 samples).
 *   The scorer labels hardness "as CaCO3", so Brighton's 113 (about 283 as
 *   CaCO3, very hard) would read as moderately soft. HARDNESS (°DH) takes only
 *   the values 5, 11, 15, 25 and 58, which is a band code, not a measurement.
 * - Individual PFAS compounds. They are µg/l (LODs of 0.0004-0.005, well
 *   under the DWI's 0.01 µg/l tier 1), but most rows are below-detection
 *   placeholders and the scorer counts any PFAS row as a detection, so 25
 *   districts where nothing was found would read "PFAS detected". The measured
 *   total is kept: four rows, all real results, 0.0007-0.029 µg/l.
 * - Presumptive bacteria counts, which are unconfirmed; only confirmed ones.
 * - DWI NITRATE/NITRITE INDEX (a ratio; the scorer would read it as nitrite).
 *
 * Bacteria are counts per 100 ml; the dated services spell that
 * "number/100ml", written here as the equivalent "no/100ml" the scorer reads.
 */
const SOUTHERN_UNIT_FALLBACK: Record<string, string> = {
  ...withUnit("µg/l", [
    // Metals and inorganics
    "ALUMINIUM", "ALUMINIUM (UNFLUSHED)", "ANTIMONY", "ARSENIC", "BROMATE",
    "CADMIUM", "CHROMIUM", "CYANIDE (TOTAL)", "IRON", "IRON (UNFLUSHED)",
    "IRON (DISSOLVED)", "LEAD", "LEAD (UNFLUSHED)", "MANGANESE", "MERCURY",
    "NICKEL", "NICKEL (UNFLUSHED)", "SELENIUM",
    // Organics and disinfection by-products
    "BENZENE", "BENZOPYRENE (A)", "BROMOFORM", "CARBON TETRACHLORIDE",
    "DICHLOROETHANE (1,2)", "PNAHS (DWI) (SUM OF 4 IDENTIFIED)",
    "TOTAL CHLOROETHENES", "TRIHALOMETHANES (SUM OF IDENTIFIED THMS)",
    "PFAS TOTAL IN TREATED WATER",
    // Pesticides
    "24D", "24DB", "ALDRIN", "ATRAZINE", "ATRAZINE DESETHYL", "AZOXYSTROBIN",
    "BENTAZONE", "BOSCALID", "BROMACIL", "BROMOXYNIL", "CARBENDAZIM / BENOMYL",
    "CARBETAMIDE", "CHLORTOLURON", "CLOPYRALID", "CYPROCONAZOLE", "DICAMBA",
    "DICHLOBENIL", "DICHLORPROP", "DIELDRIN", "DIFLUFENICAN", "DIMETHENAMID-P",
    "DIURON", "EPOXICONAZOLE", "EPTC", "FENPROPIMORPH", "FLUFENACET",
    "FLUOROXYPYR", "FLUSILAZOLE", "FLUTRIAFOL", "GLYPHOSATE", "HEPTACHLOR",
    "HEPTACHLOR (HEPTACHLOR EPOXIDE)", "HEPTACHLOR (TOTAL HEPTACHLOR EPOXIDE)",
    "HEXACHLOROCYCLOHEXANE (GAMMA)", "IMAZAPYR", "IOXYNIL", "ISOPROTURON",
    "LINURON", "MCPA", "MCPB", "MECOPROP", "MESOSULFURON-METHYL", "METALDEHYDE",
    "METAZACHLOR", "METHABENZTHIAZURON", "METHIOCARB", "OXADIXYL",
    "PENDIMETHALIN", "PESTICIDES (SUM OF IDENTIFIED)", "PICLORAM", "PROMETRYNE",
    "PROPAZINE", "PROPYZAMIDE", "PROSULFOCARB", "QUINMERAC", "SIMAZINE",
    "TEBUCONAZOLE", "TECNAZENE", "TERBUTRYN", "TRIALLATE",
    "TRICHLOROPHENOXYACETIC ACID (2,4,5)", "TRICLOPYR", "TRIETAZINE", "TRIFLURALIN",
  ]),
  ...withUnit("mg/l", [
    "BORON", "CARBON (TOTAL ORGANIC)", "CHLORIDE", "COPPER", "COPPER (UNFLUSHED)",
    "FLUORIDE", "SODIUM", "SULPHATE",
  ]),
  NITRATE: "mgNO3/l",
  NITRITE: "mgNO2/l",
  AMMONIA: "mg/l as NH4",
  "CHLORINE (FREE)": "mg/l as Cl2",
  "CHLORINE (TOTAL)": "mg/l as Cl2",
  "COLOUR LIQUID FILTERED": "mg/l pt/co",
  PH: "pH Units",
  TURBIDITY: "NTU",
  CONDUCTIVITY: "µS/cm",
  ...withUnit("no/100ml", [
    "E. COLI (CONFIRMED)", "COLIFORMS (CONFIRMED TOTAL)",
    "ENTEROCOCCI (CONFIRMED SPECIES)", "CLOSTRIDIA (CONFIRMED CLOS. PERFRINGENS)",
  ]),
  "TOTAL VIABLE COUNT (3 DAY AT 22C)": "number/ml",
  ...withUnit("diln. no.", ["ODOUR (QUANTITATIVE)", "TASTE (QUANTITATIVE)"]),
  ...withUnit("Bq/l", [
    "RADIOACTIVITY (GROSS ALPHA)", "RADIOACTIVITY (GROSS BETA)", "RADON", "TRITIUM",
  ]),
};

const STREAM_SOURCES: Record<string, StreamSource> = {
  "yorkshire-water": {
    orgId: "1WqkK5cDKUbF0CkH",
    services: [
      { year: 2026, serviceName: "Yorkshire Water Drinking Water Quality 2026" },
      { year: 2025, serviceName: "Yorkshire Water Drinking Water Quality 2025" },
      { year: 2024, serviceName: "Yorkshire Water Drinking Water Quality 2024" },
    ],
    geoField: "LSOA",
    fieldCase: "upper",
    dateFormat: "epoch",
  },
  "severn-trent": {
    orgId: STREAM_ORG,
    services: [
      // 2025 is published under a generic "Combined_Final" name that the
      // discovery filter never matches. Found by listing the org on 14 Sept 2026.
      { year: 2025, serviceName: "Combined_Final_Water_Quality_extract_2025_STW_Stream_formatted_1" },
      { year: 2024, serviceName: "Severn_Trent_Water_Domestic_Water_Quality_2024" },
      { year: 2023, serviceName: "Severn_Trent_Water_Domestic_Water_Quality_2023" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
  },
  "southern-water": {
    orgId: STREAM_ORG,
    services: [
      // Two parts of one 2022-2026 extract, samples through April 2026. Both
      // carry the same year so fetchStreamData merges them.
      { year: 2026, serviceName: "Southern_Water_Drinking_Water_Quality_2022_2026_part1" },
      { year: 2026, serviceName: "Southern_Water_Drinking_Water_Quality_2022_2026_part2" },
      { year: 2025, serviceName: "Southern_Water_Domestic_Drinking_Water_Quality_2025" },
      { year: 2024, serviceName: "Southern_Water_Domestic_Drinking_Water_Quality_2024" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
    unitFallback: SOUTHERN_UNIT_FALLBACK,
  },
  "united-utilities": {
    orgId: STREAM_ORG,
    services: [
      // Despite its name the "_2023" service holds samples to 31 Dec 2024, and
      // the undated one stops at 31 Dec 2022. Labelled 2025 it was tried first
      // and the site showed 2022 water for the whole North West.
      { year: 2024, serviceName: "United_Utilities_Domestic_Drinking_Water_Quality_2023" },
      { year: 2022, serviceName: "United_Utilities_Domestic_Water_Quality" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
  },
  "anglian-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2024, serviceName: "Anglian_Water_Domestic_Water_Quality_2024" },
      // Undated service: samples stop at October 2022.
      { year: 2022, serviceName: "Anglian_Water_Domestic_Water_Quality" },
    ],
    geoField: "LSOA21CD",
    fieldCase: "camel",
    dateFormat: "epoch",
  },
  "south-west-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2025, serviceName: "South_West_Water_(SWB)_Drinking_Water_Quality_2025" },
      { year: 2024, serviceName: "South_West_Water_(SWB)_Drinking_Water_Quality_2024" },
      { year: 2023, serviceName: "South_West_Water_(SWB)_Drinking_Water_Quality_2023" },
    ],
    geoField: "LSOA_Name",
    fieldCase: "upper",
    dateFormat: "epoch",
  },
  "portsmouth-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2024, serviceName: "Portsmouth_Water_Drinking_Water_Quality_Data_2022_2023_2024" },
    ],
    geoField: "LSOA",
    fieldCase: "upper",
    dateFormat: "epoch",
  },
  "welsh-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2024, serviceName: "Dwr_Cymru_Welsh_Water_Drinking_Water_Quality_2024" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
  },
  "northumbrian-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2024, serviceName: "Northumbrian_Water_Domestic_Water_Quality" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
  },
  // Essex & Suffolk Water is part of the Northumbrian group and publishes in
  // the same service; the LSOA filter keeps each district to its own rows.
  "essex-suffolk-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2024, serviceName: "Northumbrian_Water_Domestic_Water_Quality" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
  },
  // ── Companies added from Stream portal discovery ──
  "affinity-water": {
    orgId: STREAM_ORG,
    services: [
      // Affinity prefixes the year: "2025_Affinity_...". Samples through Sept 2025.
      { year: 2025, serviceName: "2025_Affinity_Water_Domestic_Water_Quality" },
      { year: 2024, serviceName: "2024_Affinity_Water_Domestic_Water_Quality" },
      { year: 2023, serviceName: "Affinity_Water_Domestic_Water_Quality" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
  },
  // south-east-water: NOT on Stream portal. Do not confuse with SES Water.
  "ses-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2025, serviceName: "SES_Water_Water_Quality_250515" },
    ],
    geoField: "lsoa21cd",
    fieldCase: "camel",
    dateFormat: "epoch",
  },
  "south-staffs-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2024, serviceName: "South_Staffs_Domestic_Water_Quality" },
    ],
    geoField: "LSOA",
    fieldCase: "upper",
    dateFormat: "string",
  },
  "cambridge-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2024, serviceName: "CAM_DomesticWaterQuality" },
    ],
    geoField: "LSOA",
    fieldCase: "upper",
    dateFormat: "string",
  },
  "hafren-dyfrdwy": {
    orgId: STREAM_ORG,
    services: [
      { year: 2025, serviceName: "Combined_Final_Water_Quality_extract_2025_HD_Stream_formatted_1" },
      { year: 2024, serviceName: "Hafren_Dyfrdwy_Domestic_Water_Quality_2024" },
      { year: 2023, serviceName: "Hafren_Dyfrdwy_Domestic_Water_Quality_2023" },
      { year: 2022, serviceName: "Hafren_Dyfrdwy_Domestic_Water_Quality" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
  },
};

export function getStreamSource(supplierId: string): StreamSource | null {
  return STREAM_SOURCES[supplierId] ?? null;
}

export function getAllStreamSupplierIds(): string[] {
  return Object.keys(STREAM_SOURCES);
}
