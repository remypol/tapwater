import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { normalizeStreamRecord, parseStreamDate, fetchStreamData } from "../stream-api";
import type { StreamSource } from "../stream-sources";

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
