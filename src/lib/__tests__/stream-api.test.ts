import { describe, it, expect } from "vitest";
import { normalizeStreamRecord, parseStreamDate } from "../stream-api";

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
