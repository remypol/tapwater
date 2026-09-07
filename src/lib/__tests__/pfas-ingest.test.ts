import { describe, it, expect, vi } from "vitest";
import {
  EA_PAGE_LIMIT,
  compoundName,
  dedupeRows,
  describePfasHealth,
  ingestWindowStart,
  isWaterPhasePfasDeterminand,
  observationsUrl,
  orderCitiesByStaleness,
  parsePfasObservation,
  parseSamplingPoints,
  parseWgs84Point,
  quantifiedResult,
  samplingPointsUrl,
  toMicrogramsPerLitre,
  type PfasCity,
  type PfasSamplingPoint,
} from "../pfas-ingest";
import { runPfasIngest, summariseRunError, type PfasIngestResult } from "../pfas-ingest-run";

/**
 * The first version of this cron ran weekly for five months and never inserted a
 * row. Its observation URL carried `minyear=` (HTTP 400) and `limit=500` (HTTP 422),
 * the per-point catch only console.logged, and the handler returned 200 with
 * `errors: []`. These tests pin the request shape the EA API actually accepts and
 * the parsing rules that turn its payload into `pfas_detections` rows.
 */

const LONDON: PfasCity = { slug: "london", name: "London", region: "England", lat: 51.5074, lng: -0.1278 };
const POINT: PfasSamplingPoint = { id: "TH-PBRR0018", label: "BRENT AT LOCK 100", lat: 51.49, lng: -0.31 };
const ALLOWED = new Set(["2959", "9274", "8890", "2921"]);

/** A real EA observation, trimmed. `simple` is what `hasSimpleResult` carries. */
function observation(opts: {
  notation?: string;
  altLabel?: string;
  simple: string | number;
  numeric?: number | null;
  upperBound?: number | null;
  unit?: string;
  time?: string;
}) {
  const { notation = "2959", altLabel = "PFOS (L)", simple, unit = "ug/l", time = "2024-03-12T10:30:00" } = opts;
  const numeric = opts.numeric === undefined ? (typeof simple === "number" ? simple : null) : opts.numeric;
  return {
    "@type": "sosa:Observation",
    phenomenonTime: time,
    hasSimpleResult: simple,
    hasUnit: unit,
    hasResult: {
      "@type": "qudt:QuantityValue",
      numericValue: numeric,
      upperBound: opts.upperBound ?? null,
      lowerBound: null,
      hasUnit: { prefLabel: "MICROGRAM PER LITRE", altLabel: unit, notation: "206" },
    },
    observedProperty: { prefLabel: "Perfluorooctanesulfonic acid (linear)", altLabel, notation },
    hasSamplingPoint: { notation: POINT.id, prefLabel: "BRENT / G.U.C. AT LOCK 100, BRENTFORD" },
  };
}

describe("request URLs match what the EA API accepts", () => {
  it("filters observations by determinand and dateFrom, never minyear, limit <= 250", () => {
    const url = new URL(observationsUrl("TH-PBRR0018", ["2959", "9274"], "2023-01-01"));
    expect(url.pathname).toBe("/water-quality/sampling-point/TH-PBRR0018/observation");
    expect(url.searchParams.get("determinand")).toBe("2959,9274");
    expect(url.searchParams.get("dateFrom")).toBe("2023-01-01");
    expect(url.searchParams.has("minyear")).toBe(false);
    expect(Number(url.searchParams.get("limit"))).toBeLessThanOrEqual(250);
    expect(EA_PAGE_LIMIT).toBe(250);
  });

  it("pages with skip", () => {
    const url = new URL(observationsUrl("X", ["1"], "2023-01-01", 500));
    expect(url.searchParams.get("skip")).toBe("500");
  });

  it("escapes sampling point ids", () => {
    expect(observationsUrl("AN-TEST/1", ["1"], "2023-01-01")).toContain("/sampling-point/AN-TEST%2F1/observation");
  });

  it("asks for open freshwater and groundwater points only", () => {
    const url = new URL(samplingPointsUrl(51.5, -0.12, 15));
    expect(url.searchParams.get("samplingPointStatus")).toBe("O");
    expect(url.searchParams.get("samplingPointType")).toContain("F6");
    expect(url.searchParams.get("samplingPointType")).toContain("BA");
    expect(url.searchParams.get("samplingPointType")).not.toContain("BH"); // landfill boreholes
    expect(url.searchParams.get("radius")).toBe("15");
  });

  it("starts the window on 1 January three years back", () => {
    expect(ingestWindowStart(new Date("2026-09-07T03:00:00Z"))).toBe("2023-01-01");
  });
});

