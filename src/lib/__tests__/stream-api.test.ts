import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { normalizeStreamRecord, parseStreamDate, fetchStreamData } from "../stream-api";
import type { StreamSource } from "../stream-sources";
import { getStreamSource, getAllStreamSupplierIds } from "../stream-sources";
import { computeScore } from "../scoring";

describe("parseStreamDate", () => {
  it("parses epoch milliseconds", () => {
    expect(parseStreamDate(1743206400000, "epoch")).toBe("2025-03-29");
  });

  it("parses string date format", () => {
    expect(parseStreamDate("1/2/2024 12:00:00 AM", "string")).toBe("2024-01-02");
  });

  it("parses string date with different format", () => {
    expect(parseStreamDate("12/31/2024 12:00:00 AM", "string")).toBe("2024-12-31");
  });

  it("returns empty string for null", () => {
    expect(parseStreamDate(null, "epoch")).toBe("");
  });
});

describe("normalizeStreamRecord", () => {
  it("normalizes Yorkshire Water UPPER_CASE fields", () => {
    const record = {
      SAMPLE_ID: "abc123",
      SAMPLE_DATE: 1743206400000,
      DETERMINAND: "Lead (10)",
      DWI_CODE: "PB01",
      UNITS: "ug/l",
      OPERATOR: "<",
      RESULT: 0.5,
      LSOA: "E01013386",
    };
    const result = normalizeStreamRecord(record, "upper", "epoch");
    expect(result).toEqual({
      sampleId: "abc123",
      sampleDate: "2025-03-29",
      determinand: "Lead (10)",
      dwiCode: "PB01",
      unit: "ug/l",
      belowDetectionLimit: true,
      value: 0.5,
      lsoa: "E01013386",
    });
  });

  it("normalizes Severn Trent CamelCase fields", () => {
    const record = {
      Sample_Id: "ZBR17E01009349",
      Sample_Date: "1/2/2024 12:00:00 AM",
      Determinand: "Coliform Bacteria",
      DWI_Code: "C001A",
      Units: "No. / 100ml",
      Operator: null,
      Result: 0,
      LSOA: "E01009349",
      Data_Provider: "Severn Trent",
    };
    const result = normalizeStreamRecord(record, "camel", "string");
    expect(result).toEqual({
      sampleId: "ZBR17E01009349",
      sampleDate: "2024-01-02",
      determinand: "Coliform Bacteria",
      dwiCode: "C001A",
      unit: "No. / 100ml",
      belowDetectionLimit: false,
      value: 0,
      lsoa: "E01009349",
    });
  });

  it("handles unicode micro sign in units", () => {
    const record = {
      SAMPLE_ID: "x",
      SAMPLE_DATE: 1743206400000,
      DETERMINAND: "Aluminium (Total)",
      DWI_CODE: "A021",
      UNITS: "\u03bcg/l Al",
      OPERATOR: "<",
      RESULT: 8.37,
      LSOA: "E01010929",
    };
    const result = normalizeStreamRecord(record, "upper", "epoch");
    expect(result.unit).toBe("\u00b5g/l Al");
    expect(result.belowDetectionLimit).toBe(true);
  });
});

