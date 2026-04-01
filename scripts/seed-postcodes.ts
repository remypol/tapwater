/**
 * Seed script: Fetch real UK postcode data + EA environmental readings
 *
 * Phase 1 target: 50 postcodes (London zones + top UK cities)
 * Uses: postcodes.io (free, no key) + EA Water Quality API
 *
 * Output: JSON files in /src/data/ for static site generation
 * (Later: write directly to Supabase)
 *
 * Run: npx tsx scripts/seed-postcodes.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// ── Target postcodes (Phase 1: 50) ──

const TARGET_POSTCODES = [
  // London (20)
  "SW1A", "SW1V", "SW3", "SW7", "SE1", "SE10",
  "E1", "E14", "EC1", "EC2",
  "W1", "W2", "W8", "WC1", "WC2",
  "N1", "NW1", "NW3", "NW10", "N7",
  // Manchester (5)
  "M1", "M2", "M4", "M20", "M60",
  // Birmingham (4)
  "B1", "B2", "B5", "B15",
  // Leeds (3)
  "LS1", "LS2", "LS6",
  // Bristol (3)
  "BS1", "BS2", "BS8",
  // Liverpool (3)
  "L1", "L2", "L3",
  // Sheffield (2)
  "S1", "S10",
  // Edinburgh (2)
  "EH1", "EH3",
  // Cardiff (2)
  "CF1", "CF10",
  // Newcastle (2)
  "NE1", "NE2",
  // Nottingham (2)
  "NG1", "NG7",
  // Oxford & Cambridge (2)
  "OX1", "CB1",
];

// ── Types ──

interface PostcodeInfo {
  district: string;
  areaName: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
}

interface EASamplingPoint {
  id: string;
  label: string;
  type: string;
}

interface EAObservation {
  determinand: string;
  determinandNotation: string;
  value: number;
  unit: string;
  sampleDate: string;
}

interface PostcodeSeedData {
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

async function lookupPostcode(district: string): Promise<PostcodeInfo | null> {
  // postcodes.io needs a full postcode, not a district
  // Use the outcode (district) endpoint instead
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
  } catch (e) {
    console.error(`  [postcodes.io] Failed for ${district}:`, e);
    return null;
  }
}

// ── EA Water Quality API ──

const EA_BASE = "https://environment.data.gov.uk/water-quality";

async function fetchNearbySamplingPoints(
  lat: number,
  lng: number,
  radiusKm = 5
): Promise<EASamplingPoint[]> {
  const url = `${EA_BASE}/sampling-point?latitude=${lat}&longitude=${lng}&radius=${radiusKm}&limit=20`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/ld+json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const members = (data.member ?? []) as Record<string, unknown>[];

    return members.map((sp) => ({
      id: String(sp.notation ?? ""),
      label: String(sp.prefLabel ?? sp.altLabel ?? sp.notation ?? ""),
      type: (() => {
        const t = sp.samplingPointType;
        if (typeof t === "object" && t !== null) return String((t as Record<string, unknown>).prefLabel ?? "");
        return "";
      })(),
    }));
  } catch {
    return [];
  }
}

async function fetchRecentObservations(
  pointId: string,
  limit = 100
): Promise<EAObservation[]> {
  const url = `${EA_BASE}/sampling-point/${encodeURIComponent(pointId)}/observation?limit=${limit}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/ld+json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const members = (data.member ?? []) as Record<string, unknown>[];

    return members
      .map((obs) => {
        // EA API field names (verified April 2026):
        // observedProperty.prefLabel = determinand name
        // observedProperty.notation = determinand ID
        // hasSimpleResult = value (string or number)
        // hasUnit = unit (string, not object)
        // phenomenonTime = sample datetime
        const det = obs.observedProperty as Record<string, unknown> | undefined;
        const rawVal = obs.hasSimpleResult;
        const unit = typeof obs.hasUnit === "string" ? obs.hasUnit : "";
        const date = typeof obs.phenomenonTime === "string" ? obs.phenomenonTime : "";

        // Skip non-numeric results (e.g., "No flow", "Present")
        const numVal = typeof rawVal === "number" ? rawVal : parseFloat(String(rawVal ?? ""));

        return {
          determinand: det ? String(det.prefLabel ?? det.altLabel ?? "") : "",
          determinandNotation: det ? String(det.notation ?? "") : "",
          value: isNaN(numVal) ? 0 : numVal,
          unit,
          sampleDate: date,
          isNumeric: !isNaN(numVal),
        };
      })
      .filter((o) => o.isNumeric && o.determinand)
      .map(({ isNumeric: _, ...rest }) => rest);
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

// ── Main ──

async function seedPostcode(district: string): Promise<PostcodeSeedData | null> {
  // Step 1: Get postcode info
  const info = await lookupPostcode(district);
  if (!info) {
    console.log(`  ✗ ${district} — not found on postcodes.io`);
    return null;
  }
  console.log(`  ✓ ${district} → ${info.areaName}, ${info.region} (${info.latitude}, ${info.longitude})`);

  // Step 2: Find nearby EA sampling points
  const points = await fetchNearbySamplingPoints(info.latitude, info.longitude, 5);
  console.log(`    ${points.length} sampling points within 5km`);

  // Step 3: Fetch observations from top 5 sampling points
  const pointsToQuery = points.slice(0, 5);
  const allObservations: { obs: EAObservation; pointLabel: string }[] = [];

  for (const point of pointsToQuery) {
    const observations = await fetchRecentObservations(point.id, 50);
    for (const obs of observations) {
      allObservations.push({ obs, pointLabel: point.label });
    }
    // Rate limit: small delay between requests
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`    ${allObservations.length} total observations fetched`);

  // Step 4: Check for PFAS
  const pfasReadings = allObservations.filter((o) =>
    isPfas(o.obs.determinandNotation, o.obs.determinand)
  );
  const pfasDetected = pfasReadings.length > 0;
  if (pfasDetected) {
    console.log(`    ⚠ PFAS detected: ${pfasReadings.length} readings`);
  }

  // Step 5: Get top readings (most recent per determinand)
  const seenDeterminands = new Set<string>();
  const topReadings = allObservations
    .filter((o) => {
      if (seenDeterminands.has(o.obs.determinand)) return false;
      seenDeterminands.add(o.obs.determinand);
      return true;
    })
    .slice(0, 20)
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
    pfasDetected,
    topReadings,
  };
}

async function main() {
  console.log(`\nSeeding ${TARGET_POSTCODES.length} postcodes...\n`);

  const results: PostcodeSeedData[] = [];
  let pfasCount = 0;

  for (const district of TARGET_POSTCODES) {
    const data = await seedPostcode(district);
    if (data) {
      results.push(data);
      if (data.pfasDetected) pfasCount++;
    }
    // Rate limit between postcodes
    await new Promise((r) => setTimeout(r, 300));
  }

  // Write output
  const outDir = join(process.cwd(), "src", "data");
  mkdirSync(outDir, { recursive: true });

  const outPath = join(outDir, "seed-postcodes.json");
  writeFileSync(outPath, JSON.stringify(results, null, 2));

  console.log(`\n─────────────────────────────────`);
  console.log(`Done! ${results.length}/${TARGET_POSTCODES.length} postcodes seeded`);
  console.log(`PFAS detected in ${pfasCount} areas`);
  console.log(`Total observations: ${results.reduce((a, r) => a + r.recentObservations, 0)}`);
  console.log(`Output: ${outPath}`);
  console.log(`─────────────────────────────────\n`);
}

main().catch(console.error);
