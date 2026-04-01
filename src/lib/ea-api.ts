/**
 * Environment Agency Water Quality API client
 * https://environment.data.gov.uk/water-quality
 *
 * API spec: OpenAPI 3.1.0 (v1.2.1)
 * Swagger: https://environment.data.gov.uk/water-quality/api/swagger
 *
 * Key API details (verified April 2026):
 * - Params: latitude, longitude, radius (km), skip, limit (max 250)
 * - Accept: application/ld+json
 * - Response: { member: [...], totalItems, view: { next, last } }
 * - Geometry is WKT in BNG (EPSG:27700), NOT lat/lng
 * - Labels use prefLabel/altLabel, IDs use notation
 */

const BASE_URL = "https://environment.data.gov.uk/water-quality";

export interface SamplingPoint {
  id: string;
  label: string;
  type: string;
  lat: number;
  lng: number;
}

export interface Observation {
  determinand: string;
  determinandNotation: string;
  value: number;
  unit: string;
  sampleDate: string;
  samplingPointLabel: string;
}

export interface PfasReading {
  samplingPointLabel: string;
  determinand: string;
  value: number;
  unit: string;
  date: string;
  distanceKm: number;
}

export interface Determinand {
  id: string;
  label: string;
  notation: string;
}

// ---------------------------------------------------------------------------
// In-memory determinand cache (1-hour TTL)
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const determinandCache = new Map<string, CacheEntry<Determinand[]>>();
const CACHE_TTL_MS = 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// PFAS determinand detection
// ---------------------------------------------------------------------------

const PFAS_NOTATION_MIN = 2942;
const PFAS_NOTATION_MAX = 3037;

function isPfasDeterminand(notation: string, label: string): boolean {
  const num = parseInt(notation, 10);
  if (!isNaN(num) && num >= PFAS_NOTATION_MIN && num <= PFAS_NOTATION_MAX) {
    return true;
  }
  const lower = label.toLowerCase();
  return (
    lower.includes("perfluoro") ||
    lower.includes("pfos") ||
    lower.includes("pfoa") ||
    lower.includes("pfas")
  );
}

// ---------------------------------------------------------------------------
// Haversine distance (km)
// ---------------------------------------------------------------------------

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Shared fetch helper
// ---------------------------------------------------------------------------

async function eaFetch(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/ld+json" },
  });
  if (!response.ok) {
    throw new Error(`EA API error ${response.status} for ${url}`);
  }
  return response.json();
}

// ---------------------------------------------------------------------------
// Parse nested object helper
// ---------------------------------------------------------------------------

function nested(obj: unknown, key: string): Record<string, unknown> | null {
  if (typeof obj !== "object" || obj === null) return null;
  const val = (obj as Record<string, unknown>)[key];
  if (typeof val === "object" && val !== null) return val as Record<string, unknown>;
  return null;
}

function str(obj: unknown, key: string): string {
  if (typeof obj !== "object" || obj === null) return "";
  const val = (obj as Record<string, unknown>)[key];
  return typeof val === "string" ? val : String(val ?? "");
}

// ---------------------------------------------------------------------------
// 1. fetchSamplingPointsNear
// ---------------------------------------------------------------------------

