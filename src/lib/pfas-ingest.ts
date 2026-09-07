/**
 * Pure helpers for the PFAS ingest: EA Water Quality Archive → `pfas_detections`.
 *
 * Everything here is side-effect free so it can be unit tested. The orchestration
 * (network + Supabase) lives in `pfas-ingest-run.ts`.
 *
 * Verified against the live API (OpenAPI 1.3.1 at /water-quality/openapi.json,
 * September 2026):
 *
 * - `/sampling-point/{id}/observation` accepts `determinand` (comma-separated
 *   notation codes), `dateFrom`/`dateTo` (YYYY-MM-DD), `skip` and `limit` (max 250).
 *   It does NOT accept `minyear` (HTTP 400) and rejects `limit=500` (HTTP 422). The
 *   original cron sent both, so every request failed and the table stayed empty.
 * - Results are oldest first with no sort parameter, so a recent window must come
 *   from `dateFrom`, not from taking the first page.
 * - Non-detects come back as `hasSimpleResult: "<0.0005"` with
 *   `hasResult.numericValue: null` and `hasResult.upperBound` = the reporting limit.
 *   `parseFloat("<0.0005")` is NaN, which the old code stored as a 0 µg/L "detection".
 * - `Accept-Crs: EPSG:4326` returns geometry as `POINT(lon lat)` in WGS84, so points
 *   get their real coordinates instead of the city centroid.
 * - The determinand codelist has ~150 PFAS entries. Roughly 60 are sediment/biota
 *   determinands ("wet wt", "dry wt", "WW", "DW") and are not water measurements.
 * - The old hard-coded name map was wrong: 2968 is PFDoS (not PFOS), 2966 is PFHxDA
 *   (not PFOA). PFOS is 9276 / 2958-2960, PFOA is 9274 / 8890.
 */

export const EA_BASE = "https://environment.data.gov.uk/water-quality";

export const EA_HEADERS: Record<string, string> = {
  Accept: "application/ld+json",
  "Accept-Crs": "http://www.opengis.net/def/crs/EPSG/0/4326",
};

/** The API caps `limit` at 250 for every collection endpoint. */
export const EA_PAGE_LIMIT = 250;

/**
 * Sampling point types that are water someone could drink from, swim in, or draw a
 * borehole from: freshwater and groundwater. Landfill boreholes (BH/BL), sewage,
 * discharges, saline and soil/sediment points are excluded — they are not the "water
 * near you" the /pfas pages describe.
 */
export const PFAS_WATER_POINT_TYPES = [
  "F6", // FRESHWATER - RIVERS
  "FA", // FRESHWATER - LAKES/PONDS/RESERVOIRS
  "FB", // FRESHWATER - RIVER TRANSFER
  "FJ", // FRESHWATER - CANALS
  "FK", // FRESHWATER - LAND DRAINS
  "FL", // FRESHWATER - BATHING WATER
  "FZ", // FRESHWATER - UNSPECIFIED
  "BA", // GROUNDWATER - BOREHOLE
  "BB", // GROUNDWATER - SPRING
  "BC", // GROUNDWATER - WELLS & ADITS
  "BE", // GROUNDWATER - COMPOSITE
  "BZ", // GROUNDWATER - UNSPECIFIED
];

/** Codelist searches that together cover the PFAS family. */
export const PFAS_CODELIST_TERMS = ["perfluoro", "fluorotelomer"];

/**
 * Friendly names for the compounds people have heard of. Anything else falls back to
 * the EA's altLabel (e.g. "PFecHS", "6:2 FTSA"), which is already the short name.
 * Codes verified against /codelist/determinand.
 */
export const PFAS_COMPOUND_NAMES: Record<string, string> = {
  "9276": "PFOS",
  "9275": "PFOS",
  "2958": "PFOS (total)",
  "2959": "PFOS (linear)",
  "2960": "PFOS (branched)",
  "9274": "PFOA",
  "8890": "PFOA",
  "2893": "PFHxS (total)",
  "2964": "PFHxS (linear)",
  "2944": "PFHxS (branched)",
  "2972": "PFBS",
  "2995": "PFBA",
  "8887": "PFPeA",
  "8888": "PFHxA",
  "8889": "PFHpA",
  "8891": "PFNA",
  "8892": "PFDA",
  "8893": "PFUnDA",
  "8894": "PFDoDA",
  "8895": "PFTeDA",
  "2957": "PFPeS",
  "2967": "PFHpS",
  "2963": "PFNS",
  "2969": "PFDS",
  "2968": "PFDoS",
  "2961": "FOSA",
  "2988": "ADONA",
};

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PfasCity {
  slug: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
}

