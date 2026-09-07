import { describe, it, expect } from "vitest";
import {
  describeAgainstGuideline,
  formatMicrograms,
  formatSampleMonth,
  humaniseSiteLabel,
  pfasFilterPick,
} from "@/components/pfas-nearby";

/**
 * The copy helpers behind the "PFAS measured near you" module. The module quotes
 * a µg/L figure against the DWI guideline on every postcode page with samples in
 * range, so the wording has to stay in scale and never round a reading to zero.
 */

describe("formatMicrograms", () => {
  it("keeps three decimals for typical river readings", () => {
    expect(formatMicrograms(0.048)).toBe("0.048");
    expect(formatMicrograms(0.12)).toBe("0.12");
  });
  it("never collapses a small detection to zero", () => {
    expect(formatMicrograms(0.0012)).toBe("0.0012");
    expect(formatMicrograms(0.0005)).toBe("0.0005");
  });
  it("drops trailing zeros above 1", () => {
    expect(formatMicrograms(2.5)).toBe("2.5");
    expect(formatMicrograms(3)).toBe("3");
  });
});

describe("describeAgainstGuideline", () => {
  it("says how many times over for large readings", () => {
    expect(describeAgainstGuideline(1.2)).toMatch(/^That is 12 times the 0\.1 µg\/L guideline/);
    expect(describeAgainstGuideline(0.25)).toMatch(/^That is 2\.5 times/);
  });
  it("uses a percentage between a tenth and the guideline", () => {
    expect(describeAgainstGuideline(0.048)).toMatch(/about 48% of the 0\.1 µg\/L guideline/);
  });
  it("says well under for trace readings", () => {
    expect(describeAgainstGuideline(0.002)).toMatch(/well under/);
  });
  it("always names the Drinking Water Inspectorate and drinking water, not tap tests", () => {
    for (const v of [0.001, 0.05, 0.1, 0.5]) {
      const text = describeAgainstGuideline(v);
      expect(text).toContain("Drinking Water Inspectorate");
      expect(text).not.toMatch(/your tap/i);
    }
  });
});

describe("humaniseSiteLabel", () => {
  it("title-cases an EA label and keeps small words down", () => {
    expect(humaniseSiteLabel("RIVER LEE AT BOW LOCKS")).toBe("River Lee at Bow Locks");
  });
  it("keeps acronyms and codes upper case", () => {
    expect(humaniseSiteLabel("DUDGROVE STREAM AT GATE 7, RAF FAIRFORD")).toBe(
      "Dudgrove Stream at Gate 7, RAF Fairford",
    );
  });
  it("capitalises after hyphens and brackets", () => {
    expect(humaniseSiteLabel("STOUR (UPPER) D/S STOKE-ON-TRENT")).toBe(
      "Stour (Upper) D/S Stoke-On-Trent",
    );
  });
});

describe("formatSampleMonth", () => {
  it("renders month and year only", () => {
    expect(formatSampleMonth("2024-11-02")).toBe("November 2024");
  });
  it("falls back to the raw string when unparseable", () => {
    expect(formatSampleMonth("unknown")).toBe("unknown");
  });
});

describe("pfasFilterPick", () => {
  it("returns the PFAS guide's top pick, which removes PFAS", () => {
    const pick = pfasFilterPick();
    expect(pick?.id).toBe("waterdrop-g3p600");
    expect(pick?.removes).toContain("PFAS (total)");
  });
});
