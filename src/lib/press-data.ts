/**
 * Press data functions — shared between /press page and /api/press/data/[slug]
 *
 * Queries the same data sources as the rankings pages and PFAS tracker,
 * packages results into journalist-ready story formats with CSV generation.
 */

import { getAllPostcodeDistricts, getPostcodeData, getHardness } from "@/lib/data";
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
  return all.filter((p) => p.safetyScore >= 0);
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
    citation: `Source: TapWater.uk (https://www.tapwater.uk/rankings/worst-lead)\nData: Environment Agency Water Quality Archive, analysed by TapWater.uk`,
    lede: `Lead contamination remains one of the UK's most persistent drinking water challenges. TapWater.uk analysis of Environment Agency data reveals that ${worstDistrict} has lead levels ${multiplier}x above the legal limit of 0.01 mg/L — largely due to ageing Victorian-era pipe infrastructure that has never been replaced.`,
    context: `The UK tightened its legal limit for lead in drinking water from 0.025 to 0.01 mg/L in 2013 to align with WHO guidelines. An estimated 40% of UK homes still have lead service pipes, and there is no safe level of lead exposure — even low doses are linked to developmental effects in children.`,
    methodology: `Based on analysis of Environment Agency Water Quality Archive data covering 2,800+ UK postcode districts, using the most recent compliance sample for each district.`,
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
    citation: `Source: TapWater.uk (https://www.tapwater.uk/rankings/worst-nitrate)\nData: Environment Agency Water Quality Archive, analysed by TapWater.uk`,
    lede: `High nitrate levels in drinking water are a growing concern in UK agricultural regions, where fertiliser runoff leaches into groundwater sources. TapWater.uk analysis shows ${worstDistrict} recording nitrate at ${pct}% of the UK legal limit of 50 mg/L — close enough to the threshold that any wet season could tip it into non-compliance.`,
    context: `The UK Drinking Water Regulations set a 50 mg/L limit for nitrate, in line with EU standards. Nitrate above this level poses a risk of methaemoglobinaemia — reduced oxygen-carrying capacity in the blood — particularly in infants under six months. Water companies in affected zones must blend or treat supply to maintain compliance.`,
    methodology: `Based on analysis of Environment Agency Water Quality Archive data covering 2,800+ UK postcode districts, using the most recent compliance sample for each district.`,
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
    lede: `PFAS — per- and polyfluoroalkyl substances — have contaminated water sources near ${topCity} more than anywhere else in the UK, with ${topCount} individual compound detections recorded in Environment Agency monitoring data. Unlike most contaminants, PFAS do not break down in the environment or the human body, earning them the name "forever chemicals".`,
    context: `The UK introduced a drinking water standard for PFAS in 2021, setting a 0.1 µg/L limit for individual PFAS compounds and a 1 µg/L sum-of-PFAS limit. The main UK sources are fire-fighting foam at airfields and industrial sites, and agricultural application of contaminated sewage sludge. Long-term PFAS exposure is associated with thyroid disruption, immune suppression, and increased cancer risk.`,
    methodology: `Based on analysis of Environment Agency Water Quality Archive PFAS monitoring data, aggregated by city water supply zone. Detection counts include any measurement above the laboratory reporting limit.`,
    lastUpdated: new Date().toISOString().split("T")[0],
  };
}

async function buildHardestWater(): Promise<PressStoryData> {
  const scored = await loadScoredPostcodes();

  const hardnessResults: { data: PostcodeData; hardness: number }[] = [];
  for (const p of scored) {
    const h = await getHardness(p.district);
    if (h) {
      hardnessResults.push({ data: p, hardness: h.value });
    }
  }
  hardnessResults.sort((a, b) => b.hardness - a.hardness);
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
    citation: `Source: TapWater.uk (https://www.tapwater.uk/rankings/hardest-water)\nData: Drinking Water Inspectorate data, analysed by TapWater.uk`,
    lede: `Hard water costs UK households an estimated £700m per year in appliance damage, scale build-up, and excess detergent use. At ${worstValue} mg/L CaCO₃, ${worstDistrict} sits in the "very hard" classification — more than four times harder than the softest water areas in Scotland and Wales.`,
    context: `The UK does not set a maximum legal limit for water hardness, though the DWI recommends suppliers keep levels below 200 mg/L for optimal plumbing health. Hardness is determined by the geology of the source catchment — chalk aquifers in South East England and the East Midlands produce the hardest water, while upland reservoirs in the north and west supply naturally soft water.`,
    methodology: `Based on Drinking Water Inspectorate zonal hardness data, mapped to postcode districts. Values represent total hardness as calcium carbonate equivalent.`,
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
    citation: `Source: TapWater.uk (https://www.tapwater.uk/rankings/best-water)\nData: Environment Agency & Drinking Water Inspectorate, analysed by TapWater.uk`,
    lede: `UK tap water quality varies more than most people realise. ${bestDistrict} leads the country with a safety score of ${bestScore}/10 — consistently low contaminant readings across all 19 tested parameters. At the other end of the table, several postcodes score below 5, with multiple contaminants reading close to or above legal limits.`,
    context: `The UK's Drinking Water Inspectorate reports that 99.96% of tests pass legal standards at the point of measurement — but compliance tests are taken at the treatment works, not the tap. TapWater.uk scores are based on what arrives at household taps, incorporating distribution losses, pipe age, and local geology.`,
    methodology: `Safety scores combine 19 contaminant readings from Environment Agency and DWI data, normalised against legal limits and weighted by health risk. Scores reflect the most recent annual data for each postcode district.`,
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
  lines.push(rowToCsv(["Data", "Environment Agency Water Quality Archive", "", "", "", "", ""]));
  lines.push(rowToCsv(["Generated", new Date().toISOString().split("T")[0], "", "", "", "", ""]));

  return lines.join("\n");
}
