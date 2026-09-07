/**
 * PFAS ingest orchestration: EA Water Quality Archive → `pfas_detections`.
 *
 * Used by `/api/cron/pfas` (daily, 300 s budget) and `scripts/backfill-pfas.ts`
 * (one long run). Both go through the same insert path.
 *
 * Every run writes to `source_checks` so the weekly health report can see it:
 * one row per city (source "ea-pfas", source_name = city, items_found = rows
 * upserted) and one summary row (source "ea-pfas-run"). The per-city rows also
 * drive the visiting order of the next run (stalest city first).
 *
 * The EA API answers 403 when hit concurrently, so requests are sequential with a
 * short pause. A city with 78 open water points takes about 90 s, which is why a
 * single cron invocation cannot cover 50 cities and instead works to a deadline.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { CITIES } from "./cities";
import {
  EA_HEADERS,
  EA_PAGE_LIMIT,
  PFAS_CODELIST_TERMS,
  PFAS_RUN_SOURCE,
  PFAS_RUN_SOURCE_NAME,
  PFAS_SOURCE,
  collectionTotal,
  dedupeRows,
  determinandCodelistUrl,
  ingestWindowStart,
  isWaterPhasePfasDeterminand,
  observationsUrl,
  orderCitiesByStaleness,
  parseDeterminandCodelist,
  parsePfasObservations,
  parseSamplingPoints,
  samplingPointsUrl,
  type PfasCity,
  type PfasDetectionRow,
  type PfasSamplingPoint,
} from "./pfas-ingest";

// ── City centroids ─────────────────────────────────────────────────────────────
// Same 50 cities as `CITIES` (names must match: pfas-data.ts joins on city name).

const CITY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  london: { lat: 51.5074, lng: -0.1278 },
  manchester: { lat: 53.4808, lng: -2.2426 },
  birmingham: { lat: 52.4862, lng: -1.8904 },
  leeds: { lat: 53.8008, lng: -1.5491 },
  glasgow: { lat: 55.8642, lng: -4.2518 },
  edinburgh: { lat: 55.9533, lng: -3.1883 },
  bristol: { lat: 51.4545, lng: -2.5879 },
  liverpool: { lat: 53.4084, lng: -2.9916 },
  sheffield: { lat: 53.3811, lng: -1.4701 },
  newcastle: { lat: 54.9783, lng: -1.6178 },
  nottingham: { lat: 52.9548, lng: -1.1581 },
  cardiff: { lat: 51.4816, lng: -3.1791 },
  brighton: { lat: 50.8225, lng: -0.1372 },
  oxford: { lat: 51.752, lng: -1.2577 },
  cambridge: { lat: 52.2053, lng: 0.1218 },
  bath: { lat: 51.3811, lng: -2.359 },
  york: { lat: 53.9591, lng: -1.0815 },
  exeter: { lat: 50.7184, lng: -3.5339 },
  swansea: { lat: 51.6214, lng: -3.9436 },
  portsmouth: { lat: 50.8198, lng: -1.088 },
  leicester: { lat: 52.6369, lng: -1.1398 },
  coventry: { lat: 52.4068, lng: -1.5197 },
  derby: { lat: 52.9225, lng: -1.4746 },
  "stoke-on-trent": { lat: 53.0027, lng: -2.1794 },
  wolverhampton: { lat: 52.587, lng: -2.1288 },
  plymouth: { lat: 50.3755, lng: -4.1427 },
  southampton: { lat: 50.9097, lng: -1.4044 },
  reading: { lat: 51.4543, lng: -0.9781 },
  northampton: { lat: 52.2405, lng: -0.9027 },
  sunderland: { lat: 54.9069, lng: -1.3838 },
  warrington: { lat: 53.39, lng: -2.597 },
  huddersfield: { lat: 53.645, lng: -1.7798 },
  blackpool: { lat: 53.8142, lng: -3.0503 },
  ipswich: { lat: 52.0567, lng: 1.1482 },
  norwich: { lat: 52.6309, lng: 1.2974 },
  preston: { lat: 53.7632, lng: -2.7031 },
  gloucester: { lat: 51.8642, lng: -2.2382 },
  cheltenham: { lat: 51.8994, lng: -2.0783 },
  lincoln: { lat: 53.2307, lng: -0.5406 },
  dundee: { lat: 56.462, lng: -2.9707 },
  aberdeen: { lat: 57.1497, lng: -2.0943 },
  inverness: { lat: 57.4778, lng: -4.2247 },
  middlesbrough: { lat: 54.5742, lng: -1.235 },
  bradford: { lat: 53.796, lng: -1.7594 },
  hull: { lat: 53.7676, lng: -0.3274 },
  blackburn: { lat: 53.7488, lng: -2.4847 },
  wigan: { lat: 53.5448, lng: -2.6318 },
  stockport: { lat: 53.4106, lng: -2.1575 },
  swindon: { lat: 51.5558, lng: -1.7797 },
  bournemouth: { lat: 50.7192, lng: -1.8808 },
};

export function pfasCities(): PfasCity[] {
  return CITIES.flatMap((c) => {
    const centroid = CITY_CENTROIDS[c.slug];
    return centroid ? [{ slug: c.slug, name: c.name, region: c.region, ...centroid }] : [];
  });
}

// ── Options / result ───────────────────────────────────────────────────────────

export interface PfasIngestOptions {
  db: SupabaseClient;
  /** Stop starting new cities once this many ms have elapsed. */
  deadlineMs: number;
  /** Overrides for tests and the backfill script. */
  cities?: PfasCity[];
  fetchFn?: typeof fetch;
  now?: Date;
  /** Pause between EA requests (ms). The API returns 403 under concurrency. */
  pauseMs?: number;
  radiusKm?: number;
  /** Parse and count but do not write to Supabase. */
  dryRun?: boolean;
  log?: (line: string) => void;
}