describe("determinands", () => {
  it("keeps water-phase PFAS and drops sediment/biota variants", () => {
    expect(isWaterPhasePfasDeterminand({ notation: "9276", prefLabel: "Perfluorooctylsulphonate anion", altLabel: "PFOS" })).toBe(true);
    expect(isWaterPhasePfasDeterminand({ notation: "3375", prefLabel: "Perfluorooctylsulphonate anion : Wet Wt", altLabel: "PFOS WW" })).toBe(false);
    expect(isWaterPhasePfasDeterminand({ notation: "9275", prefLabel: "Perfluorooctylsulphonate anion : Dry Wt", altLabel: "PFOS DW" })).toBe(false);
    expect(isWaterPhasePfasDeterminand({ notation: "3034", prefLabel: "Perfluorodecanoic acid : wet wt", altLabel: "PFDA ww" })).toBe(false);
  });

  // The old map said 2968 = PFOS and 2966 = PFOA. The codelist says otherwise.
  it("names compounds by their real EA codes", () => {
    expect(compoundName("9276", "PFOS", "Perfluorooctylsulphonate anion")).toBe("PFOS");
    expect(compoundName("2959", "PFOS (L)", "")).toBe("PFOS (linear)");
    expect(compoundName("8890", "PFoctncAcid", "Perfluorooctanoic acid")).toBe("PFOA");
    expect(compoundName("2968", "PFDoS", "Perfluorododecane sulfonic acid")).toBe("PFDoS");
    expect(compoundName("2966", "PFHxDA", "Perfluorohexadecanoic acid")).toBe("PFHxDA");
  });

  it("falls back to the EA short label, then the long one", () => {
    expect(compoundName("2973", "PFecHS", "Perfluoro-4-ethylcyclohexanesulfonic acid")).toBe("PFecHS");
    expect(compoundName("2973", "", "Perfluoro-4-ethylcyclohexanesulfonic acid")).toBe("Perfluoro-4-ethylcyclohexanesulfonic acid");
    expect(compoundName("2973", "", "")).toBe("PFAS-2973");
  });
});

describe("coordinates", () => {
  it("reads WGS84 POINT(lon lat)", () => {
    expect(parseWgs84Point("POINT(-0.2614 51.5641) <http://www.opengis.net/def/crs/EPSG/0/4326>")).toEqual({
      lat: 51.5641,
      lng: -0.2614,
    });
  });

  it("rejects British National Grid metres rather than storing them as degrees", () => {
    expect(parseWgs84Point("POINT(520607 186451) <http://www.opengis.net/def/crs/EPSG/0/27700>")).toBeNull();
    expect(parseWgs84Point("")).toBeNull();
  });

  it("uses the point's own location and falls back to the city centroid", () => {
    const points = parseSamplingPoints(
      {
        member: [
          { notation: "A", prefLabel: "Alpha", geometry: { asWKT: "POINT(-0.2614 51.5641) <crs>" } },
          { notation: "B", altLabel: "Beta", geometry: { asWKT: "POINT(520607 186451) <crs>" } },
          { prefLabel: "no notation" },
        ],
      },
      LONDON,
    );
    expect(points).toEqual([
      { id: "A", label: "Alpha", lat: 51.5641, lng: -0.2614 },
      { id: "B", label: "Beta", lat: LONDON.lat, lng: LONDON.lng },
    ]);
  });
});

describe("results and units", () => {
  it("reads a quantified result", () => {
    expect(quantifiedResult(observation({ simple: 0.0049 }))).toBe(0.0049);
  });

  // Real payload: hasSimpleResult "<0.0005", numericValue null, upperBound 0.0005.
  it("treats a below-reporting-limit result as no detection, not 0", () => {
    expect(quantifiedResult(observation({ simple: "<0.0005", numeric: null, upperBound: 0.0005 }))).toBeNull();
  });

  it("parses a numeric string when there is no structured result", () => {
    expect(quantifiedResult({ hasSimpleResult: "0.0083" })).toBe(0.0083);
    expect(quantifiedResult({ hasSimpleResult: "<0.001" })).toBeNull();
    expect(quantifiedResult({ hasSimpleResult: "n/a" })).toBeNull();
    expect(quantifiedResult({})).toBeNull();
  });

  it("normalises concentrations to µg/L", () => {
    expect(toMicrogramsPerLitre(5, "ug/l")).toBe(5);
    expect(toMicrogramsPerLitre(5, "µg/l")).toBe(5);
    expect(toMicrogramsPerLitre(5, "ng/l")).toBeCloseTo(0.005);
    expect(toMicrogramsPerLitre(0.002, "mg/l")).toBeCloseTo(2);
    expect(toMicrogramsPerLitre(5, "ug/kg")).toBeNull();
    expect(toMicrogramsPerLitre(5, "")).toBeNull();
  });
});

