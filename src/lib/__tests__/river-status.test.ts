import { describe, expect, it } from "vitest";
import {
  describeRiverStatus,
  describeRiverStatusHealth,
  failingElements,
  findCatchment,
  geometryBBox,
  nearestWaterBody,
  parseRiverFeature,
  pointInGeometry,
  summariseRivers,
  type CatchmentGeometry,
  type RiverStatus,
} from "../river-status";

const THAMES_PROPS = {
  water_body_id: "GB106039023232",
  water_body_name: "Thames (Egham to Teddington)",
  water_body_hmd: "Heavily Modified",
  river_basin_district: "Thames",
  management_catchment: "Maidenhead and Sunbury",
  operational_catchment: "Thames Lower",
  classification_year: 2025,
  ecological_class: "Moderate",
  chemical_class: "Fail",
  priority_hazardous_substances: "Fail",
  invertebrates_class: "Moderate",
  phosphate_class: "Moderate",
  temperature_class: "Moderate",
  dissolved_oxygen_class: "Good",
  ph_class: "High",
  fish_class: null,
  macrophytes_phytobenthos_combined_class: "Not assessed",
  class_change_eco: "Higher Status",
  drinking_water_protected_area: "Thames (Egham to Teddington)",
};

describe("parseRiverFeature", () => {
  it("maps EA properties and keeps only graded elements", () => {
    const r = parseRiverFeature(THAMES_PROPS)!;
    expect(r.name).toBe("Thames (Egham to Teddington)");
    expect(r.modified).toBe("Heavily Modified");
    expect(r.ecologicalClass).toBe("Moderate");
    expect(r.chemicalClass).toBe("Fail");
    expect(r.elements.map((e) => e.key)).not.toContain("macrophytes_phytobenthos_combined_class");
    expect(r.elements.map((e) => e.key)).not.toContain("fish_class");
    expect(r.drinkingWaterProtectedArea).toBe("Thames (Egham to Teddington)");
  });

  it("treats 'Not Designated A/HMWB' as a natural river", () => {
    const r = parseRiverFeature({ ...THAMES_PROPS, water_body_hmd: "Not Designated A/HMWB" })!;
    expect(r.modified).toBeNull();
  });

  it("tidies shouted estuary names and keeps the type", () => {
    const r = parseRiverFeature({ ...THAMES_PROPS, water_body_name: "THAMES MIDDLE", water_body_type: "Transitional" })!;
    expect(r.name).toBe("Thames Middle");
    expect(r.type).toBe("Transitional");
    expect(describeRiverStatus(r)).toContain("meaning the estuary is");
  });

  it("rejects a record with no id", () => {
    expect(parseRiverFeature({ water_body_name: "x" })).toBeNull();
  });

  it("does not invent an ecological class from unknown wording", () => {
    const r = parseRiverFeature({ ...THAMES_PROPS, ecological_class: "Not assessed" })!;
    expect(r.ecologicalClass).toBeNull();
  });
});

describe("geometry", () => {
  const square: CatchmentGeometry = {
    type: "Polygon",
    coordinates: [
      [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
      [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]], // hole
    ],
  };
  const multi: CatchmentGeometry = {
    type: "MultiPolygon",
    coordinates: [
      [[[20, 20], [21, 20], [21, 21], [20, 21], [20, 20]]],
      square.coordinates,
    ],
  };

  it("finds points inside, outside and in a hole", () => {
    expect(pointInGeometry(1, 1, square)).toBe(true);
    expect(pointInGeometry(11, 1, square)).toBe(false);
    expect(pointInGeometry(5, 5, square)).toBe(false);
    expect(pointInGeometry(20.5, 20.5, multi)).toBe(true);
    expect(pointInGeometry(2, 2, multi)).toBe(true);
  });

  it("nearestWaterBody picks the closest outline within range", () => {
    const far: CatchmentGeometry = { type: "Polygon", coordinates: [[[1, 51], [1.1, 51], [1.1, 51.1], [1, 51.1], [1, 51]]] };
    const near: CatchmentGeometry = { type: "Polygon", coordinates: [[[0.02, 51], [0.05, 51], [0.05, 51.05], [0.02, 51.05], [0.02, 51]]] };
    const shapes = [
      { waterBodyId: "FAR", bbox: geometryBBox(far), geometry: far },
      { waterBodyId: "NEAR", bbox: geometryBBox(near), geometry: near },
    ];
    const hit = nearestWaterBody(0, 51, shapes, 8)!;
    expect(hit.waterBodyId).toBe("NEAR");
    expect(hit.distanceKm).toBeGreaterThan(1);
    expect(hit.distanceKm).toBeLessThan(2);
    expect(nearestWaterBody(-3, 51, shapes, 8)).toBeNull();
  });

  it("findCatchment skips shapes whose bbox contains the point but whose outline does not", () => {
    const lShape: CatchmentGeometry = {
      type: "Polygon",
      coordinates: [[[0, 0], [10, 0], [10, 2], [2, 2], [2, 10], [0, 10], [0, 0]]],
    };
    const inner: CatchmentGeometry = {
      type: "Polygon",
      coordinates: [[[3, 3], [9, 3], [9, 9], [3, 9], [3, 3]]],
    };
    const shapes = [
      { waterBodyId: "L", bbox: geometryBBox(lShape), geometry: lShape },
      { waterBodyId: "INNER", bbox: geometryBBox(inner), geometry: inner },
    ];
    expect(findCatchment(5, 5, shapes)).toBe("INNER");
    expect(findCatchment(1, 8, shapes)).toBe("L");
    expect(findCatchment(50, 50, shapes)).toBeNull();
  });
});

