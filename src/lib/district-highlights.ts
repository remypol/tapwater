/**
 * What stands out about one postcode district's water.
 *
 * Every postcode page used to carry the same template sentence with different
 * numbers dropped in. That is what Google's scaled-content rules are written to
 * catch, and it is also useless to a reader: "scored 7.4 out of 10" means nothing
 * without knowing whether 7.4 is good for the city, for the country, or at all.
 *
 * This module turns the raw data into a short list of facts that are *selected*
 * per district, not merely filled in. A district that is the hardest in its city
 * gets told that. One whose nitrate sits at 80% of the legal limit gets told
 * that. One whose most recent sample is four years old gets told that first.
 * Two districts only read the same when their water genuinely is the same.
 *
 * Pure: no I/O, no dates read from the clock unless passed in.
 */
import type { PostcodeData, ContaminantReading } from "./types";
import type { HardnessReading } from "./data";
import type { PfasNearbySummary } from "./pfas-data";

export interface Highlight {
  /** Stable id so two facts of the same kind never both appear. */
  kind:
    | "stale"
    | "exceeded"
    | "near-limit"
    | "city-rank"
    | "national"
    | "hardness"
    | "neighbours"
    | "below-detection"
    | "pfas-nearby"
    | "coverage";
  /** How much this fact should be shown ahead of the others. */
  weight: number;
  /** The fact in one clause, bold on the page. Under ~70 characters. */
  lead: string;
  /** What it means for the reader, one sentence. */
  detail: string;
  /** Optional internal link that backs the fact up. */
  link?: { href: string; label: string };
}

export interface NeighbourScore {
  district: string;
  score: number;
}

export interface HighlightInput {
  data: PostcodeData;
  /** Scored districts in the same city, self included. */
  cityPeers: PostcodeData[];
  /** Nearby districts with a score, self excluded. */
  neighbours: NeighbourScore[];
  nationalAverage: number;
  hardness: HardnessReading | null;
  pfasNearby: PfasNearbySummary | null;
  cityName: string;
  /** Null when the city has no /city page to link to. */
  citySlug: string | null;
  /** Injected for tests. */
  now?: Date;
}

const ORDINALS = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];