export async function fetchSamplingPointsNear(
  lat: number,
  lng: number,
  radiusKm: number = 5
): Promise<SamplingPoint[]> {
  // API uses: latitude, longitude, radius (km), limit (max 250)
  const url = `${BASE_URL}/sampling-point?latitude=${lat}&longitude=${lng}&radius=${radiusKm}&limit=100`;
  try {
    const json = (await eaFetch(url)) as Record<string, unknown>;
    const members = (json.member ?? []) as unknown[];

    return members.map((item: unknown) => {
      const sp = item as Record<string, unknown>;
      const notation = str(sp, "notation");
      const label = str(sp, "prefLabel") || str(sp, "altLabel") || notation;

      // Type is nested: { prefLabel: "RIVER / RUNNING SURFACE WATER", notation: "RE" }
      const typeObj = nested(sp, "samplingPointType");
      const typeName = typeObj ? str(typeObj, "prefLabel") : "";

      // Geometry is WKT in BNG — we use the search center as approx lat/lng
      // (exact conversion from BNG to WGS84 requires proj4, skipping for PoC)
      return {
        id: notation,
        label,
        type: typeName,
        lat,
        lng,
      };
    });
  } catch (err) {
    console.error("[ea-api] fetchSamplingPointsNear failed:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// 2. fetchObservations
// ---------------------------------------------------------------------------

export async function fetchObservations(
  samplingPointId: string,
  limit: number = 50
): Promise<Observation[]> {
  const url =
    `${BASE_URL}/sampling-point/${encodeURIComponent(samplingPointId)}` +
    `/observation?limit=${limit}`;
  try {
    const json = (await eaFetch(url)) as Record<string, unknown>;
    const members = (json.member ?? []) as unknown[];

    return members.map((item: unknown) => {
      const obs = item as Record<string, unknown>;

      // EA API v1.2 field names (verified April 2026):
      // observedProperty = determinand (nested with prefLabel + notation)
      // hasSimpleResult = value
      // hasUnit = unit (string)
      // phenomenonTime = sample date
      // hasSamplingPoint = sampling point info
      const det = nested(obs, "observedProperty");
      const detLabel = det ? str(det, "prefLabel") : "";
      const detNotation = det ? str(det, "notation") : "";

      const unit = typeof obs.hasUnit === "string" ? obs.hasUnit : "";
      const sampleDate = typeof obs.phenomenonTime === "string" ? obs.phenomenonTime : "";

      const spObj = nested(obs, "hasSamplingPoint");
      const spLabel = spObj ? str(spObj, "prefLabel") : samplingPointId;

      const rawValue = obs.hasSimpleResult;
      const value = typeof rawValue === "number" ? rawValue : parseFloat(String(rawValue ?? "0"));

      return {
        determinand: detLabel,
        determinandNotation: detNotation,
        value: isNaN(value) ? 0 : value,
        unit,
        sampleDate,
        samplingPointLabel: spLabel,
      };
    });
  } catch (err) {
    console.error(`[ea-api] fetchObservations(${samplingPointId}) failed:`, err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// 3. fetchPfasReadings
// ---------------------------------------------------------------------------

export async function fetchPfasReadings(
  lat: number,
  lng: number,
  radiusKm: number = 10
): Promise<PfasReading[]> {
  try {
    const samplingPoints = await fetchSamplingPointsNear(lat, lng, radiusKm);
    if (samplingPoints.length === 0) return [];

    // Limit concurrent requests to avoid overwhelming the API
    const pointsToQuery = samplingPoints.slice(0, 20);
    const observationResults = await Promise.all(
      pointsToQuery.map((sp) => fetchObservations(sp.id))
    );

    const pfasReadings: PfasReading[] = [];

    pointsToQuery.forEach((sp, index) => {
      const observations = observationResults[index];
      const distanceKm = haversineKm(lat, lng, sp.lat, sp.lng);

      for (const obs of observations) {
        if (isPfasDeterminand(obs.determinandNotation, obs.determinand)) {
          pfasReadings.push({
            samplingPointLabel: obs.samplingPointLabel || sp.label,
            determinand: obs.determinand,
            value: obs.value,
            unit: obs.unit,
            date: obs.sampleDate,
            distanceKm: Math.round(distanceKm * 100) / 100,
          });
        }
      }
    });

    return pfasReadings;
  } catch (err) {
    console.error("[ea-api] fetchPfasReadings failed:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// 4. searchDeterminands
// ---------------------------------------------------------------------------

export async function searchDeterminands(query: string): Promise<Determinand[]> {
  const cacheKey = query.toLowerCase().trim();
  const now = Date.now();

  const cached = determinandCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const url = `${BASE_URL}/codelist/determinand?search=${encodeURIComponent(query)}`;
  try {
    const json = (await eaFetch(url)) as Record<string, unknown>;
    const members = (json.member ?? json.items ?? []) as unknown[];

    const results: Determinand[] = members.map((item: unknown) => {
      const d = item as Record<string, unknown>;
      return {
        id: str(d, "id") || str(d, "@id"),
        label: str(d, "prefLabel") || str(d, "label"),
        notation: str(d, "notation"),
      };
    });

    determinandCache.set(cacheKey, { value: results, expiresAt: now + CACHE_TTL_MS });
    return results;
  } catch (err) {
    console.error(`[ea-api] searchDeterminands("${query}") failed:`, err);
    return [];
  }
}