describe("parsePfasObservation", () => {
  it("maps a detection to a pfas_detections row", () => {
    const row = parsePfasObservation(observation({ simple: 0.0049 }), POINT, LONDON, ALLOWED);
    expect(row).toEqual({
      sampling_point_id: "TH-PBRR0018",
      sampling_point_label: "BRENT / G.U.C. AT LOCK 100, BRENTFORD",
      lat: 51.49,
      lng: -0.31,
      city: "London",
      region: "England",
      compound: "PFOS (linear)",
      determinand_notation: "2959",
      value: 0.0049,
      unit: "µg/L",
      sample_date: "2024-03-12",
    });
  });

  it("converts ng/l to µg/L so every row shares one unit", () => {
    const row = parsePfasObservation(observation({ simple: 4.9, unit: "ng/l" }), POINT, LONDON, ALLOWED);
    expect(row?.value).toBeCloseTo(0.0049);
    expect(row?.unit).toBe("µg/L");
  });

  it("drops non-detects", () => {
    expect(parsePfasObservation(observation({ simple: "<0.0005", upperBound: 0.0005 }), POINT, LONDON, ALLOWED)).toBeNull();
  });

  it("drops determinands outside the PFAS set even if the API returned them", () => {
    expect(parsePfasObservation(observation({ simple: 1, notation: "117", altLabel: "Nitrate" }), POINT, LONDON, ALLOWED)).toBeNull();
  });

  it("drops rows without a usable date or unit", () => {
    expect(parsePfasObservation(observation({ simple: 1, time: "" }), POINT, LONDON, ALLOWED)).toBeNull();
    expect(parsePfasObservation(observation({ simple: 1, unit: "ug/kg" }), POINT, LONDON, ALLOWED)).toBeNull();
  });

  it("falls back to the sampling point label from the listing", () => {
    const obs = observation({ simple: 1 }) as Record<string, unknown>;
    delete obs.hasSamplingPoint;
    expect(parsePfasObservation(obs, POINT, LONDON, ALLOWED)?.sampling_point_label).toBe("BRENT AT LOCK 100");
  });
});

describe("dedupeRows", () => {
  it("keeps the highest value per (point, determinand, day) — the table's unique key", () => {
    const base = parsePfasObservation(observation({ simple: 0.001 }), POINT, LONDON, ALLOWED)!;
    const higher = { ...base, value: 0.003 };
    const otherDay = { ...base, sample_date: "2024-03-13" };
    const rows = dedupeRows([base, higher, otherDay]);
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.sample_date === "2024-03-12")?.value).toBe(0.003);
  });
});

describe("orderCitiesByStaleness", () => {
  it("visits never-ingested cities first, then the least recently ingested", () => {
    const cities = [{ name: "A" }, { name: "B" }, { name: "C" }, { name: "D" }];
    const last = new Map([
      ["A", "2026-09-01T00:00:00Z"],
      ["C", "2026-08-01T00:00:00Z"],
      ["D", "2026-09-05T00:00:00Z"],
    ]);
    expect(orderCitiesByStaleness(cities, last).map((c) => c.name)).toEqual(["B", "C", "A", "D"]);
  });
});

describe("describePfasHealth", () => {
  const now = new Date("2026-09-07T08:00:00Z");

  it("is quiet when the table has rows and the last run was recent and fetched data", () => {
    expect(
      describePfasHealth({
        tableRows: 1200,
        lastRun: { checked_at: "2026-09-07T03:05:00Z", items_found: 340, error: null },
        now,
      }),
    ).toEqual([]);
  });

  // The situation this whole change exists for.
  it("flags an empty table and a cron that never recorded a run", () => {
    expect(describePfasHealth({ tableRows: 0, lastRun: null, now })).toEqual([
      "pfas_detections is empty — every /pfas page and the most-pfas press story have no data",
      "PFAS ingest has never recorded a run",
    ]);
  });

  it("flags a run that fetched nothing", () => {
    expect(
      describePfasHealth({
        tableRows: 1200,
        lastRun: { checked_at: "2026-09-07T03:05:00Z", items_found: 0, error: null },
        now,
      }),
    ).toEqual(["PFAS ingest last run fetched 0 detections"]);
  });

  it("reports the run's own error message", () => {
    expect(
      describePfasHealth({
        tableRows: 1200,
        lastRun: { checked_at: "2026-09-07T03:05:00Z", items_found: 0, error: "EA API 403 for …" },
        now,
      }),
    ).toEqual(["PFAS ingest last run reported: EA API 403 for …"]);
  });

  it("flags a stalled cron", () => {
    expect(
      describePfasHealth({
        tableRows: 1200,
        lastRun: { checked_at: "2026-09-01T03:05:00Z", items_found: 50, error: null },
        now,
      })[0],
    ).toMatch(/last ran 149h ago/);
  });
});

