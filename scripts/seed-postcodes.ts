/**
 * Seed script: Fetch real UK postcode data + EA environmental readings
 *
 * Pulls water quality data from EA Water Quality API, filtering for
 * water-type sampling points only (rivers, groundwater, lakes).
 * Excludes biota, sediment, sewage, and trade discharge data.
 *
 * Output: JSON files in /src/data/ for static site generation
 *
 * Run: npx tsx scripts/seed-postcodes.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// ── Target postcodes ──

const TARGET_POSTCODES = [
  // London — SW (11)
  "SW1A", "SW1V", "SW3", "SW5", "SW6", "SW7", "SW10", "SW11", "SW15", "SW18", "SW19",
  // London — SE (12)
  "SE1", "SE3", "SE5", "SE10", "SE13", "SE15", "SE16", "SE18", "SE22", "SE23", "SE25",
  // London — E (17)
  "E1", "E2", "E3", "E5", "E6", "E7", "E8", "E9", "E10", "E11", "E13", "E14", "E15", "E16", "E17",
  // London — N (15)
  "N1", "N4", "N5", "N7", "N8", "N10", "N11", "N12", "N13", "N15", "N16", "N17", "N19", "N22",
  // London — NW (9)
  "NW1", "NW2", "NW3", "NW5", "NW6", "NW8", "NW9", "NW10", "NW11",
  // London — W (13)
  "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12", "W13", "W14",
  // Manchester (10)
  "M1", "M2", "M3", "M4", "M5", "M8", "M11", "M14", "M20", "M21",
  // Birmingham (16)
  "B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9", "B10", "B11", "B12", "B13", "B14", "B15", "B16",
  // Leeds (8)
  "LS1", "LS2", "LS3", "LS4", "LS5", "LS6", "LS7", "LS8",
  // Bristol (8)
  "BS1", "BS2", "BS3", "BS4", "BS5", "BS6", "BS7", "BS8",
  // Liverpool (8)
  "L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8",
  // Sheffield (9)
  "S1", "S2", "S3", "S5", "S6", "S7", "S8", "S10", "S11",
  // Edinburgh (8)
  "EH1", "EH2", "EH3", "EH4", "EH6", "EH7", "EH8", "EH9",
  // Glasgow (8)
  "G1", "G2", "G3", "G4", "G5", "G11", "G12", "G20",
  // Cardiff (6)
  "CF5", "CF10", "CF11", "CF14", "CF23", "CF24",
  // Newcastle (6)
  "NE1", "NE2", "NE3", "NE4", "NE5", "NE6",
  // Nottingham (6)
  "NG1", "NG2", "NG3", "NG5", "NG7", "NG9",
  // Oxford (4)
  "OX1", "OX2", "OX3", "OX4",
  // Cambridge (4)
  "CB1", "CB2", "CB3", "CB4",
  // Brighton (3)
  "BN1", "BN2", "BN3",
  // Southampton (4)
  "SO14", "SO15", "SO16", "SO17",
  // Portsmouth (4)
  "PO1", "PO2", "PO4", "PO5",
  // Reading (4)
  "RG1", "RG2", "RG4", "RG6",
  // Leicester (3)
  "LE1", "LE2", "LE3",
  // Coventry (4)
  "CV1", "CV2", "CV3", "CV4",
  // York (4)
  "YO1", "YO10", "YO24", "YO31",
  // Bath (2)
  "BA1", "BA2",
  // Exeter (3)
  "EX1", "EX2", "EX4",
  // Norwich (3)
  "NR1", "NR2", "NR3",
  // Plymouth (3)
  "PL1", "PL2", "PL4",
  // Derby (3)
  "DE1", "DE21", "DE22",
  // Swansea (2)
  "SA1", "SA2",
  // Aberdeen (4)
  "AB10", "AB11", "AB24", "AB25",
];

// ── Sampling point types that measure water quality (not biota/sediment/sewage) ──

const WATER_POINT_TYPES = [
  "F6",   // FRESHWATER - RIVERS
  "FA",   // FRESHWATER - LAKES/PONDS/RESERVOIRS
  "FL",   // FRESHWATER - BATHING WATER
  "FB",   // FRESHWATER - CANALS
  "BA",   // GROUNDWATER - BOREHOLE
  "BB",   // GROUNDWATER - SPRING
];

// Units that represent water quality measurements (not tissue/sediment)
const WATER_UNITS = new Set([
  "mg/l", "ug/l", "µg/l", "ng/l",
  "phunits", "ph",
  "ntu", "ftu",  // turbidity
  "cel", "°c",   // temperature
  "us/cm", "µs/cm", "ms/cm",  // conductivity
  "no/100ml", "cfu/100ml", "count/100ml",
  "hazen",  // colour
]);

function isWaterUnit(unit: string): boolean {
  const lower = unit.toLowerCase().trim();
  return [...WATER_UNITS].some((wu) => lower.startsWith(wu) || lower.includes("/l"));
}

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
  typeNotation: string;
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

/**
 * Fetch water-type sampling points near a location.
 * Queries each water point type separately to ensure we only get relevant data.
 * Falls back to wider radius if nothing found within initial radius.
 */