export function ordinal(n: number): string {
  if (n > 0 && n < ORDINALS.length) return ORDINALS[n];
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

function formatValue(v: number): string {
  if (v >= 100) return Math.round(v).toLocaleString("en-GB");
  if (v >= 10) return (Math.round(v * 10) / 10).toString();
  if (v >= 1) return (Math.round(v * 100) / 100).toString();
  return v.toPrecision(2).replace(/\.?0+$/, "");
}

function ratioWords(ratio: number): string {
  if (ratio >= 10) return `${Math.round(ratio)} times`;
  if (ratio >= 2) return `${Math.round(ratio * 10) / 10} times`;
  return `${Math.round((ratio - 1) * 100)}% over`;
}

function monthYear(iso: string): string | null {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** "count/100ml" reads as a database field; "per 100 ml" reads as English. */
function unitWords(unit: string): string {
  const m = unit.match(/^(?:count|cfu|no\.?)\s*\/\s*(\d+)\s*ml$/i);
  if (m) return `per ${m[1]} ml`;
  return unit;
}

function limitOf(r: ContaminantReading): number | null {
  return r.ukLimit ?? r.whoGuideline;
}

// ── Individual facts ─────────────────────────────────────────────────────────

function staleFact(data: PostcodeData, now: Date): Highlight | null {
  const last = new Date(data.lastSampleDate);
  if (isNaN(last.getTime())) return null;
  const years = (now.getTime() - last.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (years < 2) return null;
  const whole = Math.floor(years);
  return {
    kind: "stale",
    weight: 100,
    lead: `The newest sample here is from ${monthYear(data.lastSampleDate)}`,
    detail: `That is over ${whole} year${whole === 1 ? "" : "s"} old, so treat this page as a record of past results rather than today's tap water.`,
  };
}

function exceededFact(data: PostcodeData): Highlight | null {
  // "warning" in scoring.ts means 75-100% of the limit: flagged, but not over.
  // Only a "fail" has actually exceeded it, and only that reads as "over".
  const fails = data.readings.filter((r) => r.status === "fail" && limitOf(r) !== null);
  const others = data.contaminantsFlagged - 1;
  const detail = others > 0
    ? `It is the furthest over its limit of the ${data.contaminantsFlagged} substances flagged here.`
    : `It is the only one of ${data.contaminantsTested} tested substances to go over its limit.`;
  const link = { href: "#what-we-found", label: "See the full results" };

  // Zero-tolerance substances (bacteria) have no ratio: any detection is a fail,
  // and "3 times the limit of 0" is nonsense, so they get their own sentence and
  // always outrank a numeric exceedance.
  const zeroTolerance = fails
    .filter((r) => limitOf(r) === 0 && r.value > 0)
    .sort((a, b) => b.value - a.value)[0];
  if (zeroTolerance) {
    return {
      kind: "exceeded",
      weight: 99,
      lead: `${zeroTolerance.name} detected at ${formatValue(zeroTolerance.value)} ${unitWords(zeroTolerance.unit)}, where any amount fails the legal standard`,
      detail: others > 0
        ? `Any detection is a failure for this substance. It is one of ${data.contaminantsFlagged} flagged here.`
        : `Any detection is a failure for this substance. It is the only one of ${data.contaminantsTested} tested to fail.`,
      link,
    };
  }

  const worst = fails
    .filter((r) => limitOf(r)! > 0)
    .map((r) => ({ r, ratio: r.value / limitOf(r)! }))
    .filter((x) => x.ratio > 1)
    .sort((a, b) => b.ratio - a.ratio)[0];
  if (!worst) return null;
  const { r, ratio } = worst;
  const isUk = r.ukLimit !== null;
  return {
    kind: "exceeded",
    weight: 90 + Math.min(ratio, 8),
    lead: `${r.name} was measured at ${formatValue(r.value)} ${r.unit}, ${ratioWords(ratio)} the ${isUk ? "UK limit" : "WHO guideline"}`,
    detail,
    link,
  };
}

function nearLimitFact(data: PostcodeData): Highlight | null {
  if (data.readings.some((r) => r.status === "fail")) return null;
  const closest = data.readings
    .filter((r) => r.status !== "fail" && r.ukLimit !== null && r.ukLimit > 0 && !r.belowDetectionLimit)
    .map((r) => ({ r, ratio: r.value / r.ukLimit! }))
    .filter((x) => x.ratio <= 1)
    .sort((a, b) => b.ratio - a.ratio)[0];
  if (!closest) return null;
  const pct = Math.round(closest.ratio * 100);
  if (closest.r.status === "warning") {
    return {
      kind: "near-limit",
      weight: 70 + pct / 5,
      lead: `${closest.r.name} is within its legal limit but flagged, at ${pct}% of the ${formatValue(closest.r.ukLimit!)} ${closest.r.unit} maximum`,
      detail: `Anything over three quarters of a limit is flagged here as worth watching. It has not gone over.`,
      link: { href: "#what-we-found", label: "See every reading" },
    };
  }
  if (pct < 40) {
    return {
      kind: "near-limit",
      weight: 30,
      lead: `Nothing tested came within 40% of its legal limit`,
      detail: `The highest was ${closest.r.name} at ${pct}% of the ${formatValue(closest.r.ukLimit!)} ${closest.r.unit} maximum.`,
      link: { href: "#what-we-found", label: "See every reading" },
    };
  }
  return {
    kind: "near-limit",
    weight: 50 + pct / 5,
    lead: `${closest.r.name} is the reading closest to its limit, at ${pct}% of the ${formatValue(closest.r.ukLimit!)} ${closest.r.unit} maximum`,
    detail:
      pct >= 75
        ? `It passed, but with less headroom than anything else tested here. Worth watching in the next round of results.`
        : `It passed with room to spare, and everything else tested sat further below its limit.`,
    link: { href: "#what-we-found", label: "See every reading" },
  };
}

function cityRankFact(input: HighlightInput): Highlight | null {
  const { data, cityPeers, cityName, citySlug } = input;
  const scored = cityPeers.filter((p) => p.safetyScore >= 0);
  if (scored.length < 3) return null;
  const sorted = [...scored].sort((a, b) => b.safetyScore - a.safetyScore || a.district.localeCompare(b.district));
  const rank = sorted.findIndex((p) => p.district === data.district) + 1;
  if (rank === 0) return null;
  const n = sorted.length;
  const link = citySlug ? { href: `/city/${citySlug}`, label: `Every area in ${cityName}` } : undefined;
  if (rank === 1) {
    return {
      kind: "city-rank",
      weight: 80,
      lead: `The cleanest tap water of the ${n} areas tested in ${cityName}`,
      detail: `${data.district} scores ${data.safetyScore} out of 10, ahead of ${sorted[1].district} in second place on ${sorted[1].safetyScore}.`,
      link,
    };
  }
  if (rank === n) {
    return {
      kind: "city-rank",
      weight: 85,
      lead: `The lowest score of the ${n} areas tested in ${cityName}`,
      detail: `${data.district} scores ${data.safetyScore} out of 10. The best in ${cityName}, ${sorted[0].district}, scores ${sorted[0].safetyScore}.`,
      link,
    };
  }
  const extremeness = Math.abs(rank / n - 0.5) * 2; // 0 middle, 1 edge
  return {
    kind: "city-rank",
    weight: 45 + extremeness * 25,
    lead: `${ordinal(rank)} cleanest of ${n} areas tested in ${cityName}`,
    detail:
      rank <= Math.ceil(n / 3)
        ? `Only ${rank - 1} area${rank - 1 === 1 ? "" : "s"} in ${cityName} scored higher. The best is ${sorted[0].district} on ${sorted[0].safetyScore}.`
        : rank > n - Math.ceil(n / 3)
          ? `${n - rank} area${n - rank === 1 ? "" : "s"} in ${cityName} scored lower. The best is ${sorted[0].district} on ${sorted[0].safetyScore}.`
          : `Squarely mid-table for ${cityName}, between ${sorted[0].district} on ${sorted[0].safetyScore} and ${sorted[n - 1].district} on ${sorted[n - 1].safetyScore}.`,
    link,
  };
}

function nationalFact(data: PostcodeData, nationalAverage: number): Highlight | null {
  if (nationalAverage <= 0) return null;
  const diff = data.safetyScore - nationalAverage;
  const avg = Math.round(nationalAverage * 10) / 10;
  if (Math.abs(diff) < 0.5) {
    return {
      kind: "national",
      weight: 20,
      lead: `Right on the national average of ${avg} out of 10`,
      detail: `Most of the country's tested districts land within half a point of ${data.district}.`,
      link: { href: "/compare", label: "Compare every area" },
    };
  }
  const pts = Math.round(Math.abs(diff) * 10) / 10;
  return {
    kind: "national",
    weight: 35 + Math.min(Math.abs(diff), 3) * 10,
    lead: diff > 0
      ? `${pts} point${pts === 1 ? "" : "s"} above the national average of ${avg}`
      : `${pts} point${pts === 1 ? "" : "s"} below the national average of ${avg}`,
    detail: diff > 0
      ? `Cleaner than the typical tested district in the UK.`
      : `Below the typical tested district in the UK, which is worth knowing before you choose a filter.`,
    link: { href: "/compare", label: "Compare every area" },
  };
}

function hardnessFact(data: PostcodeData, hardness: HardnessReading | null): Highlight | null {
  if (!hardness) return null;
  const v = Math.round(hardness.value);
  const where = hardness.estimated && hardness.estimatedFrom
    ? `across the ${hardness.estimatedFrom} postcode area`
    : `in ${data.district}`;
  const link = { href: "/hardness", label: "How hardness is measured" };
  // Same bands as hardnessLabelFor in data.ts, so this block never disagrees
  // with the hardness card above it: very hard from 250, hard from 180.
  if (v >= 300) {
    return {
      kind: "hardness",
      weight: 70,
      lead: `Among the hardest water in the country at ${v} mg/L`,
      detail: `Very hard starts at 250 mg/L. At this level kettles scale up within weeks and a softener is a normal purchase ${where}.`,
      link,
    };
  }
  if (v >= 250) {
    return {
      kind: "hardness",
      weight: 60,
      lead: `Very hard water at ${v} mg/L`,
      detail: `The threshold for very hard is 250 mg/L. Expect visible limescale on taps and in kettles ${where}.`,
      link,
    };
  }
  if (v >= 180) {
    return {
      kind: "hardness",
      weight: 55,
      lead: `Hard water at ${v} mg/L`,
      detail: `Hard starts at 180 mg/L, the point where a softener begins to pay for itself. Limescale will build up ${where}.`,
      link,
    };
  }
  if (v >= 120) {
    return {
      kind: "hardness",
      weight: 30,
      lead: `Moderately hard water at ${v} mg/L`,
      detail: `Some scale over time ${where}, but not enough to justify a softener for most homes.`,
      link,
    };
  }
  if (v >= 60) {
    return {
      kind: "hardness",
      weight: 30,
      lead: `Moderately soft water at ${v} mg/L`,
      detail: `Little limescale to speak of ${where}. A softener would be money wasted.`,
      link,
    };
  }
  return {
    kind: "hardness",
    weight: 50,
    lead: `Soft water at ${v} mg/L`,
    detail: `Limescale is not a problem ${where}, so skip softeners and scale filters entirely.`,
    link,
  };
}

function neighboursFact(data: PostcodeData, neighbours: NeighbourScore[]): Highlight | null {
  const others = neighbours.filter((n) => n.district !== data.district && n.score >= 0);
  if (others.length < 3) return null;
  const higher = others.filter((n) => n.score > data.safetyScore).length;
  const lower = others.filter((n) => n.score < data.safetyScore).length;
  const n = others.length;
  if (lower === n) {
    const best = [...others].sort((a, b) => b.score - a.score)[0];
    return {
      kind: "neighbours",
      weight: 60,
      lead: `Scores higher than all ${n} neighbouring districts`,
      detail: `The nearest rival is ${best.district} on ${best.score}, against ${data.safetyScore} here.`,
      link: { href: `/postcode/${best.district}`, label: `Compare with ${best.district}` },
    };
  }
  if (higher === n) {
    const best = [...others].sort((a, b) => b.score - a.score)[0];
    return {
      kind: "neighbours",
      weight: 65,
      lead: `Every one of the ${n} neighbouring districts scores higher`,
      detail: `${best.district} next door scores ${best.score}, against ${data.safetyScore} here. Supply zones, not distance, explain the gap.`,
      link: { href: `/postcode/${best.district}`, label: `See ${best.district}` },
    };
  }
  return {
    kind: "neighbours",
    weight: 25,
    lead: `Scores higher than ${lower} of ${n} neighbouring districts`,
    detail: `Water here is typical for the immediate area, which usually means the same treatment works and the same supply zone.`,
  };
}

function belowDetectionFact(data: PostcodeData): Highlight | null {
  const bdl = data.readings.filter((r) => r.belowDetectionLimit).length;
  if (bdl < 3 || data.contaminantsTested === 0) return null;
  const pct = Math.round((bdl / data.contaminantsTested) * 100);
  if (pct < 40) return null;
  return {
    kind: "below-detection",
    weight: 28 + pct / 5,
    lead: `${bdl} of ${data.contaminantsTested} tested substances were too low for the lab to detect`,
    detail: `Below detection does not mean zero, but it does mean less than the smallest amount the method can measure.`,
    link: { href: "#what-we-found", label: "Which ones" },
  };
}

function pfasNearbyFact(data: PostcodeData, pfas: PfasNearbySummary | null): Highlight | null {
  if (!pfas) return null;
  const onPage = data.pfasDetected && data.pfasLevel != null;
  return {
    kind: "pfas-nearby",
    weight: onPage ? 20 : 40,
    lead: `PFAS found at ${pfas.samplingPointCount} monitoring site${pfas.samplingPointCount === 1 ? "" : "s"} within ${pfas.radiusKm} km`,
    detail: `Those are river and groundwater samples, not tap water. The highest was ${pfas.highest.compound} about ${pfas.highest.distanceKm} km away.`,
    link: { href: "#pfas-nearby", label: "What was measured" },
  };
}

function coverageFact(data: PostcodeData): Highlight | null {
  if (data.contaminantsTested === 0) return null;
  const from = data.dateRange?.from ? monthYear(data.dateRange.from) : null;
  const to = data.dateRange?.to ? monthYear(data.dateRange.to) : null;
  const span = from && to && from !== to ? ` between ${from} and ${to}` : to ? ` up to ${to}` : "";
  return {
    kind: "coverage",
    weight: 10,
    lead: data.sampleCount > 0
      ? `${data.contaminantsTested} substances checked across ${data.sampleCount.toLocaleString("en-GB")} samples`
      : `${data.contaminantsTested} substances checked`,
    detail: `Results were collected${span}${data.supplier && data.supplier !== "Unknown" ? ` by ${data.supplier}` : ""}.`,
  };
}

// ── Selection ────────────────────────────────────────────────────────────────

/**
 * The three facts most worth telling this district. Deterministic for a given
 * input, so the page and its meta description agree.
 */
export function districtHighlights(input: HighlightInput, limit = 3): Highlight[] {
  const { data } = input;
  if (data.safetyScore < 0) return [];
  const now = input.now ?? new Date();

  const candidates = [
    staleFact(data, now),
    exceededFact(data),
    nearLimitFact(data),
    cityRankFact(input),
    nationalFact(data, input.nationalAverage),
    hardnessFact(data, input.hardness),
    neighboursFact(data, input.neighbours),
    belowDetectionFact(data),
    pfasNearbyFact(data, input.pfasNearby),
    coverageFact(data),
  ].filter((h): h is Highlight => h !== null);

  return candidates.sort((a, b) => b.weight - a.weight).slice(0, limit);
}

/**
 * A meta description that is different for every district because it carries
 * the district's top fact, kept inside Google's ~155 character display.
 */
export function highlightDescription(
  data: PostcodeData,
  highlights: Highlight[],
  year: number,
): string {
  const lead = highlights[0]?.lead;
  const opener = `${data.district} tap water (${data.areaName})`;
  const base = lead
    ? `${opener}. ${lead}.`
    : `${opener}: ${data.contaminantsTested} substances tested, scored ${data.safetyScore}/10.`;
  const tail = ` Free ${year} report.`;
  if (base.length + tail.length <= 155) return base + tail;
  if (base.length <= 155) return base;
  return `${base.slice(0, 152).replace(/[\s,;:]+\S*$/, "")}…`;
}