describe("summariseRunError", () => {
  const base: PfasIngestResult = {
    startedAt: "",
    finishedAt: "",
    dateFrom: "2023-01-01",
    determinandCount: 89,
    citiesTotal: 50,
    citiesProcessed: 3,
    citiesSkippedForDeadline: 47,
    rowsFetched: 120,
    rowsUpserted: 120,
    cities: [],
    errors: [],
  };

  it("is null for a healthy partial run", () => {
    expect(summariseRunError(base)).toBeNull();
  });

  it("is an error when cities were processed but nothing came back", () => {
    expect(summariseRunError({ ...base, rowsFetched: 0, errors: ["London: EA API 400"] })).toBe(
      "0 detections fetched across 3 cities — London: EA API 400",
    );
  });

  it("is an error when the deadline hit before any city", () => {
    expect(summariseRunError({ ...base, citiesProcessed: 0, rowsFetched: 0 })).toBe(
      "deadline hit before any city was processed",
    );
  });
});

// ── End to end against a fake EA and a fake Supabase ──────────────────────────

function fakeDb() {
  const inserted: Record<string, unknown>[] = [];
  const upserted: Record<string, unknown>[] = [];
  const db = {
    from(table: string) {
      return {
        insert: async (row: Record<string, unknown>) => {
          inserted.push({ table, ...row });
          return { error: null };
        },
        upsert: async (rows: Record<string, unknown>[]) => {
          upserted.push(...rows.map((r) => ({ table, ...r })));
          return { error: null };
        },
        select: () => ({
          eq: () => ({
            is: () => ({
              order: () => ({
                limit: async () => ({ data: [], error: null }),
              }),
            }),
          }),
        }),
      };
    },
  };
  return { db: db as never, inserted, upserted };
}

function fakeEa(handlers: Record<string, (url: URL) => unknown>) {
  const urls: string[] = [];
  const fetchFn = vi.fn(async (input: string | URL | Request) => {
    const url = new URL(String(input));
    urls.push(url.toString());
    const key = Object.keys(handlers).find((k) => url.pathname.endsWith(k));
    if (!key) return { ok: false, status: 404, text: async () => "Not Found", json: async () => ({}) };
    const body = handlers[key](url);
    return { ok: true, status: 200, text: async () => JSON.stringify(body), json: async () => body };
  });
  return { fetchFn: fetchFn as unknown as typeof fetch, urls };
}