export interface PfasSamplingPoint {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

export interface PfasDeterminand {
  notation: string;
  prefLabel: string;
  altLabel: string;
}

/** One row of `pfas_detections`. */
export interface PfasDetectionRow {
  sampling_point_id: string;
  sampling_point_label: string;
  lat: number;
  lng: number;
  city: string;
  region: string;
  compound: string;
  determinand_notation: string;
  value: number;
  unit: string;
  sample_date: string;
}

// ── Small accessors ────────────────────────────────────────────────────────────

function str(obj: unknown, key: string): string {
  if (typeof obj !== "object" || obj === null) return "";
  const val = (obj as Record<string, unknown>)[key];
  return typeof val === "string" ? val : val == null ? "" : String(val);
}

function nested(obj: unknown, key: string): Record<string, unknown> | null {
  if (typeof obj !== "object" || obj === null) return null;
  const val = (obj as Record<string, unknown>)[key];
  return typeof val === "object" && val !== null ? (val as Record<string, unknown>) : null;
}

// ── URLs ───────────────────────────────────────────────────────────────────────

export function determinandCodelistUrl(term: string): string {
  return `${EA_BASE}/codelist/determinand?prefLabel=${encodeURIComponent(term)}&limit=${EA_PAGE_LIMIT}`;
}

export function samplingPointsUrl(
  lat: number,
  lng: number,
  radiusKm: number,
  skip = 0,
): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    radius: String(radiusKm),
    samplingPointStatus: "O",
    samplingPointType: PFAS_WATER_POINT_TYPES.join(","),
    limit: String(EA_PAGE_LIMIT),
  });
  if (skip > 0) params.set("skip", String(skip));
  return `${EA_BASE}/sampling-point?${params}`;
}

export function observationsUrl(
  pointId: string,
  determinandCodes: string[],
  dateFrom: string,
  skip = 0,
): string {
  const params = new URLSearchParams({
    determinand: determinandCodes.join(","),
    dateFrom,
    limit: String(EA_PAGE_LIMIT),
  });
  if (skip > 0) params.set("skip", String(skip));
  return `${EA_BASE}/sampling-point/${encodeURIComponent(pointId)}/observation?${params}`;
}

/** 1 January, `yearsBack` years before `now` — the start of the ingest window. */
export function ingestWindowStart(now: Date, yearsBack = 3): string {
  return `${now.getUTCFullYear() - yearsBack}-01-01`;
}

// ── Determinands ───────────────────────────────────────────────────────────────

const SOLID_PHASE = /wet\s*wt|dry\s*wt|\bww\b|\bdw\b/i;

/**
 * Keep water-phase PFAS determinands only. The codelist also carries sediment and
 * biota variants ("Perfluorooctanoic acid : Wet Wt", altLabel "PFOA WW") whose
 * values are µg/kg, not µg/L.
 */
export function isWaterPhasePfasDeterminand(d: PfasDeterminand): boolean {
  return !SOLID_PHASE.test(`${d.prefLabel} ${d.altLabel}`);
}

export function parseDeterminandCodelist(json: unknown): PfasDeterminand[] {
  const members = (nested(json, "member") as unknown as unknown[] | null) ?? [];
  if (!Array.isArray(members)) return [];
  return members
    .map((m) => ({
      notation: str(m, "notation"),
      prefLabel: str(m, "prefLabel").trim(),
      altLabel: str(m, "altLabel").trim(),
    }))
    .filter((d) => d.notation !== "");
}

export function compoundName(notation: string, altLabel: string, prefLabel: string): string {
  return PFAS_COMPOUND_NAMES[notation] || altLabel.trim() || prefLabel.trim() || `PFAS-${notation}`;
}

// ── Sampling points ────────────────────────────────────────────────────────────

