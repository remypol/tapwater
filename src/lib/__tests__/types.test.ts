import { describe, it, expect } from "vitest";
import { getScoreColor, getPercentOfLimit } from "../types";
import type { ContaminantReading } from "../types";

describe("getScoreColor", () => {
  it("returns safe for scores >= 7", () => {
    expect(getScoreColor(7)).toBe("safe");
    expect(getScoreColor(10)).toBe("safe");
  });

  it("returns warning for scores 4-6.9", () => {
    expect(getScoreColor(4)).toBe("warning");
    expect(getScoreColor(6.9)).toBe("warning");
  });

  it("returns danger for scores < 4", () => {
    expect(getScoreColor(3.9)).toBe("danger");
    expect(getScoreColor(0)).toBe("danger");
  });
});

describe("getPercentOfLimit", () => {
  it("handles below-detection-limit readings", () => {
    const reading: ContaminantReading = {
      name: "Lead",
      value: 0.001,
      unit: "mg/L",
      ukLimit: 0.01,
      whoGuideline: 0.01,
      status: "pass",
      belowDetectionLimit: true,
    };
    expect(getPercentOfLimit(reading)).toBe(10);
  });
});