describe("runPfasIngest", () => {
  const codelist = {
    member: [
      { notation: "2959", prefLabel: "Perfluorooctanesulfonic acid (linear)", altLabel: "PFOS (L)" },
      { notation: "3375", prefLabel: "Perfluorooctylsulphonate anion : Wet Wt", altLabel: "PFOS WW" },
    ],
  };

  it("fetches, filters, upserts and logs the run", async () => {
    const { db, inserted, upserted } = fakeDb();
    const { fetchFn, urls } = fakeEa({
      "/codelist/determinand": () => codelist,
      "/observation": () => ({
        totalItems: 3,
        member: [
          observation({ simple: 0.0049 }),
          observation({ simple: "<0.0005", upperBound: 0.0005 }),
          observation({ simple: 0.9, notation: "3375", altLabel: "PFOS WW", unit: "ug/kg" }),
        ],
      }),
      "/sampling-point": () => ({
        totalItems: 1,
        member: [{ notation: POINT.id, prefLabel: POINT.label, geometry: { asWKT: "POINT(-0.31 51.49) <crs>" } }],
      }),
    });

    const result = await runPfasIngest({
      db,
      deadlineMs: 60_000,
      cities: [LONDON],
      fetchFn,
      pauseMs: 0,
      now: new Date("2026-09-07T03:00:00Z"),
      log: () => {},
    });

    // Only the water-phase determinand is requested from the API.
    const obsUrl = new URL(urls.find((u) => u.includes("/observation"))!);
    expect(obsUrl.searchParams.get("determinand")).toBe("2959");
    expect(obsUrl.searchParams.get("dateFrom")).toBe("2023-01-01");
    expect(obsUrl.searchParams.has("minyear")).toBe(false);

    expect(result.citiesProcessed).toBe(1);
    expect(result.rowsFetched).toBe(1);
    expect(result.rowsUpserted).toBe(1);
    expect(result.errors).toEqual([]);

    expect(upserted).toHaveLength(1);
    expect(upserted[0]).toMatchObject({ table: "pfas_detections", city: "London", compound: "PFOS (linear)", value: 0.0049 });

    // Per-city row plus the run summary, both healthy.
    expect(inserted).toEqual([
      expect.objectContaining({ table: "source_checks", source: "ea-pfas", source_name: "London", items_found: 1, error: null }),
      expect.objectContaining({ table: "source_checks", source: "ea-pfas-run", source_name: "EA PFAS ingest", items_found: 1, error: null }),
    ]);
  });

  it("records a failing run loudly instead of returning an empty success", async () => {
    const { db, inserted, upserted } = fakeDb();
    const { fetchFn } = fakeEa({
      "/codelist/determinand": () => codelist,
      "/sampling-point": () => ({
        totalItems: 1,
        member: [{ notation: POINT.id, prefLabel: POINT.label }],
      }),
      // no /observation handler → 404 from the fake API
    });

    const result = await runPfasIngest({
      db,
      deadlineMs: 60_000,
      cities: [LONDON],
      fetchFn,
      pauseMs: 0,
      log: () => {},
    });

    expect(upserted).toHaveLength(0);
    expect(result.rowsFetched).toBe(0);
    expect(result.errors[0]).toMatch(/London: 1\/1 sampling points failed — TH-PBRR0018: EA API 404/);
    const summary = inserted.find((r) => r.source === "ea-pfas-run");
    expect(summary?.error).toMatch(/^0 detections fetched across 1 cities/);
    expect(inserted.find((r) => r.source === "ea-pfas")?.error).toMatch(/sampling points failed/);
  });

  it("stops starting cities at the deadline and reports what is left", async () => {
    const { db } = fakeDb();
    const { fetchFn } = fakeEa({
      "/codelist/determinand": () => codelist,
      "/sampling-point": () => ({ totalItems: 0, member: [] }),
    });
    const bath: PfasCity = { slug: "bath", name: "Bath", region: "England", lat: 51.38, lng: -2.36 };

    const result = await runPfasIngest({
      db,
      deadlineMs: -1, // already past
      cities: [LONDON, bath],
      fetchFn,
      pauseMs: 0,
      log: () => {},
    });

    expect(result.citiesProcessed).toBe(0);
    expect(result.citiesSkippedForDeadline).toBe(2);
  });
});

describe("runPfasIngest retries the EA WAF", () => {
  const codelist = {
    member: [{ notation: "2959", prefLabel: "Perfluorooctanesulfonic acid (linear)", altLabel: "PFOS (L)" }],
  };
  const pointPage = {
    totalItems: 1,
    member: [{ notation: POINT.id, prefLabel: POINT.label, geometry: { asWKT: "POINT(-0.31 51.49) <crs>" } }],
  };

  function flakyEa(statuses: number[]) {
    let call = 0;
    const fetchFn = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/observation")) {
        const status = statuses[Math.min(call, statuses.length - 1)];
        call++;
        if (status !== 200) return { ok: false, status, text: async () => "Forbidden", json: async () => ({}) };
        const body = { totalItems: 1, member: [observation({ simple: 0.0049 })] };
        return { ok: true, status: 200, text: async () => "", json: async () => body };
      }
      const body = url.pathname.includes("/codelist/") ? codelist : pointPage;
      return { ok: true, status: 200, text: async () => "", json: async () => body };
    });
    return { fetchFn: fetchFn as unknown as typeof fetch, calls: () => call };
  }

  it("recovers when a 403 is followed by a 200", async () => {
    const { db, upserted } = fakeDb();
    const { fetchFn, calls } = flakyEa([403, 403, 200]);
    const result = await runPfasIngest({
      db, deadlineMs: 60_000, cities: [LONDON], fetchFn, pauseMs: 0, retryDelaysMs: [0, 0, 0],
      now: new Date("2026-09-07T03:00:00Z"), log: () => {},
    });
    expect(calls()).toBe(3);
    expect(result.errors).toEqual([]);
    expect(upserted.length).toBeGreaterThan(0);
  });

  it("gives up after the configured retries and says so", async () => {
    const { db } = fakeDb();
    const { fetchFn, calls } = flakyEa([403]);
    const result = await runPfasIngest({
      db, deadlineMs: 60_000, cities: [LONDON], fetchFn, pauseMs: 0, retryDelaysMs: [0, 0, 0],
      now: new Date("2026-09-07T03:00:00Z"), log: () => {},
    });
    expect(calls()).toBe(4);
    expect(result.errors.join(" ")).toContain("after 3 retries");
  });
});
