import { describe, expect, it } from "vitest";
import { buildTankPlan, formatReading, hardnessBandLabel, type RecommendedProduct, type TankPlanInput } from "../tank-plan";
import type { ContaminantReading } from "../types";

const r = (name: string, value: number, ukLimit: number | null, status: ContaminantReading["status"] = "pass"): ContaminantReading => ({
  name,
  value,
  unit: "mg/L",
  ukLimit,
  whoGuideline: null,
  status,
});

const product = (model: string, matched: string[] = []): RecommendedProduct =>
  ({
    id: model,
    brand: "Brand",
    model,
    slug: model,
    category: "under_sink",
    removes: matched,
    certifications: [],
    priceGbp: 100,
    priceTier: "mid",
    affiliateUrl: "https://example.com",
    affiliateProgram: "amazon",
    affiliateTag: "",
    imageUrl: "",
    rating: 4.5,
    badge: "best-match",
    pros: [],
    cons: [],
    bestFor: "Better tasting water",
    matchedCount: matched.length,
    matchedContaminants: matched,
  }) as unknown as RecommendedProduct;

const base: TankPlanInput = {
  district: "OX1",
  readings: [r("Nitrite", 0.42, 0.5, "warning"), r("Lead", 0.001, 0.01), r("E. coli", 0, 0), r("Conductivity", 539, null), r("Hardness (as CaCO3)", 253, null)],
  dataSource: "stream",
  sampleCount: 76,
  lastSampleDate: "2025-12-31",
  scoredCount: 3,
  hardness: { value: 253, estimated: false },
  recommendations: [product("Jug")],
};

describe("buildTankPlan headline", () => {
  it("says safe and very hard for a clean, hard district, and names the close result", () => {
    const p = buildTankPlan(base);
    expect(p.tone).toBe("clear");
    expect(p.headline).toEqual(["Safe to drink.", "Very hard."]);
    expect(p.basis).toContain("76 samples, 5 substances, latest on 31 December 2025.");
    expect(p.basis).toContain("nitrite, sits close to the line");
  });

  it("never says safe when a result is over the limit", () => {
    const p = buildTankPlan({ ...base, readings: [r("Lead", 0.02, 0.01, "fail"), r("Nitrate", 10, 50)] });
    expect(p.tone).toBe("over");
    expect(p.headline[0]).toBe("Lead is over the limit.");
    expect(p.headline.join(" ")).not.toContain("Safe");
  });

  it("never says safe on river-only data or a handful of tests", () => {
    expect(buildTankPlan({ ...base, dataSource: "ea-only" }).headline[0]).toBe("Too few tap tests to call it.");
    expect(buildTankPlan({ ...base, scoredCount: 2 }).headline[0]).toBe("Too few tap tests to call it.");
  });

  it("leaves hardness out of the headline when there is no reading", () => {
    expect(buildTankPlan({ ...base, hardness: null }).headline).toEqual(["Safe to drink."]);
  });
});

describe("buildTankPlan bubbles", () => {
  it("floats limited substances by share, and keeps zero-limit and no-limit readings aside", () => {
    const p = buildTankPlan(base);
    expect(p.bubbles.map((b) => b.name)).toEqual(["Nitrite", "Lead"]);
    expect(p.bubbles[0].share).toBeCloseTo(0.84);
    expect(p.others).toEqual([
      { name: "E. coli", text: "none found", good: true },
      { name: "Conductivity", text: "539 mg/L", good: true },
    ]);
  });
});

describe("buildTankPlan funnel", () => {
  it("leads with softener quotes in hard water when nothing is flagged", () => {
    const p = buildTankPlan(base);
    expect(p.primary?.kind).toBe("softener");
    expect(p.secondary[0]?.kind).toBe("product");
  });

  it("keeps the softener first in hard water when a result is only close to its limit", () => {
    const p = buildTankPlan({ ...base, recommendations: [product("RO", ["Nitrite"]), product("Jug")] });
    expect(p.primary?.kind).toBe("softener");
    expect(p.secondary[0]?.kind).toBe("product");
  });

  it("leads with the filter that removes a result over the limit, softener second", () => {
    const p = buildTankPlan({
      ...base,
      readings: [r("Nitrite", 0.6, 0.5, "fail"), r("Lead", 0.001, 0.01)],
      recommendations: [product("RO", ["Nitrite"]), product("Jug")],
    });
    expect(p.primary?.kind).toBe("product");
    expect(p.primary?.reason).toContain("Removes nitrite");
    expect(p.secondary[0]?.kind).toBe("softener");
  });

  it("leads with the general pick in soft water, and never offers a softener", () => {
    const p = buildTankPlan({ ...base, hardness: { value: 40, estimated: false } });
    expect(p.primary?.kind).toBe("product");
    expect([p.primary, ...p.secondary].some((a) => a?.kind === "softener")).toBe(false);
  });

  it("never writes 'Removes ,' when a product ranks on a boost rather than a match", () => {
    const boosted = { ...product("RO"), matchedCount: 50 } as RecommendedProduct;
    const p = buildTankPlan({ ...base, recommendations: [boosted] });
    const action = [p.primary, ...p.secondary].find((a) => a?.kind === "product");
    expect(action?.reason).toBe("Better tasting water");
  });

  it("caps the page at one primary and two secondary actions", () => {
    const p = buildTankPlan({ ...base, recommendations: [product("A"), product("B"), product("C")] });
    expect(p.secondary).toHaveLength(2);
  });
});

describe("formatting", () => {
  it("bands hardness on the site scale", () => {
    expect(hardnessBandLabel(40)).toBe("Soft");
    expect(hardnessBandLabel(190)).toBe("Hard");
    expect(hardnessBandLabel(241)).toBe("Very hard");
    expect(hardnessBandLabel(520)).toBe("Very hard");
  });
  it("trims float noise", () => {
    expect(formatReading(0.00007000000000000001)).toBe("0.00007");
    expect(formatReading(539)).toBe("539");
    expect(formatReading(0.0127)).toBe("0.0127");
  });
});
