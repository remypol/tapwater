import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const maxDuration = 300; // 5 min max for Vercel

// ---------------------------------------------------------------------------
// PFAS compound name map (known determinand notations)
// ---------------------------------------------------------------------------

const PFAS_NAMES: Record<string, string> = {
  "2968": "PFOS",
  "2966": "PFOA",
  "2965": "PFHxS",
  "2963": "PFBS",
  "2969": "PFNA",
  "2967": "PFHpA",
  "2964": "PFDA",
};

// ---------------------------------------------------------------------------
// PFAS determinand detection (mirrored from ea-api.ts since not exported)
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
// City centroids (well-known approximate coordinates for each city)
// ---------------------------------------------------------------------------

interface CityCentroid {
  slug: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
}

const CITY_CENTROIDS: CityCentroid[] = [
  { slug: "london", name: "London", region: "England", lat: 51.5074, lng: -0.1278 },
  { slug: "manchester", name: "Manchester", region: "England", lat: 53.4808, lng: -2.2426 },
  { slug: "birmingham", name: "Birmingham", region: "England", lat: 52.4862, lng: -1.8904 },
  { slug: "leeds", name: "Leeds", region: "England", lat: 53.8008, lng: -1.5491 },
  { slug: "glasgow", name: "Glasgow", region: "Scotland", lat: 55.8642, lng: -4.2518 },
  { slug: "edinburgh", name: "Edinburgh", region: "Scotland", lat: 55.9533, lng: -3.1883 },
  { slug: "bristol", name: "Bristol", region: "England", lat: 51.4545, lng: -2.5879 },
  { slug: "liverpool", name: "Liverpool", region: "England", lat: 53.4084, lng: -2.9916 },
  { slug: "sheffield", name: "Sheffield", region: "England", lat: 53.3811, lng: -1.4701 },
  { slug: "newcastle", name: "Newcastle", region: "England", lat: 54.9783, lng: -1.6178 },
  { slug: "nottingham", name: "Nottingham", region: "England", lat: 52.9548, lng: -1.1581 },
  { slug: "cardiff", name: "Cardiff", region: "Wales", lat: 51.4816, lng: -3.1791 },
  { slug: "brighton", name: "Brighton", region: "England", lat: 50.8225, lng: -0.1372 },
  { slug: "oxford", name: "Oxford", region: "England", lat: 51.7520, lng: -1.2577 },
  { slug: "cambridge", name: "Cambridge", region: "England", lat: 52.2053, lng: 0.1218 },
  { slug: "bath", name: "Bath", region: "England", lat: 51.3811, lng: -2.3590 },
  { slug: "york", name: "York", region: "England", lat: 53.9591, lng: -1.0815 },
  { slug: "exeter", name: "Exeter", region: "England", lat: 50.7184, lng: -3.5339 },
  { slug: "swansea", name: "Swansea", region: "Wales", lat: 51.6214, lng: -3.9436 },
  { slug: "portsmouth", name: "Portsmouth", region: "England", lat: 50.8198, lng: -1.0880 },
  { slug: "leicester", name: "Leicester", region: "England", lat: 52.6369, lng: -1.1398 },
  { slug: "coventry", name: "Coventry", region: "England", lat: 52.4068, lng: -1.5197 },
  { slug: "derby", name: "Derby", region: "England", lat: 52.9225, lng: -1.4746 },
  { slug: "stoke-on-trent", name: "Stoke-on-Trent", region: "England", lat: 53.0027, lng: -2.1794 },
  { slug: "wolverhampton", name: "Wolverhampton", region: "England", lat: 52.5870, lng: -2.1288 },
  { slug: "plymouth", name: "Plymouth", region: "England", lat: 50.3755, lng: -4.1427 },
  { slug: "southampton", name: "Southampton", region: "England", lat: 50.9097, lng: -1.4044 },
  { slug: "reading", name: "Reading", region: "England", lat: 51.4543, lng: -0.9781 },
  { slug: "northampton", name: "Northampton", region: "England", lat: 52.2405, lng: -0.9027 },
  { slug: "sunderland", name: "Sunderland", region: "England", lat: 54.9069, lng: -1.3838 },
  { slug: "warrington", name: "Warrington", region: "England", lat: 53.3900, lng: -2.5970 },
  { slug: "huddersfield", name: "Huddersfield", region: "England", lat: 53.6450, lng: -1.7798 },
  { slug: "blackpool", name: "Blackpool", region: "England", lat: 53.8142, lng: -3.0503 },
  { slug: "ipswich", name: "Ipswich", region: "England", lat: 52.0567, lng: 1.1482 },
  { slug: "norwich", name: "Norwich", region: "England", lat: 52.6309, lng: 1.2974 },
  { slug: "preston", name: "Preston", region: "England", lat: 53.7632, lng: -2.7031 },
  { slug: "gloucester", name: "Gloucester", region: "England", lat: 51.8642, lng: -2.2382 },
  { slug: "cheltenham", name: "Cheltenham", region: "England", lat: 51.8994, lng: -2.0783 },
  { slug: "lincoln", name: "Lincoln", region: "England", lat: 53.2307, lng: -0.5406 },
  { slug: "dundee", name: "Dundee", region: "Scotland", lat: 56.4620, lng: -2.9707 },
  { slug: "aberdeen", name: "Aberdeen", region: "Scotland", lat: 57.1497, lng: -2.0943 },
  { slug: "inverness", name: "Inverness", region: "Scotland", lat: 57.4778, lng: -4.2247 },
  { slug: "middlesbrough", name: "Middlesbrough", region: "England", lat: 54.5742, lng: -1.2350 },
  { slug: "bradford", name: "Bradford", region: "England", lat: 53.7960, lng: -1.7594 },
  { slug: "hull", name: "Hull", region: "England", lat: 53.7676, lng: -0.3274 },
  { slug: "blackburn", name: "Blackburn", region: "England", lat: 53.7488, lng: -2.4847 },
  { slug: "wigan", name: "Wigan", region: "England", lat: 53.5448, lng: -2.6318 },
  { slug: "stockport", name: "Stockport", region: "England", lat: 53.4106, lng: -2.1575 },
  { slug: "swindon", name: "Swindon", region: "England", lat: 51.5558, lng: -1.7797 },
  { slug: "bournemouth", name: "Bournemouth", region: "England", lat: 50.7192, lng: -1.8808 },
];