async function fetchWaterSamplingPoints(
  lat: number,
  lng: number,
): Promise<EASamplingPoint[]> {
  const allPoints: EASamplingPoint[] = [];
  const seenIds = new Set<string>();

  // Try each water type, starting with 5km radius, expanding to 10km if needed
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
      // Small delay between type queries
      await new Promise((r) => setTimeout(r, 100));
    }

    // If we found enough points at this radius, stop
    if (allPoints.length >= 3) break;
  }

  return allPoints;
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
      // Only keep numeric water-unit observations
      .filter((o) => o.isNumeric && o.determinand && o.isWater)
      .map(({ isNumeric: _, isWater: _2, ...rest }) => rest);
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

  // Step 2: Find nearby water-type EA sampling points
  const points = await fetchWaterSamplingPoints(info.latitude, info.longitude);
  console.log(`    ${points.length} water sampling points found`);
  if (points.length > 0) {
    console.log(`    Types: ${[...new Set(points.map((p) => p.typeNotation))].join(", ")}`);
  }

  // Step 3: Fetch observations from top 5 sampling points
  const pointsToQuery = points.slice(0, 5);
  const allObservations: { obs: EAObservation; pointLabel: string }[] = [];

  for (const point of pointsToQuery) {
    const observations = await fetchRecentObservations(point.id, 50);
    for (const obs of observations) {
      allObservations.push({ obs, pointLabel: point.label });
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`    ${allObservations.length} water observations fetched`);

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
    pfasDetected,
    topReadings,
  };
}

async function main() {
  console.log(`\nSeeding ${TARGET_POSTCODES.length} postcodes (water-only sampling points)...\n`);

  const results: PostcodeSeedData[] = [];
  let pfasCount = 0;
  let noWaterData = 0;

  for (let i = 0; i < TARGET_POSTCODES.length; i++) {
    const district = TARGET_POSTCODES[i];
    const position = i + 1;
    if (position % 10 === 0 || position === 1 || position === TARGET_POSTCODES.length) {
      console.log(`\n[${position}/${TARGET_POSTCODES.length}] Progress: ${Math.round((position / TARGET_POSTCODES.length) * 100)}%`);
    }
    const data = await seedPostcode(district);
    if (data) {
      results.push(data);
      if (data.pfasDetected) pfasCount++;
      if (data.topReadings.length === 0) noWaterData++;
    }
    // Rate limit between postcodes
    await new Promise((r) => setTimeout(r, 100));
  }

  // Write output
  const outDir = join(process.cwd(), "src", "data");
  mkdirSync(outDir, { recursive: true });

  const outPath = join(outDir, "seed-postcodes.json");
  writeFileSync(outPath, JSON.stringify(results, null, 2));

  console.log(`\n─────────────────────────────────`);
  console.log(`Done! ${results.length}/${TARGET_POSTCODES.length} postcodes seeded`);
  console.log(`PFAS detected in ${pfasCount} areas`);
  console.log(`No water readings: ${noWaterData} areas`);
  console.log(`Total observations: ${results.reduce((a, r) => a + r.recentObservations, 0)}`);
  console.log(`Output: ${outPath}`);
  console.log(`─────────────────────────────────\n`);
}

main().catch(console.error);
