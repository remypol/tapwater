import { describe, expect, it } from "vitest";
import { scottishZoneReadings } from "../scottish-zone-readings";
import type { ParsedScottishZone } from "../scottish-pdf-parser";

const v = (value: number) => ({ value, below_limit: false });

function zone(parameters: ParsedScottishZone["parameters"]): ParsedScottishZone {
  return { zone_name: "Mannofield East", zone_slug: "mannofield-east", parameters, source: "scottish_water_zone_report", year: 2025, date_from: "2025-01-01", date_to: "2025-12-31" } as ParsedScottishZone;
}

describe("scottishZoneReadings", () => {
  it("does not report coliform bacteria from one positive sample in 156", () => {
    const readings = scottishZoneReadings(zone([
      { parameter: "Coliform Bacteria", unit: "no./100ml", regulatory_limit: "0", min: v(0), mean: v(0.01), max: v(1), total_samples: 156, fail_percent: 0.64 },
    ] as ParsedScottishZone["parameters"]));
    expect(readings).toEqual([{ determinand: "Coliform Bacteria", value: 0, unit: "no./100ml", ukLimit: null }]);
  });

  it("uses the year's mean for an ordinary parameter and carries its limit", () => {
    const readings = scottishZoneReadings(zone([
      { parameter: "Colour", unit: "mg/l Pt/Co", regulatory_limit: "20", min: v(2), mean: v(3), max: v(6), total_samples: 40, fail_percent: 0 },
    ] as ParsedScottishZone["parameters"]));
    expect(readings[0]).toEqual({ determinand: "Colour", value: 3, unit: "mg/l Pt/Co", ukLimit: 20 });
  });

  it("repairs a pH row that swallowed the odour and taste rows", () => {
    const readings = scottishZoneReadings(zone([
      { parameter: "Odour 40 0 Dilution number 0 0 0 0 Taste 40 0 Dilution number 0 0 0 0 Hydrogen ion (pH)", unit: "pH units", regulatory_limit: "9.5", min: v(7.4), mean: v(7.7), max: v(8), total_samples: 40, fail_percent: 0 },
    ] as ParsedScottishZone["parameters"]));
    expect(readings[0].determinand).toBe("Hydrogen ion (pH)");
  });

  it("leaves out a parameter with no value", () => {
    const readings = scottishZoneReadings(zone([
      { parameter: "Tritium", unit: "Bq/l", regulatory_limit: "100", min: null, mean: null, max: null, total_samples: 0, fail_percent: 0 },
    ] as ParsedScottishZone["parameters"]));
    expect(readings).toEqual([]);
  });
});
