import { describe, it, expect } from "vitest";
import {
  LONDON_POSTCODE_AREAS,
  medianRounded,
  postcodeAreaOf,
  summariseHardness,
} from "../guide-hardness";

const d = (district: string, value: number) => ({ district, value });

describe("postcodeAreaOf", () => {
  it("takes the leading letters of a district", () => {
    expect(postcodeAreaOf("SW1A")).toBe("SW");
    expect(postcodeAreaOf("EC1A")).toBe("EC");
    expect(postcodeAreaOf("E1")).toBe("E");
    expect(postcodeAreaOf("G12")).toBe("G");
    expect(postcodeAreaOf(" lu1 ")).toBe("LU");
  });
});

describe("medianRounded", () => {
  it("matches the area-estimate rule in data.ts", () => {
    expect(medianRounded([300, 100, 200])).toBe(200);
    // Even count: rounded mean of the middle two, as data.ts does for /hardness.
    expect(medianRounded([270, 271, 100, 400])).toBe(271);
    expect(medianRounded([395, 396])).toBe(396);
  });
});

describe("summariseHardness", () => {
  const rows = [
    d("LU1", 330), d("LU2", 340), d("LU3", 320),
    d("CA1", 8), d("CA2", 10), d("CA3", 6),
    d("SE1", 290), d("SE5", 300), d("SE9", 280),
    d("SW1A", 250), d("SW2", 260), d("SW3", 270),
    d("EC1A", 280),
    d("BT1", 42),
  ];

  it("returns null when there is nothing measured, so the block renders nothing", () => {
    expect(summariseHardness([], { threshold: 200 })).toBeNull();
    expect(summariseHardness([d("LU1", Number.NaN)], { threshold: 200 })).toBeNull();
  });

  it("counts a district at exactly the threshold as at or above", () => {
    const s = summariseHardness(rows, { threshold: 250 })!;
    expect(s.measured).toBe(14);
    // 330, 340, 320, 290, 300, 280, 250, 260, 270, 280
    expect(s.atOrAbove).toBe(10);
    expect(s.percent).toBe(71);
  });

  it("only names areas with enough measured districts", () => {
    const s = summariseHardness(rows, { threshold: 200 })!;
    const named = [...s.hardest, ...s.softest].map((a) => a.area);
    expect(named).not.toContain("EC");
    expect(named).not.toContain("BT");
  });

  it("lists hardest and softest without naming an area twice", () => {
    const s = summariseHardness(rows, { threshold: 200, top: 3 })!;
    expect(s.hardest.map((a) => a.area)).toEqual(["LU", "SE", "SW"]);
    expect(s.hardest[0]).toEqual({ area: "LU", name: "Luton", median: 330, districts: 3 });
    // Only CA is left once the three hardest are taken.
    expect(s.softest.map((a) => a.area)).toEqual(["CA"]);
  });

  it("reports the areas asked for, hardest first, when they qualify", () => {
    const s = summariseHardness(rows, { threshold: 200, areas: LONDON_POSTCODE_AREAS })!;
    expect(s.picked.map((a) => [a.area, a.median])).toEqual([
      ["SE", 290],
      ["SW", 260],
    ]);
  });

  it("counts every measured district in the asked-for areas, named or not", () => {
    const s = summariseHardness(rows, { threshold: 275, areas: LONDON_POSTCODE_AREAS })!;
    // SE x3, SW x3 and the lone EC1A; EC is too thin to list but still counts.
    expect(s.pickedMeasured).toBe(7);
    // 290, 300, 280 (SE) and 280 (EC1A)
    expect(s.pickedAtOrAbove).toBe(4);
    expect(s.pickedPercent).toBe(57);
    expect(summariseHardness(rows, { threshold: 200 })!.pickedMeasured).toBe(0);
  });

  it("drops rows that are not readings", () => {
    const s = summariseHardness([...rows, d("XX1", -5), d("", 200)], { threshold: 200 })!;
    expect(s.measured).toBe(14);
  });
});