describe("plain-language reading", () => {
  const thames = parseRiverFeature(THAMES_PROPS) as RiverStatus;

  it("lists the elements below good, worst first", () => {
    const poorFish = parseRiverFeature({ ...THAMES_PROPS, fish_class: "Poor" })!;
    expect(failingElements(poorFish)[0].key).toBe("fish_class");
    expect(failingElements(thames).map((e) => e.status)).toEqual(["Moderate", "Moderate", "Moderate"]);
  });

  it("describes ecology, the chemical failure and the trend", () => {
    const s = describeRiverStatus(thames);
    expect(s).toContain("moderate for ecological health in its 2025 assessment");
    expect(s).toContain("held back by");
    expect(s).toContain("as every river, estuary and stretch of coast in England does");
    expect(s).toContain("improved");
  });

  it("says nothing about chemicals when the river was not assessed for them", () => {
    const r = parseRiverFeature({ ...THAMES_PROPS, chemical_class: "Does not require assessment" })!;
    expect(describeRiverStatus(r)).not.toContain("chemical test");
  });
});

describe("summariseRivers", () => {
  it("counts classes and the good-or-better share", () => {
    const mk = (eco: string, chem: string) =>
      parseRiverFeature({ ...THAMES_PROPS, water_body_id: eco + chem, ecological_class: eco, chemical_class: chem })!;
    const s = summariseRivers([
      mk("Good", "Fail"),
      mk("High", "Fail"),
      mk("Moderate", "Fail"),
      mk("Poor", "Fail"),
      mk("Bad", "Does not require assessment"),
      mk("Not assessed", "Fail"),
    ]);
    expect(s.total).toBe(5);
    expect(s.goodOrBetter).toBe(2);
    expect(s.goodOrBetterPct).toBe(40);
    expect(s.chemicalAssessed).toBe(5);
    expect(s.chemicalFail).toBe(5);
    expect(s.classificationYear).toBe(2025);
  });
});

describe("describeRiverStatusHealth", () => {
  const now = new Date("2026-10-20T00:00:00Z");
  it("is quiet after a recent clean run", () => {
    expect(describeRiverStatusHealth({ checked_at: "2026-10-02T04:30:00Z", error: null }, now)).toEqual([]);
  });
  it("flags a failed, missing or stale run", () => {
    expect(describeRiverStatusHealth(null, now)[0]).toContain("never run");
    expect(describeRiverStatusHealth({ checked_at: "2026-10-02T04:30:00Z", error: "503" }, now)[0]).toContain("503");
    expect(describeRiverStatusHealth({ checked_at: "2026-08-01T04:30:00Z", error: null }, now)[0]).toContain("79 days");
  });
});

describe("ratingFingerprint", () => {
  it("ignores element order and changes when a rating changes", async () => {
    const { ratingFingerprint } = await import("../river-status-ingest");
    const a = ratingFingerprint(2025, "Poor", "Fail", [{ key: "fish_class", status: "Poor" }, { key: "ph_class", status: "High" }]);
    const b = ratingFingerprint(2025, "Poor", "Fail", [{ key: "ph_class", status: "High" }, { key: "fish_class", status: "Poor" }]);
    const c = ratingFingerprint(2025, "Moderate", "Fail", [{ key: "fish_class", status: "Moderate" }, { key: "ph_class", status: "High" }]);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});