describe("fetchStreamData", () => {
  const mockSource: StreamSource = {
    orgId: "test-org",
    services: [
      { year: 2025, serviceName: "Company_2025" },
      { year: 2024, serviceName: "Company_2024" },
    ],
    geoField: "LSOA",
    fieldCase: "upper",
    dateFormat: "epoch",
  };

  const makeFeature = (determinand: string, date: number) => ({
    attributes: {
      SAMPLE_ID: "s1",
      SAMPLE_DATE: date,
      DETERMINAND: determinand,
      DWI_CODE: "X1",
      UNITS: "mg/l",
      OPERATOR: null,
      RESULT: 1.0,
      LSOA: "E01000001",
    },
  });

  const makeArcGISResponse = (features: unknown[], exceededLimit = false) =>
    new Response(JSON.stringify({ features, exceededTransferLimit: exceededLimit }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  const emptyResponse = () => makeArcGISResponse([]);

  const discoveryResponse = (services: string[]) =>
    new Response(
      JSON.stringify({
        services: services.map((name) => ({ name, type: "FeatureServer" })),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );

  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("returns data from newest hardcoded service (fast path)", async () => {
    fetchSpy.mockResolvedValueOnce(
      makeArcGISResponse([makeFeature("Lead", 1743206400000)]),
    );

    const records = await fetchStreamData(mockSource, ["E01000001"]);
    expect(records.length).toBe(1);
    expect(records[0].determinand).toBe("Lead");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("falls through to older service when newest is empty", async () => {
    fetchSpy
      .mockResolvedValueOnce(emptyResponse())
      .mockResolvedValueOnce(
        makeArcGISResponse([makeFeature("Chlorine", 1700000000000)]),
      )
      .mockResolvedValueOnce(discoveryResponse(["Company_2025", "Company_2024"]));

    const records = await fetchStreamData(mockSource, ["E01000001"]);
    expect(records.length).toBe(1);
    expect(records[0].determinand).toBe("Chlorine");
  });

  it("prefers discovered newer service over stale hardcoded data", async () => {
    fetchSpy
      .mockResolvedValueOnce(emptyResponse())
      .mockResolvedValueOnce(
        makeArcGISResponse([makeFeature("Chlorine", 1700000000000)]),
      )
      .mockResolvedValueOnce(
        discoveryResponse([
          "Company_Drinking_Water_Quality_2026",
          "Company_2025",
          "Company_2024",
        ]),
      )
      .mockResolvedValueOnce(
        makeArcGISResponse([makeFeature("Lead", 1770000000000)]),
      );

    const records = await fetchStreamData(mockSource, ["E01000001"]);
    expect(records.length).toBe(1);
    expect(records[0].determinand).toBe("Lead");
  });

  it("returns empty array when no services have data", async () => {
    fetchSpy
      .mockResolvedValueOnce(emptyResponse())
      .mockResolvedValueOnce(emptyResponse())
      .mockResolvedValueOnce(discoveryResponse([]));

    const records = await fetchStreamData(mockSource, ["E01000001"]);
    expect(records).toEqual([]);
  });

  it("returns empty array for empty lsoa list", async () => {
    const records = await fetchStreamData(mockSource, []);
    expect(records).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("normalizeStreamRecord with a unit fallback (Southern Water extract)", () => {
  const southern = getStreamSource("southern-water")!;
  const extractRow = (determinand: string, units: string | null, operator: string | null, result: string) => ({
    Sample_Date: "2026-03-02",
    Determinand: determinand,
    DWI_Code: "N/A",
    Units: units,
    Operator: operator,
    Result: result,
    LSOA: "E01016904",
  });

  it("fills a null unit from the fallback", () => {
    const r = normalizeStreamRecord(extractRow("LEAD (UNFLUSHED)", null, null, "2.1"), "camel", "string", southern.unitFallback);
    expect(r.unit).toBe("µg/l");
    expect(r.value).toBe(2.1);
    expect(r.belowDetectionLimit).toBe(false);
  });

  it("replaces an operator in the unit field and marks '<' as below detection", () => {
    const r = normalizeStreamRecord(extractRow("NITRATE", "<", null, "2.13"), "camel", "string", southern.unitFallback);
    expect(r.unit).toBe("mgNO3/l");
    expect(r.belowDetectionLimit).toBe(true);
  });

  it("replaces '>' without marking below detection", () => {
    const r = normalizeStreamRecord(extractRow("E. COLI (CONFIRMED)", ">", ">", "100"), "camel", "string", southern.unitFallback);
    expect(r.unit).toBe("no/100ml");
    expect(r.belowDetectionLimit).toBe(false);
  });

  it("leaves a determinand with no confirmed unit unitless", () => {
    for (const name of ["HARDNESS (TOTAL)", "HARDNESS (°DH)", "PFOSA", "COLIFORMS (PRESUMPTIVE)", "SOMETHING NEW"]) {
      expect(normalizeStreamRecord(extractRow(name, null, null, "1"), "camel", "string", southern.unitFallback).unit).toBe("");
    }
  });

  it("keeps a published unit even when a fallback exists", () => {
    const r = normalizeStreamRecord(extractRow("ALUMINIUM", "μg/l", "#", "8.4"), "camel", "string", southern.unitFallback);
    expect(r.unit).toBe("µg/l");
  });

  it("leaves sources without a fallback exactly as before", () => {
    const row = { SAMPLE_ID: "x", SAMPLE_DATE: 1743206400000, DETERMINAND: "LEAD (UNFLUSHED)", DWI_CODE: "", UNITS: "<", OPERATOR: "<", RESULT: 0.9, LSOA: "E1" };
    expect(normalizeStreamRecord(row, "upper", "epoch").unit).toBe("<");
    expect(normalizeStreamRecord({ ...row, UNITS: null, OPERATOR: null }, "upper", "epoch")).toMatchObject({ unit: "", belowDetectionLimit: false });
    for (const id of getAllStreamSupplierIds().filter((s) => s !== "southern-water")) {
      expect(getStreamSource(id)!.unitFallback).toBeUndefined();
    }
  });

  it("feeds the scorer units it compares against the right limits", () => {
    const fb = southern.unitFallback!;
    const obs = (determinand: string, value: number) => ({ determinand, value, unit: fb[determinand], date: "2026-03-02" });
    const result = computeScore([
      obs("LEAD (UNFLUSHED)", 2.1),
      obs("NITRATE", 31.4),
      obs("NITRITE", 0.17),
      obs("IRON", 18.1),
      obs("COPPER (UNFLUSHED)", 0.054),
      obs("E. COLI (CONFIRMED)", 0),
      obs("PH", 7.4),
    ]);
    const byName = Object.fromEntries(result.readings.map((r) => [r.name, r]));
    expect(byName.Lead.value).toBeCloseTo(0.0021);
    expect(byName.Nitrate.value).toBeCloseTo(31.4);
    expect(byName.Iron.value).toBeCloseTo(0.0181);
    expect(byName.Copper.value).toBeCloseTo(0.054);
    expect(byName["E. coli"].status).toBe("pass");
    expect(result.contaminantsFlagged).toBe(0);
    expect(result.safetyScore).toBeGreaterThanOrEqual(7);
  });

  it("maps no fallback name onto a scored parameter it does not measure", () => {
    // Substring matching in the scorer is loose ("PHENOL" starts with "ph"); pin
    // exactly which scored parameter each fallback name lands on.
    const landed: Record<string, string[]> = {};
    for (const [determinand, unit] of Object.entries(southern.unitFallback!)) {
      const r = computeScore([{ determinand, value: 0, unit, date: "2026-01-01" }]);
      for (const reading of r.readings) (landed[reading.name] ??= []).push(determinand);
    }
    expect(landed).toEqual({
      Aluminium: ["ALUMINIUM", "ALUMINIUM (UNFLUSHED)"],
      Antimony: ["ANTIMONY"],
      Arsenic: ["ARSENIC"],
      Bromate: ["BROMATE"],
      Cadmium: ["CADMIUM"],
      Chromium: ["CHROMIUM"],
      Iron: ["IRON", "IRON (UNFLUSHED)", "IRON (DISSOLVED)"],
      Lead: ["LEAD", "LEAD (UNFLUSHED)"],
      Manganese: ["MANGANESE"],
      Mercury: ["MERCURY"],
      Nickel: ["NICKEL", "NICKEL (UNFLUSHED)"],
      Selenium: ["SELENIUM"],
      Trihalomethanes: ["TRIHALOMETHANES (SUM OF IDENTIFIED THMS)"],
      "PFAS (total)": ["PFAS TOTAL IN TREATED WATER"],
      Boron: ["BORON"],
      Copper: ["COPPER", "COPPER (UNFLUSHED)"],
      Fluoride: ["FLUORIDE"],
      Nitrate: ["NITRATE"],
      Nitrite: ["NITRITE"],
      Ammonia: ["AMMONIA"],
      Colour: ["COLOUR LIQUID FILTERED"],
      pH: ["PH"],
      Turbidity: ["TURBIDITY"],
      Conductivity: ["CONDUCTIVITY"],
      "E. coli": ["E. COLI (CONFIRMED)"],
      "Coliform Bacteria": ["COLIFORMS (CONFIRMED TOTAL)"],
    });
  });
});
