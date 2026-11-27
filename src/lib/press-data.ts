/**
 * Press data functions — shared between /press page and /api/press/data/[slug]
 *
 * Queries the same data sources as the rankings pages and PFAS tracker,
 * packages results into journalist-ready story formats with CSV generation.
 */

import { getAllPostcodeDistricts, getPostcodeData, getHardness, isRankable } from "@/lib/data";
import { getPfasNationalSummary } from "@/lib/pfas-data";
import type { PostcodeData } from "@/lib/types";

// ── Types ──

export interface PressEntry {
  rank: number;
  label: string;     // postcode district or city name
  location: string;  // area/city description
  value: string;     // formatted value with unit
  rawValue: number;
  link: string;      // detail page link
}

export interface PressStoryData {
  slug: string;
  headline: string;
  keyStat: string;
  keyStatLabel: string;
  entries: PressEntry[];
  rankingsLink: string;
  csvHeaders: string[];
  citation: string;
  lede: string;
  context: string;
  methodology: string;
  lastUpdated: string;
}

// ── Story config ──

const STORY_CONFIG: Record<string, { headline: string; rankingsLink: string }> = {
  "worst-lead": {
    headline: "The 10 UK Postcodes With the Highest Lead Levels",
    rankingsLink: "/rankings/worst-lead",
  },
  "worst-nitrate": {
    headline: "The 10 UK Postcodes With the Highest Nitrate Levels",
    rankingsLink: "/rankings/worst-nitrate",
  },
  "most-pfas": {
    headline: "The UK Cities With the Most PFAS Detections",
    rankingsLink: "/pfas",
  },
  "hardest-water": {
    headline: "The 10 Hardest Water Areas in the UK",
    rankingsLink: "/rankings/hardest-water",
  },
  "best-worst-overall": {
    headline: "The Best and Worst Tap Water in the UK",
    rankingsLink: "/rankings/best-water",
  },
};

export const PRESS_SLUGS = Object.keys(STORY_CONFIG);

// ── Helper: load all scored postcodes once ──

async function loadScoredPostcodes(): Promise<PostcodeData[]> {
  const districts = await getAllPostcodeDistricts();
  const all = (await Promise.all(districts.map((d) => getPostcodeData(d)))).filter(
    Boolean
  ) as PostcodeData[];
  // Press stories hand journalists a ready-made citation naming a postcode and its
  // water company, so only districts that can carry that claim belong here.
  return all.filter(isRankable);
}

// ── Per-slug data builders ──

async function buildWorstLead(): Promise<PressStoryData> {
  const scored = await loadScoredPostcodes();
  const contaminantName = "lead";

  const withReading: { data: PostcodeData; value: number }[] = [];
  for (const p of scored) {
    const match = p.readings.find((r) => r.name.toLowerCase().includes(contaminantName));
    if (match && match.value > 0) {
      withReading.push({ data: p, value: match.value });
    }
  }
  withReading.sort((a, b) => b.value - a.value);
  const top10 = withReading.slice(0, 10);

  const worst = top10[0];
  const limitValue = 0.01;
  const multiplier = worst ? (worst.value / limitValue).toFixed(1) : "—";
  const worstDistrict = worst?.data.district ?? "—";

  const entries: PressEntry[] = top10.map((item, i) => ({
    rank: i + 1,
    label: item.data.district,
    location: `${item.data.areaName}, ${item.data.city}`,
    value: `${parseFloat(item.value.toPrecision(4))} mg/L`,
    rawValue: item.value,
    link: `/postcode/${item.data.district}`,
  }));

  return {
    slug: "worst-lead",
    headline: STORY_CONFIG["worst-lead"].headline,
    keyStat: multiplier,
    keyStatLabel: `${worstDistrict} lead level vs UK legal limit`,
    entries,
    rankingsLink: STORY_CONFIG["worst-lead"].rankingsLink,
    csvHeaders: ["Rank", "Postcode", "Area", "City", "Lead (mg/L)", "UK Limit (mg/L)", "Ratio to Limit"],
    citation: `Source: TapWater.uk (https://www.tapwater.uk/rankings/worst-lead)\nData: UK water company compliance testing via the Stream Water Data Portal, analysed by TapWater.uk`,
    // No causal claim here. Attributing a reading to "Victorian-era pipes that have
    // never been replaced" is not something a compliance sample can show, and this
    // text is handed to journalists as a ready-made citation.
    lede: `Lead contamination remains one of the UK's most persistent drinking water challenges. TapWater.uk analysis of water company compliance data reveals that ${worstDistrict} recorded lead at ${multiplier}x the legal limit of 0.01 mg/L in its most recent sample.`,
    context: `The UK tightened its legal limit for lead in drinking water from 0.025 to 0.01 mg/L in 2013 to align with WHO guidelines. Homes built before 1970 can still have lead pipes between the street and the tap, and no level of lead exposure is known to be safe, particularly for children.`,
    methodology: `Based on water company compliance testing published via the Stream Water Data Portal, covering ${scored.length.toLocaleString("en-GB")} UK postcode districts with drinking water results sampled in the last three years. Districts with fewer than five measured parameters, or with only environmental river and groundwater monitoring, are excluded. Uses the most recent sample for each district.`,
    lastUpdated: new Date().toISOString().split("T")[0],
  };
}