export interface PfasCityResult {
  city: string;
  samplingPoints: number;
  rowsFetched: number;
  rowsUpserted: number;
  error: string | null;
}

export interface PfasIngestResult {
  startedAt: string;
  finishedAt: string;
  dateFrom: string;
  determinandCount: number;
  citiesTotal: number;
  citiesProcessed: number;
  citiesSkippedForDeadline: number;
  rowsFetched: number;
  rowsUpserted: number;
  cities: PfasCityResult[];
  errors: string[];
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Observations per point are capped at this many pages (8 × 250). */
const MAX_OBSERVATION_PAGES = 8;
const MAX_POINT_PAGES = 4;

// ── Run ────────────────────────────────────────────────────────────────────────

export async function runPfasIngest(opts: PfasIngestOptions): Promise<PfasIngestResult> {
  const {
    db,
    deadlineMs,
    fetchFn = fetch,
    now = new Date(),
    pauseMs = 150,
    radiusKm = 15,
    dryRun = false,
    log = (line) => console.log(`[pfas-ingest] ${line}`),
  } = opts;
  const startedMs = Date.now();
  const pastDeadline = () => Date.now() - startedMs > deadlineMs;

  async function eaJson(url: string): Promise<unknown> {
    const res = await fetchFn(url, { headers: EA_HEADERS });
    if (!res.ok) {
      const body = (await res.text().catch(() => "")).slice(0, 120);
      throw new Error(`EA API ${res.status} for ${url}${body ? ` — ${body}` : ""}`);
    }
    const json = await res.json();
    await sleep(pauseMs);
    return json;
  }

  // 1. PFAS determinand codes — the API filters observations server-side by these.
  const determinands = new Map<string, string>();
  for (const term of PFAS_CODELIST_TERMS) {
    for (const d of parseDeterminandCodelist(await eaJson(determinandCodelistUrl(term)))) {
      if (isWaterPhasePfasDeterminand(d)) determinands.set(d.notation, d.altLabel || d.prefLabel);
    }
  }
  if (determinands.size === 0) {
    throw new Error("EA determinand codelist returned no PFAS determinands");
  }
  const codes = Array.from(determinands.keys());
  const allowed = new Set(codes);
  const dateFrom = ingestWindowStart(now);
  log(`${codes.length} water-phase PFAS determinands; window from ${dateFrom}`);

  // 2. Visiting order: cities never ingested first, then stalest.
  const allCities = opts.cities ?? pfasCities();
  const cities = orderCitiesByStaleness(allCities, await lastSuccessByCity(db));

  const result: PfasIngestResult = {
    startedAt: new Date(startedMs).toISOString(),
    finishedAt: "",
    dateFrom,
    determinandCount: codes.length,
    citiesTotal: cities.length,
    citiesProcessed: 0,
    citiesSkippedForDeadline: 0,
    rowsFetched: 0,
    rowsUpserted: 0,
    cities: [],
    errors: [],
  };

  // 3. Cities, sequentially, until the deadline.
  for (const city of cities) {
    if (pastDeadline()) {
      result.citiesSkippedForDeadline++;
      continue;
    }

    const cityResult: PfasCityResult = {
      city: city.name,
      samplingPoints: 0,
      rowsFetched: 0,
      rowsUpserted: 0,
      error: null,
    };

    try {
      const points = await fetchAllSamplingPoints(eaJson, city, radiusKm);
      cityResult.samplingPoints = points.length;

      const rows: PfasDetectionRow[] = [];
      const pointErrors: string[] = [];
      for (const point of points) {
        try {
          rows.push(...(await fetchPointDetections(eaJson, point, city, codes, allowed, dateFrom)));
        } catch (err) {
          pointErrors.push(`${point.id}: ${errorMessage(err)}`);
        }
      }

      const deduped = dedupeRows(rows);
      cityResult.rowsFetched = deduped.length;

      if (deduped.length > 0 && !dryRun) {
        cityResult.rowsUpserted = await upsertRows(db, deduped);
      } else if (dryRun) {
        cityResult.rowsUpserted = deduped.length;
      }

      if (pointErrors.length > 0) {
        // Partial failure: keep what we got, but say so.
        cityResult.error = `${pointErrors.length}/${points.length} sampling points failed — ${pointErrors[0]}`;
      }
      log(
        `${city.name}: ${points.length} points, ${deduped.length} detections, ` +
          `${cityResult.rowsUpserted} upserted${cityResult.error ? ` (${cityResult.error})` : ""}`,
      );
    } catch (err) {
      cityResult.error = errorMessage(err);
      log(`${city.name}: FAILED — ${cityResult.error}`);
    }

    result.citiesProcessed++;
    result.rowsFetched += cityResult.rowsFetched;
    result.rowsUpserted += cityResult.rowsUpserted;
    result.cities.push(cityResult);
    if (cityResult.error) result.errors.push(`${city.name}: ${cityResult.error}`);

    if (!dryRun) {
      await logCheck(db, PFAS_SOURCE, city.name, cityResult.rowsUpserted, cityResult.error);
    }
  }

  result.finishedAt = new Date().toISOString();

  // 4. Run summary for the health report. A run that processed cities but fetched
  //    nothing is recorded as an error: that is the silent failure this replaces.
  const summaryError = summariseRunError(result);
  if (!dryRun) {
    await logCheck(db, PFAS_RUN_SOURCE, PFAS_RUN_SOURCE_NAME, result.rowsFetched, summaryError);
  }
  log(
    `done: ${result.citiesProcessed}/${result.citiesTotal} cities, ${result.rowsFetched} detections, ` +
      `${result.rowsUpserted} upserted, ${result.errors.length} errors, ` +
      `${result.citiesSkippedForDeadline} cities left for next run`,
  );

  return result;
}

export function summariseRunError(result: PfasIngestResult): string | null {
  if (result.citiesProcessed === 0) return "deadline hit before any city was processed";
  if (result.rowsFetched === 0) {
    return `0 detections fetched across ${result.citiesProcessed} cities${
      result.errors[0] ? ` — ${result.errors[0]}` : ""
    }`;
  }
  const failed = result.cities.filter((c) => c.error).length;
  if (failed > 0) {
    return `${failed}/${result.citiesProcessed} cities reported errors — ${result.errors[0]}`;
  }
  return null;
}

// ── EA fetches ─────────────────────────────────────────────────────────────────

type Fetcher = (url: string) => Promise<unknown>;

async function fetchAllSamplingPoints(
  eaJson: Fetcher,
  city: PfasCity,
  radiusKm: number,
): Promise<PfasSamplingPoint[]> {
  const points: PfasSamplingPoint[] = [];
  for (let page = 0; page < MAX_POINT_PAGES; page++) {
    const json = await eaJson(samplingPointsUrl(city.lat, city.lng, radiusKm, page * EA_PAGE_LIMIT));
    const batch = parseSamplingPoints(json, city);
    points.push(...batch);
    const total = collectionTotal(json);
    if (batch.length < EA_PAGE_LIMIT || (total !== null && points.length >= total)) break;
  }
  return points;
}

async function fetchPointDetections(
  eaJson: Fetcher,
  point: PfasSamplingPoint,
  city: PfasCity,
  codes: string[],
  allowed: ReadonlySet<string>,
  dateFrom: string,
): Promise<PfasDetectionRow[]> {
  const rows: PfasDetectionRow[] = [];
  let seen = 0;
  for (let page = 0; page < MAX_OBSERVATION_PAGES; page++) {
    const json = await eaJson(observationsUrl(point.id, codes, dateFrom, page * EA_PAGE_LIMIT));
    const members = (json as { member?: unknown[] } | null)?.member ?? [];
    rows.push(...parsePfasObservations(json, point, city, allowed));
    seen += members.length;
    const total = collectionTotal(json);
    if (members.length < EA_PAGE_LIMIT || (total !== null && seen >= total)) break;
  }
  return rows;
}

// ── Supabase ───────────────────────────────────────────────────────────────────

async function upsertRows(db: SupabaseClient, rows: PfasDetectionRow[]): Promise<number> {
  let upserted = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const { error } = await db.from("pfas_detections").upsert(chunk, {
      onConflict: "sampling_point_id,determinand_notation,sample_date",
      ignoreDuplicates: true,
    });
    if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
    upserted += chunk.length;
  }
  return upserted;
}

async function logCheck(
  db: SupabaseClient,
  source: string,
  sourceName: string,
  itemsFound: number,
  error: string | null,
): Promise<void> {
  const { error: dbError } = await db.from("source_checks").insert({
    source,
    source_name: sourceName,
    status_code: error ? 500 : 200,
    items_found: itemsFound,
    error,
  });
  if (dbError) console.error(`[pfas-ingest] failed to log source_check for ${sourceName}:`, dbError.message);
}

/** Latest successful ingest per city, from `source_checks`. */
async function lastSuccessByCity(db: SupabaseClient): Promise<Map<string, string>> {
  const { data, error } = await db
    .from("source_checks")
    .select("source_name, checked_at")
    .eq("source", PFAS_SOURCE)
    .is("error", null)
    .order("checked_at", { ascending: false })
    .limit(500);
  const map = new Map<string, string>();
  if (error || !data) return map;
  for (const row of data as { source_name: string; checked_at: string }[]) {
    if (!map.has(row.source_name)) map.set(row.source_name, row.checked_at);
  }
  return map;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
