/**
 * River health, as classified by the Environment Agency.
 *
 * Every six years (with interim updates) the Environment Agency grades each river
 * catchment, estuary and coastal water in England under the Water Environment (Water Framework Directive)
 * Regulations: an ecological class (High / Good / Moderate / Poor / Bad) built from
 * wildlife, water chemistry and habitat elements, and a chemical status (Good / Fail)
 * for a list of priority substances. The 2025 results were published on 6 August 2026
 * and every surface water body failed the chemical test, almost entirely on mercury,
 * PFOS and PBDEs.
 *
 * This is about rivers, not tap water. It sits beside the Environment Agency samples
 * we already show and answers the question those numbers cannot: how does the
 * regulator itself rate the river?
 *
 * Everything in this file is pure so it can be unit-tested. Loading from Supabase is
 * in `river-status-data.ts`; fetching from the Environment Agency is in
 * `river-status-ingest.ts`.
 */

export type EcologicalClass = "High" | "Good" | "Moderate" | "Poor" | "Bad";

export const ECOLOGICAL_CLASSES: EcologicalClass[] = ["High", "Good", "Moderate", "Poor", "Bad"];

/** One element of the ecological assessment, e.g. fish or phosphate. */
export interface RiverElement {
  key: string;
  label: string;
  status: string;
}

export type WaterBodyType = "River" | "Transitional" | "Coastal";

export interface RiverStatus {
  waterBodyId: string;
  name: string;
  /** Transitional is the regulator's word for an estuary. */
  type: WaterBodyType;
  /** "Heavily Modified", "Artificial" or null for a natural river. */
  modified: string | null;
  riverBasinDistrict: string;
  managementCatchment: string;
  operationalCatchment: string;
  classificationYear: number;
  ecologicalClass: EcologicalClass | null;
  /** "Good" | "Fail" | other EA wording such as "Does not require assessment". */
  chemicalClass: string | null;
  /** The uPBT group (mercury, PFOS, PBDEs and similar) on its own. */
  priorityHazardousClass: string | null;
  /** "Higher Status" | "Lower Status" | "Same Status" since the previous classification. */
  ecologicalChange: string | null;
  /** Name of the drinking water protected area when the river is a source for tap water. */
  drinkingWaterProtectedArea: string | null;
  elements: RiverElement[];
}

/** Property name in the EA dataset → the label a normal person would recognise. */
export const ELEMENT_LABELS: Record<string, string> = {
  fish_class: "Fish",
  invertebrates_class: "Insects and other small river life",
  macrophytes_phytobenthos_combined_class: "Water plants and algae",
  ammonia_phys_chem_class: "Ammonia",
  biological_oxygen_demand_class: "Organic pollution (BOD)",
  dissolved_oxygen_class: "Dissolved oxygen",
  ph_class: "Acidity (pH)",
  phosphate_class: "Phosphate",
  temperature_class: "Temperature",
  specific_pollutants_class: "Specific pollutants",
  hydrological_regime_class: "Water flow",
  // Estuaries and coastal waters
  phytoplankton_blooms_class: "Algal blooms",
  dissolved_inorganic_nitrogen_class: "Nitrogen",
  angiosperms_class: "Seagrass and saltmarsh",
  macroalgae_class: "Seaweed",
};

const RANK: Record<string, number> = { High: 0, Good: 1, Moderate: 2, Poor: 3, Bad: 4 };

export function isEcologicalClass(v: unknown): v is EcologicalClass {
  return typeof v === "string" && v in RANK;
}