async function buildWorstNitrate(): Promise<PressStoryData> {
  const scored = await loadScoredPostcodes();
  const contaminantName = "nitrate";

  const withReading: { data: PostcodeData; value: number }[] = [];
  for (const p of scored) {
    const match = p.readings.find((r) => r.name.toLowerCase().includes(contaminantName));
    if (match && match.value > 0) {
      withReading.push({ data: p, value: match.value });
    }
  }
  withReading.sort((a, b) => b.value - a.value);
  const top10 = withReading.slice(0, 10);

  const worst = top10[0];
  const limitValue = 50;
  const pct = worst ? Math.round((worst.value / limitValue) * 100) : 0;
  const worstDistrict = worst?.data.district ?? "—";

  const entries: PressEntry[] = top10.map((item, i) => ({
    rank: i + 1,
    label: item.data.district,
    location: `${item.data.areaName}, ${item.data.city}`,
    value: `${parseFloat(item.value.toPrecision(4))} mg/L`,
    rawValue: item.value,
    link: `/postcode/${item.data.district}`,
  }));

  return {
    slug: "worst-nitrate",
    headline: STORY_CONFIG["worst-nitrate"].headline,
    keyStat: `${pct}%`,
    keyStatLabel: `${worstDistrict} nitrate as % of UK legal limit`,
    entries,
    rankingsLink: STORY_CONFIG["worst-nitrate"].rankingsLink,
    csvHeaders: ["Rank", "Postcode", "Area", "City", "Nitrate (mg/L)", "UK Limit (mg/L)", "% of Limit"],
    citation: `Source: TapWater.uk (https://www.tapwater.uk/rankings/worst-nitrate)\nData: UK water company compliance testing via the Stream Water Data Portal, analysed by TapWater.uk`,
    // "any wet season could tip it into non-compliance" was a forecast, not a finding.
    lede: `High nitrate levels in drinking water are a growing concern in UK agricultural regions, where fertiliser runoff leaches into groundwater sources. TapWater.uk analysis shows ${worstDistrict} recording nitrate at ${pct}% of the UK legal limit of 50 mg/L in its most recent sample.`,
    context: `The UK Drinking Water Regulations set a 50 mg/L limit for nitrate, in line with EU standards. Nitrate above this level poses a risk of methaemoglobinaemia — reduced oxygen-carrying capacity in the blood — particularly in infants under six months. Water companies in affected zones must blend or treat supply to maintain compliance.`,
    methodology: `Based on water company compliance testing published via the Stream Water Data Portal, covering ${scored.length.toLocaleString("en-GB")} UK postcode districts with drinking water results sampled in the last three years. Districts with fewer than five measured parameters, or with only environmental river and groundwater monitoring, are excluded. Uses the most recent sample for each district.`,
    lastUpdated: new Date().toISOString().split("T")[0],
  };
}

