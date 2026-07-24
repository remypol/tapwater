/**
 * EA Water Quality API client for TapWater.uk
 *
 * Fetches environmental water quality data from the Environment Agency.
 * Used by the pipeline batch handler to populate Supabase.
 */

// ── Sampling point types that measure water quality ──

const WATER_POINT_TYPES = [
  "F6", // FRESHWATER - RIVERS
  "FA", // FRESHWATER - LAKES/PONDS/RESERVOIRS
  "FL", // FRESHWATER - BATHING WATER
  "FB", // FRESHWATER - CANALS
  "BA", // GROUNDWATER - BOREHOLE
  "BB", // GROUNDWATER - SPRING
];

const WATER_UNITS = new Set([
  "mg/l", "ug/l", "µg/l", "ng/l",
  "phunits", "ph",
  "ntu", "ftu",
  "cel", "°c",
  "us/cm", "µs/cm", "ms/cm",
  "no/100ml", "cfu/100ml", "count/100ml",
  "hazen",
]);

function isWaterUnit(unit: string): boolean {
  const lower = unit.toLowerCase().trim();
  return [...WATER_UNITS].some((wu) => lower.startsWith(wu) || lower.includes("/l"));
}

// ── Types ──

export interface PostcodeInfo {
  district: string;
  areaName: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
}

export interface SamplingPoint {
  id: string;
  label: string;
  type: string;
  typeNotation: string;
}

export interface Observation {
  determinand: string;
  determinandNotation: string;
  value: number;
  unit: string;
  sampleDate: string;
}

export interface PostcodeSeedData {
  district: string;
  areaName: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  samplingPointCount: number;
  recentObservations: number;
  pfasDetected: boolean;
  topReadings: {
    determinand: string;
    value: number;
    unit: string;
    date: string;
    samplingPoint: string;
  }[];
}

// ── postcodes.io ──

export async function lookupPostcode(district: string): Promise<PostcodeInfo | null> {
  const url = `https://api.postcodes.io/outcodes/${encodeURIComponent(district)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const r = data.result;
    if (!r) return null;

    return {
      district: r.outcode,
      areaName: r.admin_district?.[0] ?? r.admin_county?.[0] ?? district,
      city: r.admin_district?.[0] ?? "",
      region: r.region?.[0] ?? r.country?.[0] ?? "England",
      latitude: r.latitude,
      longitude: r.longitude,
    };
  } catch {
    return null;
  }
}

// ── EA Water Quality API ──

const EA_BASE = "https://environment.data.gov.uk/water-quality";

export async function fetchWaterSamplingPoints(
  lat: number,
  lng: number,
): Promise<SamplingPoint[]> {
  const allPoints: SamplingPoint[] = [];
  const seenIds = new Set<string>();

  for (const radius of [5, 10]) {
    for (const typeCode of WATER_POINT_TYPES) {
      const url = `${EA_BASE}/sampling-point?latitude=${lat}&longitude=${lng}&radius=${radius}&limit=10&samplingPointType=${typeCode}`;
      try {
        const res = await fetch(url, {
          headers: { Accept: "application/ld+json" },
        });
        if (!res.ok) continue;
        const data = await res.json();
        const members = (data.member ?? []) as Record<string, unknown>[];

        for (const sp of members) {
          const id = String(sp.notation ?? "");
          if (seenIds.has(id)) continue;
          seenIds.add(id);

          const spt = sp.samplingPointType as Record<string, unknown> | undefined;
          allPoints.push({
            id,
            label: String(sp.prefLabel ?? sp.altLabel ?? sp.notation ?? ""),
            type: spt ? String(spt.prefLabel ?? "") : "",
            typeNotation: spt ? String(spt.notation ?? "") : "",
          });
        }
      } catch {
        // Skip failed requests
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    if (allPoints.length >= 3) break;
  }

  return allPoints;
}

/**
 * The EA collection endpoint returns observations OLDEST FIRST and offers no sort
 * parameter, so a plain `?limit=n` hands back the first readings ever taken at that
 * point. On SO-E0000957 that is January 2000, while the same point has readings from
 * last month — and the site published the 2000 figures as current water quality.
 *
 * `?minyear=` is not accepted here (the API answers 400), so the only way to reach
 * the recent end is to page to it: read `totalItems`, then skip to the tail. The
 * count comes from a `limit=1` probe, which is a ~1KB response.
 */
async function fetchObservationCount(pointId: string): Promise<number | null> {
  try {
    const res = await fetch(
      `${EA_BASE}/sampling-point/${encodeURIComponent(pointId)}/observation?limit=1`,
      { headers: { Accept: "application/ld+json" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const total = data?.totalItems;
    return typeof total === "number" && total >= 0 ? total : null;
  } catch {
    return null;
  }
}

export async function fetchRecentObservations(
  pointId: string,
  limit = 100,
): Promise<Observation[]> {
  const total = await fetchObservationCount(pointId);
  // Unknown count: fall back to the first page rather than fetching nothing. Those
  // readings are stale, but the staleness warning on the page still tells the truth.
  const skip = total !== null && total > limit ? total - limit : 0;

  const url =
    `${EA_BASE}/sampling-point/${encodeURIComponent(pointId)}/observation` +
    `?limit=${limit}${skip > 0 ? `&skip=${skip}` : ""}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/ld+json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const members = (data.member ?? []) as Record<string, unknown>[];

    return members
      .map((obs) => {
        const det = obs.observedProperty as Record<string, unknown> | undefined;
        const rawVal = obs.hasSimpleResult;
        const unit = typeof obs.hasUnit === "string" ? obs.hasUnit : "";
        const date = typeof obs.phenomenonTime === "string" ? obs.phenomenonTime : "";

        const numVal = typeof rawVal === "number" ? rawVal : parseFloat(String(rawVal ?? ""));

        return {
          determinand: det ? String(det.prefLabel ?? det.altLabel ?? "") : "",
          determinandNotation: det ? String(det.notation ?? "") : "",
          value: isNaN(numVal) ? 0 : numVal,
          unit,
          sampleDate: date,
          isNumeric: !isNaN(numVal),
          isWater: isWaterUnit(unit),
        };
      })
      .filter((o) => o.isNumeric && o.determinand && o.isWater)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ isNumeric, isWater, ...rest }) => rest);
  } catch {
    return [];
  }
}

