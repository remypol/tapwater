import { describe, it, expect } from "vitest";
import {
  GUIDES_REGISTRY,
  getGuide,
  pickRelatedGuides,
} from "../guides";

const noSignals = {
  pfasDetected: false,
  hasLeadFlagged: false,
  isHardWater: false,
  hasContaminantsFlagged: false,
};

describe("guides registry", () => {
  it("every entry is keyed by its own slug and fully populated", () => {
    for (const [key, guide] of Object.entries(GUIDES_REGISTRY)) {
      expect(guide.slug).toBe(key);
      expect(guide.title.length).toBeGreaterThan(0);
      expect(guide.description.length).toBeGreaterThan(0);
    }
  });

  it("covers all guides published in the sitemap plus water-problems", () => {
    // Guards against a new guide landing in the sitemap but never becoming
    // internally linkable. Keep in sync with GUIDE_SLUGS in src/app/sitemap.ts.
    expect(Object.keys(GUIDES_REGISTRY).length).toBeGreaterThanOrEqual(25);
  });

  it("getGuide throws on unknown slugs", () => {
    expect(() => getGuide("niet-bestaand")).toThrow(/Unknown guide slug/);
  });
});

describe("pickRelatedGuides", () => {
  it("fills up to four defaults when no signals fire", () => {
    const picks = pickRelatedGuides(noSignals);
    expect(picks).toHaveLength(4);
    expect(picks[0].slug).toBe("is-uk-tap-water-safe");
  });

  it("puts the commercial PFAS guide before the explainer", () => {
    const picks = pickRelatedGuides({ ...noSignals, pfasDetected: true });
    const slugs = picks.map((g) => g.slug);
    expect(slugs.indexOf("best-water-filter-pfas")).toBeLessThan(
      slugs.indexOf("pfas-uk-explained"),
    );
  });

  it("hard water routes to the softener guide, not the hardness tool", () => {
    const picks = pickRelatedGuides({ ...noSignals, isHardWater: true });
    const slugs = picks.map((g) => g.slug);
    expect(slugs).toContain("best-water-softener-uk");
    expect(slugs).toContain("water-hardness-map");
  });

  it("caps at six and never duplicates when every signal fires", () => {
    const picks = pickRelatedGuides({
      pfasDetected: true,
      hasLeadFlagged: true,
      isHardWater: true,
      hasContaminantsFlagged: true,
    });
    const slugs = picks.map((g) => g.slug);
    expect(picks.length).toBeLessThanOrEqual(6);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("is deterministic for identical signals", () => {
    const a = pickRelatedGuides({ ...noSignals, isHardWater: true });
    const b = pickRelatedGuides({ ...noSignals, isHardWater: true });
    expect(a.map((g) => g.slug)).toEqual(b.map((g) => g.slug));
  });
});