// ---------------------------------------------------------------------------
// EA API helpers
// ---------------------------------------------------------------------------

const EA_BASE = "https://environment.data.gov.uk/water-quality";

async function eaFetch(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/ld+json" },
  });
  if (!response.ok) {
    throw new Error(`EA API error ${response.status} for ${url}`);
  }
  return response.json();
}

function str(obj: unknown, key: string): string {
  if (typeof obj !== "object" || obj === null) return "";
  const val = (obj as Record<string, unknown>)[key];
  return typeof val === "string" ? val : String(val ?? "");
}

function nested(obj: unknown, key: string): Record<string, unknown> | null {
  if (typeof obj !== "object" || obj === null) return null;
  const val = (obj as Record<string, unknown>)[key];
  if (typeof val === "object" && val !== null) return val as Record<string, unknown>;
  return null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Compound name from determinand notation/label
// ---------------------------------------------------------------------------

function getCompoundName(notation: string, label: string): string {
  if (PFAS_NAMES[notation]) return PFAS_NAMES[notation];
  return label || `PFAS-${notation}`;
}

// ---------------------------------------------------------------------------
// Fetch sampling points near a coordinate
// ---------------------------------------------------------------------------

interface SamplingPointInfo {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

async function fetchSamplingPoints(
  lat: number,
  lng: number
): Promise<SamplingPointInfo[]> {
  const url = `${EA_BASE}/sampling-point?latitude=${lat}&longitude=${lng}&radius=15&limit=100`;
  const json = (await eaFetch(url)) as Record<string, unknown>;
  const members = (json.member ?? []) as unknown[];

  return members.map((item) => {
    const sp = item as Record<string, unknown>;
    const notation = str(sp, "notation");
    const label = str(sp, "prefLabel") || str(sp, "altLabel") || notation;
    return { id: notation, label, lat, lng };
  });
}

// ---------------------------------------------------------------------------
// Fetch observations for a sampling point, filtered to recent years
// ---------------------------------------------------------------------------

interface PfasObservation {
  samplingPointLabel: string;
  compound: string;
  determinandNotation: string;
  value: number;
  unit: string;
  sampleDate: string;
}

async function fetchPfasObservations(
  samplingPointId: string,
  samplingPointLabel: string,
  minYear: number
): Promise<PfasObservation[]> {
  const url =
    `${EA_BASE}/sampling-point/${encodeURIComponent(samplingPointId)}` +
    `/observation?minyear=${minYear}&limit=500`;

  const json = (await eaFetch(url)) as Record<string, unknown>;
  const members = (json.member ?? []) as unknown[];
  const results: PfasObservation[] = [];

  for (const item of members) {
    const obs = item as Record<string, unknown>;

    const det = nested(obs, "observedProperty");
    const detLabel = det ? str(det, "prefLabel") : "";
    const detNotation = det ? str(det, "notation") : "";

    if (!isPfasDeterminand(detNotation, detLabel)) continue;

    const unit = typeof obs.hasUnit === "string" ? obs.hasUnit : "";
    const sampleDate =
      typeof obs.phenomenonTime === "string" ? obs.phenomenonTime : "";

    const rawValue = obs.hasSimpleResult;
    const value =
      typeof rawValue === "number" ? rawValue : parseFloat(String(rawValue ?? "0"));

    results.push({
      samplingPointLabel:
        (nested(obs, "hasSamplingPoint")
          ? str(nested(obs, "hasSamplingPoint")!, "prefLabel")
          : "") || samplingPointLabel,
      compound: getCompoundName(detNotation, detLabel),
      determinandNotation: detNotation,
      value: isNaN(value) ? 0 : value,
      unit,
      sampleDate,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // Authenticate
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.length < 24) {
    console.error("[pfas-cron] CRON_SECRET is missing or too short (min 24 chars)");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabase();
  const minYear = new Date().getFullYear() - 3;
  let citiesProcessed = 0;
  let totalDetections = 0;
  const errors: string[] = [];

  for (const city of CITY_CENTROIDS) {
    try {
      console.log(`[pfas-cron] Processing ${city.name}...`);

      // 1. Fetch sampling points within 15km
      const samplingPoints = await fetchSamplingPoints(city.lat, city.lng);
      await delay(200);

      if (samplingPoints.length === 0) {
        console.log(`[pfas-cron] No sampling points near ${city.name}`);
        citiesProcessed++;
        continue;
      }

      const rows: Record<string, unknown>[] = [];

      // 2. For each sampling point, fetch PFAS observations
      for (const sp of samplingPoints) {
        try {
          const observations = await fetchPfasObservations(sp.id, sp.label, minYear);
          await delay(200);

          for (const obs of observations) {
            rows.push({
              sampling_point_id: sp.id,
              sampling_point_label: obs.samplingPointLabel,
              lat: sp.lat,
              lng: sp.lng,
              city: city.name,
              region: city.region,
              compound: obs.compound,
              determinand_notation: obs.determinandNotation,
              value: obs.value,
              unit: obs.unit,
              sample_date: obs.sampleDate,
            });
          }
        } catch (err) {
          console.error(
            `[pfas-cron] Error fetching observations for ${sp.id} (${city.name}):`,
            err
          );
        }
      }

      // 3. Upsert into Supabase
      if (rows.length > 0) {
        // Upsert in chunks of 100 to stay within payload limits
        for (let i = 0; i < rows.length; i += 100) {
          const chunk = rows.slice(i, i + 100);
          const { error } = await db.from("pfas_detections").upsert(chunk, {
            onConflict: "sampling_point_id,determinand_notation,sample_date",
            ignoreDuplicates: true,
          });
          if (error) {
            console.error(
              `[pfas-cron] Supabase upsert error for ${city.name}:`,
              error.message
            );
            errors.push(`${city.name}: upsert error — ${error.message}`);
          }
        }
        totalDetections += rows.length;
        console.log(`[pfas-cron] ${city.name}: ${rows.length} PFAS detections upserted`);
      }

      citiesProcessed++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[pfas-cron] Error processing ${city.name}:`, message);
      errors.push(`${city.name}: ${message}`);
      citiesProcessed++;
    }
  }

  console.log(
    `[pfas-cron] Complete: ${citiesProcessed} cities, ${totalDetections} detections, ${errors.length} errors`
  );

  return NextResponse.json({
    citiesProcessed,
    totalDetections,
    errors,
  });
}