async function buildMostPfas(): Promise<PressStoryData> {
  const summary = await getPfasNationalSummary();

  const cities = summary
    ? [...summary.detectionsByCity].sort((a, b) => b.detectionCount - a.detectionCount).slice(0, 10)
    : [];

  const top = cities[0];
  const topCity = top?.city ?? "—";
  const topCount = top?.detectionCount ?? 0;

  const entries: PressEntry[] = cities.map((c, i) => ({
    rank: i + 1,
    label: c.city,
    location: c.region,
    value: `${c.detectionCount} detections`,
    rawValue: c.detectionCount,
    link: `/pfas/${c.slug}`,
  }));

  return {
    slug: "most-pfas",
    headline: STORY_CONFIG["most-pfas"].headline,
    keyStat: String(topCount),
    keyStatLabel: `PFAS detections near ${topCity}`,
    entries,
    rankingsLink: STORY_CONFIG["most-pfas"].rankingsLink,
    csvHeaders: ["Rank", "City", "Region", "PFAS Detections", "Compounds Found", "Highest Level (µg/L)"],
    citation: `Source: TapWater.uk (https://www.tapwater.uk/pfas)\nData: Environment Agency Water Quality Archive, analysed by TapWater.uk`,
    lede: `Environment Agency monitoring has recorded more PFAS detections near ${topCity} than near any other UK city: ${topCount}, in river and groundwater samples. These are environmental samples, not tap water. PFAS break down so slowly in the environment and the body that they are called "forever chemicals".`,
    context: `England and Wales have no statutory standard for PFAS in tap water. The Drinking Water Inspectorate's guidance sets 0.1 µg/L for the sum of 48 named PFAS, and since March 2025 asks water companies to monitor a wider range. Those tap-water results are not published by area. Main sources in the UK include fire-fighting foam at airfields and industrial sites. Some PFAS are linked in studies to effects on the thyroid, the immune system and certain cancers.`,
    methodology: `Based on analysis of Environment Agency Water Quality Archive PFAS monitoring data, counted for the sampling points within the area of each city's page (near the city, not inside a boundary). A detection is any measurement above the laboratory reporting limit; one reading is one sample on one day.`,
    lastUpdated: new Date().toISOString().split("T")[0],
  };
}

async function buildHardestWater(): Promise<PressStoryData> {
  const scored = await loadScoredPostcodes();

  const hardnessResults: { data: PostcodeData; hardness: number }[] = [];
  for (const p of scored) {
    const h = await getHardness(p.district);
    // Only a district's own figure: an area median is not something a paper can print for one town.
    if (h && !h.estimated) {
      hardnessResults.push({ data: p, hardness: h.value });
    }
  }
  hardnessResults.sort((a, b) => b.hardness - a.hardness);
  const softest = hardnessResults[hardnessResults.length - 1];
  const times = softest && softest.hardness > 0 ? Math.round(hardnessResults[0].hardness / softest.hardness) : null;
  const top10 = hardnessResults.slice(0, 10);

  const worst = top10[0];
  const worstDistrict = worst?.data.district ?? "—";
  const worstValue = worst?.hardness ?? 0;

  const entries: PressEntry[] = top10.map((item, i) => ({
    rank: i + 1,
    label: item.data.district,
    location: `${item.data.areaName}, ${item.data.city}`,
    value: `${item.hardness} mg/L CaCO₃`,
    rawValue: item.hardness,
    link: `/postcode/${item.data.district}`,
  }));

  return {
    slug: "hardest-water",
    headline: STORY_CONFIG["hardest-water"].headline,
    keyStat: `${worstValue}`,
    keyStatLabel: `${worstDistrict} hardness (mg/L CaCO₃)`,
    entries,
    rankingsLink: STORY_CONFIG["hardest-water"].rankingsLink,
    csvHeaders: ["Rank", "Postcode", "Area", "City", "Hardness (mg/L CaCO3)", "Classification"],
    citation: `Source: TapWater.uk (https://www.tapwater.uk/rankings/hardest-water)\nData: hardness figures published by each water company, compiled by TapWater.uk`,
    lede: `${worstDistrict} (${worst?.data.areaName ?? ""}) has the hardest tap water of the ${hardnessResults.length.toLocaleString("en-GB")} UK postcode districts with a hardness figure from their water company: ${worstValue} mg/L as calcium carbonate.${times && softest ? ` That is ${times} times the ${softest.hardness} mg/L of ${softest.data.district} (${softest.data.areaName}).` : ""}`,
    context: `Hard water is not a health risk and has no legal limit. It is a cost: scale on kettles, taps and boiler heat exchangers. Above 200 mg/L, Approved Document L of the Building Regulations asks for scale protection when a new combination boiler is fitted. Hardness comes from the rock the water passes through: chalk and limestone in eastern and southern England give the hardest water, upland reservoirs in Wales, Scotland and the north-west the softest.`,
    methodology: `Each water company's own published hardness for the supply zone serving the district, from its postcode checker or its open data on the Stream Water Data Portal, collected by TapWater.uk and re-checked against the companies' checkers on 27 November 2026. Where a district spans several supply zones, the figure is for the postcode nearest its centre. Districts without their own figure are left out.`,
    lastUpdated: new Date().toISOString().split("T")[0],
  };
}