function text(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

/** The estuary dataset shouts ("THAMES MIDDLE"); the river dataset does not. */
function tidyName(name: string): string {
  if (name !== name.toUpperCase()) return name;
  return name.toLowerCase().replace(/(^|[\s(/-])([a-z])/g, (_, pre: string, c: string) => pre + c.toUpperCase());
}

function waterBodyType(v: unknown): WaterBodyType {
  return v === "Transitional" || v === "Coastal" ? v : "River";
}

/**
 * Map one feature's `properties` from the EA OGC API to a RiverStatus. Returns null
 * when the record has no id or name, which would make it unusable on a page.
 */
export function parseRiverFeature(props: Record<string, unknown>): RiverStatus | null {
  const waterBodyId = text(props.water_body_id);
  const rawName = text(props.water_body_name);
  if (!waterBodyId || !rawName) return null;
  const name = tidyName(rawName);

  const hmd = text(props.water_body_hmd);
  const modified = hmd && !/^not designated/i.test(hmd) ? hmd : null;

  const elements: RiverElement[] = [];
  for (const [key, label] of Object.entries(ELEMENT_LABELS)) {
    const status = text(props[key]);
    if (status && isEcologicalClass(status)) elements.push({ key, label, status });
  }

  const eco = text(props.ecological_class);
  const year = Number(props.classification_year);

  return {
    waterBodyId,
    name,
    type: waterBodyType(props.water_body_type),
    modified,
    riverBasinDistrict: text(props.river_basin_district) ?? "",
    managementCatchment: text(props.management_catchment) ?? "",
    operationalCatchment: text(props.operational_catchment) ?? "",
    classificationYear: Number.isFinite(year) ? year : 0,
    ecologicalClass: isEcologicalClass(eco) ? eco : null,
    chemicalClass: text(props.chemical_class),
    priorityHazardousClass: text(props.priority_hazardous_substances),
    ecologicalChange: text(props.class_change_eco),
    drinkingWaterProtectedArea: text(props.drinking_water_protected_area),
    elements,
  };
}

// ── Geometry ───────────────────────────────────────────────────────────────────

type Ring = number[][];
export type PolygonCoords = Ring[];
export type CatchmentGeometry =
  | { type: "Polygon"; coordinates: PolygonCoords }
  | { type: "MultiPolygon"; coordinates: PolygonCoords[] };

function inRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function inPolygon(lng: number, lat: number, polygon: PolygonCoords): boolean {
  if (polygon.length === 0 || !inRing(lng, lat, polygon[0])) return false;
  for (let i = 1; i < polygon.length; i++) {
    if (inRing(lng, lat, polygon[i])) return false; // inside a hole
  }
  return true;
}

/** Ray-casting point-in-polygon for GeoJSON Polygon and MultiPolygon (lng, lat order). */
export function pointInGeometry(lng: number, lat: number, geometry: CatchmentGeometry): boolean {
  if (geometry.type === "Polygon") return inPolygon(lng, lat, geometry.coordinates);
  return geometry.coordinates.some((p) => inPolygon(lng, lat, p));
}

export interface BBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export function geometryBBox(geometry: CatchmentGeometry): BBox {
  const box: BBox = { minLng: Infinity, minLat: Infinity, maxLng: -Infinity, maxLat: -Infinity };
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  for (const polygon of polygons) {
    for (const [lng, lat] of polygon[0] ?? []) {
      if (lng < box.minLng) box.minLng = lng;
      if (lng > box.maxLng) box.maxLng = lng;
      if (lat < box.minLat) box.minLat = lat;
      if (lat > box.maxLat) box.maxLat = lat;
    }
  }
  return box;
}

export interface CatchmentShape {
  waterBodyId: string;
  bbox: BBox;
  geometry: CatchmentGeometry;
}

/**
 * The catchment a point drains into, or null when it falls in none (Scotland, Wales,
 * Northern Ireland, and coastal strips that belong to an estuary rather than a river).
 */
export function findCatchment(lng: number, lat: number, shapes: CatchmentShape[]): string | null {
  for (const s of shapes) {
    const b = s.bbox;
    if (lng < b.minLng || lng > b.maxLng || lat < b.minLat || lat > b.maxLat) continue;
    if (pointInGeometry(lng, lat, s.geometry)) return s.waterBodyId;
  }
  return null;
}

/** Equirectangular distance in km; accurate to well under 1% at these ranges. */
function approxKm(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const x = (lng2 - lng1) * Math.cos((((lat1 + lat2) / 2) * Math.PI) / 180);
  const y = lat2 - lat1;
  return Math.sqrt(x * x + y * y) * 111.32;
}

/**
 * The closest water body to a point that sits inside none: central London beside the
 * tidal Thames, Liverpool on the Mersey, seaside towns. Distance is measured to the
 * outline's vertices, which on these simplified outlines is within a few hundred metres
 * of the true edge and only has to rank candidates.
 */
export function nearestWaterBody(
  lng: number,
  lat: number,
  shapes: CatchmentShape[],
  maxKm: number,
): { waterBodyId: string; distanceKm: number } | null {
  const padLat = maxKm / 111.32;
  const padLng = padLat / Math.cos((lat * Math.PI) / 180);
  let best: { waterBodyId: string; distanceKm: number } | null = null;
  for (const s of shapes) {
    const b = s.bbox;
    if (lng < b.minLng - padLng || lng > b.maxLng + padLng || lat < b.minLat - padLat || lat > b.maxLat + padLat) continue;
    const polygons = s.geometry.type === "Polygon" ? [s.geometry.coordinates] : s.geometry.coordinates;
    for (const polygon of polygons) {
      for (const [vLng, vLat] of polygon[0] ?? []) {
        const km = approxKm(lng, lat, vLng, vLat);
        if (km <= maxKm && (!best || km < best.distanceKm)) best = { waterBodyId: s.waterBodyId, distanceKm: km };
      }
    }
  }
  return best ? { ...best, distanceKm: Math.round(best.distanceKm * 10) / 10 } : null;
}

// ── Plain-language reading of a classification ─────────────────────────────────

/** Elements rated worse than Good, worst first: the reasons a river misses "good". */
export function failingElements(status: RiverStatus): RiverElement[] {
  return status.elements
    .filter((e) => RANK[e.status] > RANK.Good)
    .sort((a, b) => RANK[b.status] - RANK[a.status]);
}

export function chemicalFails(status: RiverStatus): boolean {
  return status.chemicalClass === "Fail";
}

/** True when the only chemical failure is the persistent legacy group (mercury, PFOS, PBDEs). */
export function failsOnLegacyChemicalsOnly(status: RiverStatus): boolean {
  return chemicalFails(status) && status.priorityHazardousClass === "Fail";
}

const ECO_MEANING: Record<EcologicalClass, string> = {
  High: "close to its natural state",
  Good: "only slightly changed from its natural state",
  Moderate: "noticeably changed by pollution or engineering",
  Poor: "badly affected, with much of the expected wildlife missing",
  Bad: "severely damaged, with most of the expected wildlife missing",
};

export function ecologicalMeaning(c: EcologicalClass): string {
  return ECO_MEANING[c];
}

function listLabels(items: RiverElement[]): string {
  const names = items.map((e) => e.label.toLowerCase());
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** "river", "estuary" or "coastal water": the everyday word for the water body's type. */
export function waterBodyNoun(type: WaterBodyType): string {
  return type === "Transitional" ? "estuary" : type === "Coastal" ? "coastal water" : "river";
}

/** Two or three sentences a resident can read without knowing what the WFD is. */
export function describeRiverStatus(status: RiverStatus): string {
  const parts: string[] = [];
  const year = status.classificationYear || 2025;

  if (status.ecologicalClass) {
    parts.push(
      `The Environment Agency rated the ${status.name} as ${status.ecologicalClass.toLowerCase()} for ecological health in its ${year} assessment, meaning the ${waterBodyNoun(status.type)} is ${ECO_MEANING[status.ecologicalClass]}.`,
    );
    const failing = failingElements(status).slice(0, 3);
    if (failing.length > 0) {
      parts.push(`It is held back by ${listLabels(failing)}.`);
    }
  }

  if (chemicalFails(status)) {
    parts.push(
      "It fails the chemical test, as every river, estuary and stretch of coast in England does, because of long-lasting pollutants such as mercury, PFOS (a forever chemical) and old flame retardants.",
    );
  }

  if (status.ecologicalChange === "Higher Status") {
    parts.push("Its ecological rating has improved since the previous assessment.");
  } else if (status.ecologicalChange === "Lower Status") {
    parts.push("Its ecological rating has dropped since the previous assessment.");
  }

  return parts.join(" ");
}

// ── Aggregates ────────────────────────────────────────────────────────────────

export interface RiverStatusSummary {
  total: number;
  classificationYear: number;
  byEcologicalClass: Record<EcologicalClass, number>;
  goodOrBetter: number;
  goodOrBetterPct: number;
  chemicalAssessed: number;
  chemicalFail: number;
}

export function summariseRivers(rivers: RiverStatus[]): RiverStatusSummary {
  const byEcologicalClass: Record<EcologicalClass, number> = {
    High: 0,
    Good: 0,
    Moderate: 0,
    Poor: 0,
    Bad: 0,
  };
  let classified = 0;
  let chemicalAssessed = 0;
  let chemicalFail = 0;
  let year = 0;
  for (const r of rivers) {
    if (r.ecologicalClass) {
      byEcologicalClass[r.ecologicalClass]++;
      classified++;
    }
    if (r.chemicalClass === "Fail" || r.chemicalClass === "Good") {
      chemicalAssessed++;
      if (r.chemicalClass === "Fail") chemicalFail++;
    }
    if (r.classificationYear > year) year = r.classificationYear;
  }
  const goodOrBetter = byEcologicalClass.High + byEcologicalClass.Good;
  return {
    total: classified,
    classificationYear: year,
    byEcologicalClass,
    goodOrBetter,
    goodOrBetterPct: classified > 0 ? Math.round((goodOrBetter / classified) * 1000) / 10 : 0,
    chemicalAssessed,
    chemicalFail,
  };
}

/** URL of the water body on the Environment Agency's Catchment Data Explorer. */
export function catchmentExplorerUrl(waterBodyId: string): string {
  return `https://environment.data.gov.uk/catchment-planning/WaterBody/${encodeURIComponent(waterBodyId)}`;
}

// ── Pipeline health ───────────────────────────────────────────────────────────

/** `source_checks.source` for the monthly river classification ingest. */
export const RIVER_STATUS_SOURCE = "ea-river-status";

/** Issues for the weekly health report: the monthly ingest failed or has stopped running. */
export function describeRiverStatusHealth(
  lastRun: { checked_at: string; error: string | null } | null,
  now: Date = new Date(),
): string[] {
  if (!lastRun) return ["River status ingest has never run (expected monthly)"];
  if (lastRun.error) return [`River status ingest failed on its last run: ${lastRun.error}`];
  const days = Math.floor((now.getTime() - new Date(lastRun.checked_at).getTime()) / 86_400_000);
  return days > 45 ? [`River status ingest last ran ${days} days ago (expected monthly)`] : [];
}
