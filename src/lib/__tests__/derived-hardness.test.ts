import { describe, expect, it } from "vitest";
import { CALCIUM_TO_CACO3, deriveHardnessAsCaCO3 } from "../derived-hardness";

const NAME = "HARDNESS (TOTAL)";
const s = (value: number, sampleDate: string, determinand = NAME) => ({ determinand, value, sampleDate });

describe("deriveHardnessAsCaCO3", () => {
  it("converts hardness as calcium to hardness as calcium carbonate", () => {
    expect(CALCIUM_TO_CACO3).toBeCloseTo(2.4973, 4);
    const out = deriveHardnessAsCaCO3([s(113, "2025-03-01"), s(113, "2025-06-01"), s(113, "2025-09-01")], NAME);
    expect(out).toEqual({ value: 282, sampleDate: "2025-09-01", samples: 3 });
  });

  it("only uses the two years up to the newest sample", () => {
    const out = deriveHardnessAsCaCO3([s(40, "2022-01-10"), s(100, "2024-06-01"), s(110, "2025-01-01"), s(120, "2026-05-01")], NAME);
    expect(out?.samples).toBe(3);
    expect(out?.value).toBe(Math.round(110 * CALCIUM_TO_CACO3));
  });

  it("ignores other determinands, zeros and undated rows", () => {
    const out = deriveHardnessAsCaCO3(
      [s(113, "2025-03-01"), s(113, "2025-04-01"), s(113, "2025-05-01"), s(5, "2025-05-01", "HARDNESS (°DH)"), s(0, "2025-05-02"), s(900, "")],
      NAME,
    );
    expect(out).toEqual({ value: 282, sampleDate: "2025-05-01", samples: 3 });
  });

  it("returns null with fewer than three recent samples", () => {
    expect(deriveHardnessAsCaCO3([s(113, "2025-03-01"), s(113, "2025-06-01")], NAME)).toBeNull();
    expect(deriveHardnessAsCaCO3([], NAME)).toBeNull();
  });
});
