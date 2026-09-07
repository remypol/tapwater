import { describe, it, expect } from "vitest";
import {
  DWI_PFAS_GUIDELINE_UG_L,
  haversineKm,
  summarisePfasNearby,
  type PfasNearbyRow,
} from "../pfas-data";

/**
 * The postcode page decides "PFAS near you" from Environment Agency river and
 * groundwater samples within 10 km of the district centroid. These pin the
 * distance maths and the aggregation so a page can never show a module built on
 * samples 40 km away, or report a "highest reading" from a different compound
 * than the one it names.
 */

// Westminster (SW1A) and central Oxford (OX1) centroids from postcode_districts.
const SW1A = { lat: 51.5045, lng: -0.1321 };
const OX1 = { lat: 51.745, lng: -1.2613 };

function row(overrides: Partial<PfasNearbyRow> & { lat: number; lng: number }): PfasNearbyRow {
  return {
    sampling_point_id: "TH-1",
    sampling_point_label: "RIVER THAMES AT WESTMINSTER",
    city: "London",
    compound: "PFOS",
    value: 0.01,
    sample_date: "2025-03-01",
    ...overrides,
  };
}

describe("haversineKm", () => {
  it("returns zero for the same point", () => {
    expect(haversineKm(SW1A.lat, SW1A.lng, SW1A.lat, SW1A.lng)).toBe(0);
  });

  it("puts Westminster about 83 km from central Oxford", () => {
    const km = haversineKm(SW1A.lat, SW1A.lng, OX1.lat, OX1.lng);
    expect(km).toBeGreaterThan(81);
    expect(km).toBeLessThan(85);
  });

  it("is symmetric", () => {
    expect(haversineKm(SW1A.lat, SW1A.lng, OX1.lat, OX1.lng)).toBeCloseTo(
      haversineKm(OX1.lat, OX1.lng, SW1A.lat, SW1A.lng),
      10,
    );
  });
});

describe("summarisePfasNearby", () => {
  it("returns null when no rows are within the radius", () => {
    // Oxford samples only; Westminster asks.
    const rows = [row({ ...OX1, city: "Oxford" }), row({ lat: OX1.lat + 0.01, lng: OX1.lng, city: "Oxford" })];
    expect(summarisePfasNearby(rows, SW1A.lat, SW1A.lng, 10)).toBeNull();
  });

  it("returns null for an empty table", () => {
    expect(summarisePfasNearby([], SW1A.lat, SW1A.lng, 10)).toBeNull();
  });

  it("ignores rows just outside the radius and keeps rows just inside it", () => {
    // 0.09 deg of latitude ~ 10.0 km; 0.08 ~ 8.9 km.
    const inside = row({ lat: SW1A.lat + 0.08, lng: SW1A.lng, sampling_point_id: "IN" });
    const outside = row({ lat: SW1A.lat + 0.1, lng: SW1A.lng, sampling_point_id: "OUT" });
    const summary = summarisePfasNearby([inside, outside], SW1A.lat, SW1A.lng, 10);
    expect(summary?.detectionCount).toBe(1);
    expect(summary?.samplingPointCount).toBe(1);
    expect(summary?.highest.samplingPointLabel).toBe(inside.sampling_point_label);
  });

  it("counts detections and distinct sampling points, and ranks compounds by detections", () => {
    const rows: PfasNearbyRow[] = [
      row({ ...SW1A, sampling_point_id: "A", compound: "PFOS", value: 0.004 }),
      row({ ...SW1A, sampling_point_id: "A", compound: "PFOS", value: 0.006, sample_date: "2025-05-01" }),
      row({ ...SW1A, sampling_point_id: "A", compound: "PFOA", value: 0.003 }),
      row({ lat: SW1A.lat + 0.02, lng: SW1A.lng, sampling_point_id: "B", compound: "PFHxS (linear)", value: 0.002 }),
      row({ lat: SW1A.lat + 0.02, lng: SW1A.lng, sampling_point_id: "B", compound: "PFOA", value: 0.001 }),
      row({ lat: SW1A.lat + 0.02, lng: SW1A.lng, sampling_point_id: "B", compound: "PFBA", value: 0.001 }),
    ];
    const summary = summarisePfasNearby(rows, SW1A.lat, SW1A.lng, 10);
    expect(summary).not.toBeNull();
    expect(summary!.detectionCount).toBe(6);
    expect(summary!.samplingPointCount).toBe(2);
    expect(summary!.topCompounds).toEqual([
      { compound: "PFOA", detectionCount: 2 },
      { compound: "PFOS", detectionCount: 2 },
      { compound: "PFBA", detectionCount: 1 },
    ]);
    expect(summary!.latestDate).toBe("2025-05-01");
    expect(summary!.radiusKm).toBe(10);
  });

  it("reports the highest reading with its own compound, date, site and distance", () => {
    const rows: PfasNearbyRow[] = [
      row({ ...SW1A, sampling_point_id: "A", compound: "PFOS", value: 0.004, sample_date: "2025-01-10" }),
      row({
        lat: SW1A.lat + 0.03,
        lng: SW1A.lng,
        sampling_point_id: "B",
        sampling_point_label: "RIVER LEE AT BOW LOCKS",
        compound: "PFHxS (linear)",
        value: 0.12,
        sample_date: "2024-11-02",
      }),
    ];
    const summary = summarisePfasNearby(rows, SW1A.lat, SW1A.lng, 10)!;
    expect(summary.highest).toEqual({
      value: 0.12,
      compound: "PFHxS (linear)",
      date: "2024-11-02",
      samplingPointLabel: "RIVER LEE AT BOW LOCKS",
      distanceKm: 3.3,
    });
    expect(summary.highest.value).toBeGreaterThan(DWI_PFAS_GUIDELINE_UG_L);
  });

  it("names the nearest city that has a /pfas page", () => {
    const rows: PfasNearbyRow[] = [
      row({ lat: SW1A.lat + 0.05, lng: SW1A.lng, sampling_point_id: "FAR", city: "Oxford" }),
      row({ lat: SW1A.lat + 0.005, lng: SW1A.lng, sampling_point_id: "NEAR", city: "London" }),
    ];
    const summary = summarisePfasNearby(rows, SW1A.lat, SW1A.lng, 10)!;
    expect(summary.nearestCitySlug).toBe("london");
    expect(summary.nearestCityName).toBe("London");
  });

  it("returns no city link when the nearest row's city has no page", () => {
    const rows = [row({ ...SW1A, city: "Nowhere-on-Sea" })];
    const summary = summarisePfasNearby(rows, SW1A.lat, SW1A.lng, 10)!;
    expect(summary.nearestCitySlug).toBeNull();
    expect(summary.nearestCityName).toBeNull();
  });

  it("does not count non-positive values as detections", () => {
    const rows = [row({ ...SW1A, value: 0 }), row({ ...SW1A, value: -1 })];
    expect(summarisePfasNearby(rows, SW1A.lat, SW1A.lng, 10)).toBeNull();
  });
});
