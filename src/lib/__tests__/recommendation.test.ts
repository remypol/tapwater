import { describe, expect, it } from "vitest";
import { getRecommendationMessage, getTransparentLimitations } from "../recommendation";
import { getProductBySlug } from "../products";

describe("getRecommendationMessage", () => {
  it("keeps safe-water recommendations optional and non-alarmist", () => {
    expect(getRecommendationMessage({
      postcodeDistrict: "AL1",
      contaminantsFlagged: 0,
      matchedContaminants: [],
    })).toContain("optional");
    expect(getRecommendationMessage({
      postcodeDistrict: "AL1",
      contaminantsFlagged: 0,
      matchedContaminants: [],
    }).toLowerCase()).not.toContain("unsafe");
  });

  it("explains a matched contaminant without claiming the water is made safe", () => {
    const message = getRecommendationMessage({
      postcodeDistrict: "AL1",
      contaminantsFlagged: 1,
      matchedContaminants: ["Lead"],
    });

    expect(message).toContain("Lead");
    expect(message).toContain("flagged in AL1");
    expect(message.toLowerCase()).not.toContain("makes your water safe");
  });

  it("does not claim a practical match when no flagged concern matches", () => {
    expect(getRecommendationMessage({
      postcodeDistrict: "AL1",
      contaminantsFlagged: 1,
      matchedContaminants: [],
    })).toContain("does not directly match");
  });

  it("discloses partial coverage of flagged concerns", () => {
    const message = getRecommendationMessage({
      postcodeDistrict: "AL1",
      contaminantsFlagged: 3,
      matchedContaminants: ["Lead", "PFAS"],
    });

    expect(message).toContain("Lead and PFAS");
    expect(message).toContain("does not cover 1 other flagged concern");
  });
});

describe("getTransparentLimitations", () => {
  it("surfaces the catalogue's removal limitations", () => {
    const brita = getProductBySlug("brita-marella-xl");
    expect(brita).toBeDefined();
    expect(getTransparentLimitations(brita!)).toContain(
      "Does not remove PFAS, fluoride, or nitrates",
    );
  });
});