async function buildBestWorstOverall(): Promise<PressStoryData> {
  const scored = await loadScoredPostcodes();
  const sorted = [...scored].sort((a, b) => b.safetyScore - a.safetyScore);

  const top10 = sorted.slice(0, 10);
  const bottom10 = sorted.slice(-10).reverse();

  const bestDistrict = top10[0]?.district ?? "—";
  const bestScore = top10[0]?.safetyScore.toFixed(1) ?? "—";

  const bestEntries: PressEntry[] = top10.map((p, i) => ({
    rank: i + 1,
    label: p.district,
    location: `${p.areaName}, ${p.city}`,
    value: `${p.safetyScore.toFixed(1)}/10`,
    rawValue: p.safetyScore,
    link: `/postcode/${p.district}`,
  }));

  const worstEntries: PressEntry[] = bottom10.map((p, i) => ({
    rank: i + 1,
    label: p.district,
    location: `${p.areaName}, ${p.city}`,
    value: `${p.safetyScore.toFixed(1)}/10`,
    rawValue: p.safetyScore,
    link: `/postcode/${p.district}`,
  }));

  // Combine: best first, then worst (marked in location field)
  const entries: PressEntry[] = [
    ...bestEntries.map((e) => ({ ...e, location: `BEST — ${e.location}` })),
    ...worstEntries.map((e) => ({ ...e, location: `WORST — ${e.location}` })),
  ];

  return {
    slug: "best-worst-overall",
    headline: STORY_CONFIG["best-worst-overall"].headline,
    keyStat: `${bestScore}/10`,
    keyStatLabel: `${bestDistrict} — UK's highest safety score`,
    entries,
    rankingsLink: STORY_CONFIG["best-worst-overall"].rankingsLink,
    csvHeaders: ["Rank", "Postcode", "Area", "City", "Safety Score (/10)", "Category"],
    citation: `Source: TapWater.uk (https://www.tapwater.uk/rankings/best-water)\nData: water company drinking-water test results, analysed by TapWater.uk`,
    lede: `UK tap water quality varies more than most people realise. ${bestDistrict} leads the country with a safety score of ${bestScore}/10 — with low readings across the parameters tested. At the other end of the table, several postcodes score below 5, with multiple contaminants reading close to or above legal limits.`,
    context: `The Drinking Water Inspectorate reports that 99.97% of tests in England met the legal standards in 2025. That is one figure for the whole country; TapWater.uk scores each postcode district from the test results published for that area, so the differences between places show.`,
    methodology: `Scores combine the drinking-water test results each water company publishes for the district (through the Stream Water Data Portal and its own site), compared with legal limits and weighted by health risk. River and groundwater monitoring does not count towards a score.`,
    lastUpdated: new Date().toISOString().split("T")[0],
  };
}