function isPfas(notation: string, label: string): boolean {
  const num = parseInt(notation, 10);
  if (!isNaN(num) && num >= 2942 && num <= 3037) return true;
  const lower = label.toLowerCase();
  return lower.includes("perfluoro") || lower.includes("pfos") || lower.includes("pfoa") || lower.includes("pfas");
}

// ── Main per-postcode processor ──

export async function processPostcode(district: string): Promise<PostcodeSeedData | null> {
  const info = await lookupPostcode(district);
  if (!info) return null;

  const points = await fetchWaterSamplingPoints(info.latitude, info.longitude);

  const pointsToQuery = points.slice(0, 5);
  const allObservations: { obs: Observation; pointLabel: string }[] = [];

  for (const point of pointsToQuery) {
    const observations = await fetchRecentObservations(point.id, 50);
    for (const obs of observations) {
      allObservations.push({ obs, pointLabel: point.label });
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  const pfasReadings = allObservations.filter((o) =>
    isPfas(o.obs.determinandNotation, o.obs.determinand),
  );

  // Newest first, so the de-dup below keeps the most recent reading per determinand.
  // Without this the winner is whichever the API happened to return first, and the
  // 30-reading cap can drop a recent measurement in favour of a decade-old one.
  const byNewest = [...allObservations].sort((a, b) =>
    (b.obs.sampleDate ?? "").localeCompare(a.obs.sampleDate ?? ""),
  );

  const seenDeterminands = new Set<string>();
  const topReadings = byNewest
    .filter((o) => {
      if (seenDeterminands.has(o.obs.determinand)) return false;
      seenDeterminands.add(o.obs.determinand);
      return true;
    })
    .slice(0, 30)
    .map((o) => ({
      determinand: o.obs.determinand,
      value: o.obs.value,
      unit: o.obs.unit,
      date: o.obs.sampleDate,
      samplingPoint: o.pointLabel,
    }));

  return {
    ...info,
    samplingPointCount: points.length,
    recentObservations: allObservations.length,
    pfasDetected: pfasReadings.length > 0,
    topReadings,
  };
}
