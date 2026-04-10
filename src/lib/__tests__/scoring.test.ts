import { describe, it, expect } from "vitest";
import { computeScore } from "../scoring";

describe("computeScore", () => {
  it("scores lead correctly", () => {
    const result = computeScore([
      { determinand: "Lead", value: 0.005, unit: "mg/l", date: "2025-01-01" },
    ]);
    expect(result.safetyScore).toBe(5); // single param scores (lead at 50% of limit)
    expect(result.lowConfidence).toBe(true); // <3 scored params
    const leadReading = result.readings.find((r) => r.name === "Lead");
    expect(leadReading).toBeDefined();
    expect(leadReading!.status).toBe("pass");
  });

  it("flags lead exceeding UK limit", () => {
    const result = computeScore([
      { determinand: "Lead", value: 0.015, unit: "mg/l", date: "2025-01-01" },
      { determinand: "Nitrate", value: 10, unit: "mg/l", date: "2025-01-01" },
    ]);
    const leadReading = result.readings.find((r) => r.name === "Lead");
    expect(leadReading!.status).toBe("fail");
    expect(result.contaminantsFlagged).toBeGreaterThanOrEqual(1);
  });

  it("scores E.coli at zero as pass", () => {
    const result = computeScore([
      { determinand: "E.Coli (faecal coliforms Confirmed)", value: 0, unit: "No. /100ml", date: "2025-01-01" },
      { determinand: "Coliform Bacteria", value: 0, unit: "No. /100ml", date: "2025-01-01" },
      { determinand: "Lead", value: 0.005, unit: "mg/l", date: "2025-01-01" },
    ]);
    const ecoli = result.readings.find((r) => r.name === "E. coli");
    expect(ecoli).toBeDefined();
    expect(ecoli!.status).toBe("pass");
  });

  it("flags E.coli detected", () => {
    const result = computeScore([
      { determinand: "E.Coli (faecal coliforms Confirmed)", value: 1, unit: "No. /100ml", date: "2025-01-01" },
      { determinand: "Lead", value: 0.005, unit: "mg/l", date: "2025-01-01" },
    ]);
    const ecoli = result.readings.find((r) => r.name === "E. coli");
    expect(ecoli!.status).toBe("fail");
  });

  it("scores trihalomethanes", () => {
    const result = computeScore([
      { determinand: "Trihalomethanes (Total)", value: 0.05, unit: "mg/l", date: "2025-01-01" },
      { determinand: "Lead", value: 0.005, unit: "mg/l", date: "2025-01-01" },
    ]);
    const thm = result.readings.find((r) => r.name === "Trihalomethanes");
    expect(thm).toBeDefined();
    expect(thm!.status).toBe("pass");
  });

  it("handles ug/l to mg/l conversion", () => {
    const result = computeScore([
      { determinand: "Lead", value: 5, unit: "\u00b5g/l", date: "2025-01-01" },
      { determinand: "Nitrate", value: 10, unit: "mg/l", date: "2025-01-01" },
    ]);
    const leadReading = result.readings.find((r) => r.name === "Lead");
    expect(leadReading!.value).toBe(0.005);
    expect(leadReading!.status).toBe("pass");
  });

  it("keeps most recent reading per determinand", () => {
    const result = computeScore([
      { determinand: "Lead", value: 0.015, unit: "mg/l", date: "2024-01-01" },
      { determinand: "Lead", value: 0.005, unit: "mg/l", date: "2025-01-01" },
      { determinand: "Nitrate", value: 10, unit: "mg/l", date: "2025-01-01" },
    ]);
    const leadReading = result.readings.find((r) => r.name === "Lead");
    expect(leadReading!.value).toBe(0.005);
    expect(leadReading!.status).toBe("pass");
  });

  it("returns insufficient-data when no scored params", () => {
    const result = computeScore([
      { determinand: "pH", value: 7.5, unit: "ph", date: "2025-01-01" },
    ]);
    expect(result.safetyScore).toBe(-1);
    expect(result.scoreGrade).toBe("insufficient-data");
  });

  it("detects PFAS", () => {
    const result = computeScore([
      { determinand: "Perfluorooctane Sulfonate (PFOS)", value: 0.05, unit: "\u00b5g/l", date: "2025-01-01" },
      { determinand: "Lead", value: 0.005, unit: "mg/l", date: "2025-01-01" },
      { determinand: "Nitrate", value: 10, unit: "mg/l", date: "2025-01-01" },
    ]);
    expect(result.pfasDetected).toBe(true);
    expect(result.pfasLevel).toBe(0.05);
  });
});