// ── Public API ──

export async function getStoryData(slug: string): Promise<PressStoryData | null> {
  switch (slug) {
    case "worst-lead":        return buildWorstLead();
    case "worst-nitrate":     return buildWorstNitrate();
    case "most-pfas":         return buildMostPfas();
    case "hardest-water":     return buildHardestWater();
    case "best-worst-overall": return buildBestWorstOverall();
    default:                  return null;
  }
}

export async function getAllStoryData(): Promise<PressStoryData[]> {
  const results = await Promise.all(PRESS_SLUGS.map((s) => getStoryData(s)));
  return results.filter(Boolean) as PressStoryData[];
}

// ── CSV generation ──

function escapeCsv(val: string | number): string {
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowToCsv(cells: (string | number)[]): string {
  return cells.map(escapeCsv).join(",");
}

export async function getStoryCsv(slug: string): Promise<string | null> {
  const story = await getStoryData(slug);
  if (!story) return null;

  const lines: string[] = [];
  lines.push(rowToCsv(story.csvHeaders));

  if (slug === "worst-lead") {
    for (const e of story.entries) {
      const ratio = (e.rawValue / 0.01).toFixed(2);
      lines.push(rowToCsv([e.rank, e.label, e.location.split(", ")[0], e.location.split(", ")[1] ?? "", e.rawValue, 0.01, ratio]));
    }
  } else if (slug === "worst-nitrate") {
    for (const e of story.entries) {
      const pct = ((e.rawValue / 50) * 100).toFixed(1) + "%";
      lines.push(rowToCsv([e.rank, e.label, e.location.split(", ")[0], e.location.split(", ")[1] ?? "", e.rawValue, 50, pct]));
    }
  } else if (slug === "most-pfas") {
    const summary = await getPfasNationalSummary();
    const cityMap = new Map(
      (summary?.detectionsByCity ?? []).map((c) => [c.city, c])
    );
    for (const e of story.entries) {
      const cityData = cityMap.get(e.label);
      lines.push(rowToCsv([
        e.rank, e.label, e.location,
        e.rawValue,
        cityData?.compoundsFound ?? "",
        cityData?.highestLevel?.toFixed(4) ?? "",
      ]));
    }
  } else if (slug === "hardest-water") {
    const classifications: Record<string, string> = {};
    for (const e of story.entries) {
      const v = e.rawValue;
      classifications[e.label] = v < 60 ? "Soft" : v < 120 ? "Moderately soft" : v < 180 ? "Moderately hard" : v < 250 ? "Hard" : "Very hard";
    }
    for (const e of story.entries) {
      lines.push(rowToCsv([e.rank, e.label, e.location.split(", ")[0], e.location.split(", ")[1] ?? "", e.rawValue, classifications[e.label]]));
    }
  } else if (slug === "best-worst-overall") {
    for (const e of story.entries) {
      const category = e.location.startsWith("BEST") ? "Best" : "Worst";
      const cleanLocation = e.location.replace(/^(BEST|WORST) — /, "");
      const parts = cleanLocation.split(", ");
      lines.push(rowToCsv([e.rank, e.label, parts[0], parts[1] ?? "", e.rawValue.toFixed(1), category]));
    }
  }

  // Footer attribution rows
  lines.push("");
  lines.push(rowToCsv(["Source", "TapWater.uk", "https://www.tapwater.uk", "", "", "", ""]));
  const DATA_SOURCE: Record<string, string> = {
    "most-pfas": "Environment Agency Water Quality Archive (river and groundwater samples, not tap water)",
    "hardest-water": "Hardness figures published by each water company",
  };
  lines.push(rowToCsv(["Data", DATA_SOURCE[slug] ?? "Water company drinking-water test results (Stream Water Data Portal)", "", "", "", "", ""]));
  lines.push(rowToCsv(["Generated", new Date().toISOString().split("T")[0], "", "", "", "", ""]));

  return lines.join("\n");
}