/** `POINT(lon lat) <crs>` in WGS84 → {lat, lng}. Returns null for BNG or garbage. */
export function parseWgs84Point(wkt: string): { lat: number; lng: number } | null {
  const m = /POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/i.exec(wkt);
  if (!m) return null;
  const lng = parseFloat(m[1]);
  const lat = parseFloat(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null; // still in metres → not WGS84
  return { lat, lng };
}

export function parseSamplingPoints(
  json: unknown,
  fallback: { lat: number; lng: number },
): PfasSamplingPoint[] {
  const members = (nested(json, "member") as unknown as unknown[] | null) ?? [];
  if (!Array.isArray(members)) return [];
  const points: PfasSamplingPoint[] = [];
  for (const sp of members) {
    const id = str(sp, "notation");
    if (!id) continue;
    const geom = parseWgs84Point(str(nested(sp, "geometry"), "asWKT")) ?? fallback;
    points.push({
      id,
      label: str(sp, "prefLabel") || str(sp, "altLabel") || id,
      lat: geom.lat,
      lng: geom.lng,
    });
  }
  return points;
}

/** `totalItems` of a hydra collection, or null if absent. */
export function collectionTotal(json: unknown): number | null {
  const total = (json as Record<string, unknown> | null)?.totalItems;
  return typeof total === "number" && total >= 0 ? total : null;
}

// ── Observations ───────────────────────────────────────────────────────────────

/** Multiply by this to express a unit in µg/L; undefined = not a water concentration. */
const UNIT_TO_UG_PER_L: Record<string, number> = {
  "ug/l": 1,
  "µg/l": 1,
  "μg/l": 1,
  "ng/l": 0.001,
  "mg/l": 1000,
};

export function toMicrogramsPerLitre(value: number, unit: string): number | null {
  const factor = UNIT_TO_UG_PER_L[unit.trim().toLowerCase()];
  return factor === undefined ? null : value * factor;
}

/**
 * The quantified result of an observation, or null for a non-detect ("<0.0005"),
 * a missing value, or anything non-numeric. Prefers the structured
 * `hasResult.numericValue`; falls back to `hasSimpleResult` for older payloads.
 */
export function quantifiedResult(obs: unknown): number | null {
  const result = nested(obs, "hasResult");
  if (result) {
    const nv = result.numericValue;
    if (typeof nv === "number" && Number.isFinite(nv)) return nv;
    if (nv === null && result.upperBound != null) return null; // explicit non-detect
  }
  const simple = (obs as Record<string, unknown> | null)?.hasSimpleResult;
  if (typeof simple === "number") return Number.isFinite(simple) ? simple : null;
  if (typeof simple !== "string") return null;
  const trimmed = simple.trim();
  if (trimmed.startsWith("<") || trimmed.startsWith(">")) return null;
  const parsed = parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/** "2023-04-20T12:12:00" → "2023-04-20"; null when unparseable. */
export function sampleDateOf(obs: unknown): string | null {
  const t = str(obs, "phenomenonTime");
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(t);
  return m ? m[1] : null;
}

/**
 * One EA observation → one `pfas_detections` row, or null when it is not a
 * quantified PFAS detection in water (non-detect, no value, non-concentration unit,
 * missing date, or a determinand outside the allowed set).
 */
export function parsePfasObservation(
  obs: unknown,
  point: PfasSamplingPoint,
  city: PfasCity,
  allowedDeterminands: ReadonlySet<string>,
): PfasDetectionRow | null {
  const det = nested(obs, "observedProperty");
  const notation = str(det, "notation");
  if (!notation || !allowedDeterminands.has(notation)) return null;

  const raw = quantifiedResult(obs);
  if (raw === null || raw <= 0) return null;

  const unit = str(obs, "hasUnit") || str(nested(nested(obs, "hasResult"), "hasUnit"), "altLabel");
  const value = toMicrogramsPerLitre(raw, unit);
  if (value === null) return null;

  const sampleDate = sampleDateOf(obs);
  if (!sampleDate) return null;

  const spLabel = str(nested(obs, "hasSamplingPoint"), "prefLabel") || point.label;

  return {
    sampling_point_id: point.id,
    sampling_point_label: spLabel,
    lat: point.lat,
    lng: point.lng,
    city: city.name,
    region: city.region,
    compound: compoundName(notation, str(det, "altLabel"), str(det, "prefLabel")),
    determinand_notation: notation,
    value,
    unit: "µg/L",
    sample_date: sampleDate,
  };
}

export function parsePfasObservations(
  json: unknown,
  point: PfasSamplingPoint,
  city: PfasCity,
  allowedDeterminands: ReadonlySet<string>,
): PfasDetectionRow[] {
  const members = (nested(json, "member") as unknown as unknown[] | null) ?? [];
  if (!Array.isArray(members)) return [];
  const rows: PfasDetectionRow[] = [];
  for (const obs of members) {
    const row = parsePfasObservation(obs, point, city, allowedDeterminands);
    if (row) rows.push(row);
  }
  return rows;
}

/**
 * Collapse rows sharing the table's unique key (point, determinand, date), keeping
 * the highest value. Duplicate samples on one day are otherwise an upsert conflict
 * inside a single batch.
 */
export function dedupeRows(rows: PfasDetectionRow[]): PfasDetectionRow[] {
  const byKey = new Map<string, PfasDetectionRow>();
  for (const row of rows) {
    const key = `${row.sampling_point_id}|${row.determinand_notation}|${row.sample_date}`;
    const existing = byKey.get(key);
    if (!existing || row.value > existing.value) byKey.set(key, row);
  }
  return Array.from(byKey.values());
}

// ── Scheduling ─────────────────────────────────────────────────────────────────

/**
 * Cities in the order the ingest should visit them: never-ingested first, then
 * least recently ingested. A run has a hard time budget and stops starting new
 * cities near the deadline, so this order is what makes repeated runs converge
 * on covering every city instead of always redoing the first few.
 */
export function orderCitiesByStaleness<T extends { name: string }>(
  cities: readonly T[],
  lastSuccessByCity: ReadonlyMap<string, string>,
): T[] {
  return [...cities].sort((a, b) => {
    const ta = lastSuccessByCity.get(a.name);
    const tb = lastSuccessByCity.get(b.name);
    if (ta === undefined && tb === undefined) return 0;
    if (ta === undefined) return -1;
    if (tb === undefined) return 1;
    return ta.localeCompare(tb);
  });
}

// ── Health ─────────────────────────────────────────────────────────────────────

export const PFAS_SOURCE = "ea-pfas";
export const PFAS_RUN_SOURCE = "ea-pfas-run";
export const PFAS_RUN_SOURCE_NAME = "EA PFAS ingest";

export interface PfasHealthInput {
  /** Rows currently in `pfas_detections`. */
  tableRows: number;
  /** The most recent run summary logged to `source_checks`, or null if none. */
  lastRun: { checked_at: string; items_found: number; error: string | null } | null;
  now?: Date;
  /** Runs are scheduled daily; anything older than this is a stalled cron. */
  maxRunAgeHours?: number;
}

/**
 * Health issues for the PFAS pipeline. An empty table is always an issue: 52 /pfas
 * pages and the press "most-pfas" story render from it, and an empty run that
 * returns 200 is exactly the failure that went unnoticed for five months.
 */
export function describePfasHealth(input: PfasHealthInput): string[] {
  const now = input.now ?? new Date();
  const maxAge = input.maxRunAgeHours ?? 48;
  const issues: string[] = [];

  if (input.tableRows === 0) {
    issues.push("pfas_detections is empty — every /pfas page and the most-pfas press story have no data");
  }

  if (!input.lastRun) {
    issues.push("PFAS ingest has never recorded a run");
    return issues;
  }

  const ageHours = (now.getTime() - new Date(input.lastRun.checked_at).getTime()) / 36e5;
  if (Number.isFinite(ageHours) && ageHours > maxAge) {
    issues.push(`PFAS ingest last ran ${Math.round(ageHours)}h ago — cron may be stalled`);
  }
  if (input.lastRun.error) {
    issues.push(`PFAS ingest last run reported: ${input.lastRun.error}`);
  } else if (input.lastRun.items_found === 0) {
    issues.push("PFAS ingest last run fetched 0 detections");
  }

  return issues;
}
