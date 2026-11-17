import { describe, expect, it } from "vitest";
import { blendZones, zoneLabel, type ZoneReport, type ZoneReportParameter } from "../thames-blend";

function param(parameter: string, mean: number | null, extra: Partial<ZoneReportParameter> = {}): ZoneReportParameter {
  return {
    parameter,
    unit: "mg/l",
    regulatory_limit: null,
    mean: mean == null ? null : { value: mean, below_limit: false },
    max: null,
    total_samples: 10,
    ...extra,
  };
}

function zone(mapCode: string, parameters: ZoneReportParameter[], zone_name?: string): ZoneReport {
  return { mapCode, zone_name, year: 2025, parameters };
}

const HARDNESS = "Hardness (Total) as CaCO3";

describe("blendZones", () => {
  it("returns the zone's own figures when the district sits in one zone", () => {
    const reports = new Map([["R31", zone("R31", [param(HARDNESS, 295)], "Reading Central")]]);
    const blend = blendZones(reports, { R31: 6 });
    expect(blend?.readings).toEqual([{ determinand: HARDNESS, value: 295, unit: "mg/l", ukLimit: null }]);
    expect(blend?.zones).toEqual([{ code: "R31", name: "Reading Central", share: 100 }]);
    expect(blend?.year).toBe(2025);
  });

  it("weights each zone by how many postcodes fell in it", () => {
    const reports = new Map([
      ["A", zone("A", [param(HARDNESS, 300)])],
      ["B", zone("B", [param(HARDNESS, 240)])],
    ]);
    const blend = blendZones(reports, { A: 4, B: 2 });
    expect(blend?.readings[0].value).toBe(280);
    expect(blend?.zones.map((z) => [z.code, z.share])).toEqual([["A", 67], ["B", 33]]);
  });

  it("leaves out zones with no report and re-weights the rest", () => {
    const reports = new Map([["A", zone("A", [param(HARDNESS, 300)])]]);
    const blend = blendZones(reports, { A: 1, MISSING: 5 });
    expect(blend?.readings[0].value).toBe(300);
    expect(blend?.zones).toHaveLength(1);
  });

  it("returns null when no named zone has a report", () => {
    expect(blendZones(new Map(), { MISSING: 6 })).toBeNull();
    expect(blendZones(new Map([["A", zone("A", [param(HARDNESS, 300)])]]), {})).toBeNull();
  });

  it("falls back to the maximum where a zone reports no mean", () => {
    const reports = new Map([["A", zone("A", [param("E. coli", null, { unit: "no./100ml", max: { value: 0, below_limit: false } })])]]);
    expect(blendZones(reports, { A: 6 })?.readings[0]).toMatchObject({ determinand: "E. coli", value: 0 });
  });

  it("averages a parameter only over the zones that report it", () => {
    const reports = new Map([
      ["A", zone("A", [param(HARDNESS, 300), param("Tritium", 4)])],
      ["B", zone("B", [param(HARDNESS, 200)])],
    ]);
    const blend = blendZones(reports, { A: 3, B: 3 });
    expect(blend?.readings.find((r) => r.determinand === "Tritium")?.value).toBe(4);
    expect(blend?.readings.find((r) => r.determinand === HARDNESS)?.value).toBe(250);
  });

  it("does not average a zone that reports the parameter in another unit", () => {
    const reports = new Map([
      ["A", zone("A", [param("Lead", 1.2, { unit: "µg/l" })])],
      ["B", zone("B", [param("Lead", 0.0012, { unit: "mg/l" })])],
    ]);
    const blend = blendZones(reports, { A: 4, B: 2 });
    expect(blend?.readings[0]).toMatchObject({ value: 1.2, unit: "µg/l" });
  });

  it("carries the regulatory limit and sums the samples", () => {
    const reports = new Map([
      ["A", zone("A", [param("Nitrate", 30, { regulatory_limit: "50", total_samples: 12 })])],
      ["B", zone("B", [param("Nitrate", 20, { regulatory_limit: "50", total_samples: 8 })])],
    ]);
    const blend = blendZones(reports, { A: 1, B: 1 });
    expect(blend?.readings[0]).toMatchObject({ value: 25, ukLimit: 50 });
    expect(blend?.sampleCount).toBe(20);
  });

  it("keeps small values readable", () => {
    const reports = new Map([
      ["A", zone("A", [param("PFOS", 0.0004)])],
      ["B", zone("B", [param("PFOS", 0.0005)])],
    ]);
    expect(blendZones(reports, { A: 1, B: 2 })?.readings[0].value).toBe(0.0004667);
  });
});

describe("zoneLabel", () => {
  it("names one zone, and counts the others", () => {
    expect(zoneLabel([{ code: "A", name: "Reading Central", share: 100 }])).toBe("Reading Central");
    expect(zoneLabel([{ code: "A", name: "Esher", share: 60 }, { code: "B", name: "Hampton", share: 40 }])).toBe("Esher and 1 other zone");
    expect(zoneLabel([{ code: "A", name: "Esher", share: 50 }, { code: "B", name: "x", share: 30 }, { code: "C", name: "y", share: 20 }])).toBe("Esher and 2 other zones");
  });
});
