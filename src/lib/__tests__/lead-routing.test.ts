import { describe, expect, it } from "vitest";
import { isDeliverableBacklog, isDuplicateLead, normaliseAreas, partnerCovers, pickPartners, postcodeAreaOf, type RoutablePartner } from "../lead-routing";

const partner = (id: string, over: Partial<RoutablePartner> = {}): RoutablePartner => ({
  id,
  status: "active",
  coverage_areas: ["RG"],
  coverage_postcodes: null,
  approved_at: "2026-11-01T00:00:00Z",
  created_at: "2026-10-01T00:00:00Z",
  ...over,
});

describe("postcodeAreaOf", () => {
  it("takes the letters before the first digit", () => {
    expect(postcodeAreaOf("RG41")).toBe("RG");
    expect(postcodeAreaOf("n1")).toBe("N");
    expect(postcodeAreaOf("SW1A")).toBe("SW");
  });
  it("returns nothing for input that is not a district", () => {
    expect(postcodeAreaOf("READING")).toBe("");
    expect(postcodeAreaOf("")).toBe("");
  });
});

describe("normaliseAreas", () => {
  it("accepts ticked areas and typed districts, de-duplicated and sorted", () => {
    expect(normaliseAreas(["sl", "RG41", "RG", "rg8"])).toEqual(["RG", "SL"]);
    expect(normaliseAreas("tw, kt1; N")).toEqual(["KT", "N", "TW"]);
  });
  it("drops anything that is not a postcode", () => {
    expect(normaliseAreas(["Berkshire", 12, null, "<script>"])).toEqual([]);
    expect(normaliseAreas(undefined)).toEqual([]);
  });
});

describe("partnerCovers", () => {
  it("matches on postcode area", () => {
    expect(partnerCovers(partner("a"), "RG41")).toBe(true);
    expect(partnerCovers(partner("a"), "SL1")).toBe(false);
  });
  it("does not let N catch NW or NG", () => {
    const north = partner("a", { coverage_areas: ["N"] });
    expect(partnerCovers(north, "N7")).toBe(true);
    expect(partnerCovers(north, "NW3")).toBe(false);
    expect(partnerCovers(north, "NG1")).toBe(false);
  });
  it("honours the older district list exactly", () => {
    const p = partner("a", { coverage_areas: [], coverage_postcodes: ["SL1", "TW"] });
    expect(partnerCovers(p, "SL1")).toBe(true);
    expect(partnerCovers(p, "SL11")).toBe(false);
    expect(partnerCovers(p, "TW16")).toBe(true);
  });
});

describe("pickPartners", () => {
  it("skips pending and paused installers", () => {
    const picked = pickPartners([partner("a", { status: "pending" }), partner("b", { status: "paused" }), partner("c")], "RG1");
    expect(picked.map((p) => p.id)).toEqual(["c"]);
  });
  it("serves the longest-standing installers first and stops at the cap", () => {
    const picked = pickPartners(
      [
        partner("late", { approved_at: "2026-11-10T00:00:00Z" }),
        partner("first", { approved_at: "2026-09-01T00:00:00Z" }),
        partner("second", { approved_at: "2026-10-01T00:00:00Z" }),
      ],
      "RG1",
    );
    expect(picked.map((p) => p.id)).toEqual(["first", "second"]);
  });
  it("counts installers who already have the lead against the cap", () => {
    const all = [partner("a"), partner("b", { approved_at: "2026-11-02T00:00:00Z" }), partner("c", { approved_at: "2026-11-03T00:00:00Z" })];
    expect(pickPartners(all, "RG1", new Set(["a"])).map((p) => p.id)).toEqual(["b"]);
    expect(pickPartners(all, "RG1", new Set(["a", "b"]))).toEqual([]);
  });
});

describe("isDuplicateLead", () => {
  const existing = [{ email: "Jo@Example.com", postcode_district: "RG41", created_at: "2026-11-02T14:33:25Z" }];
  it("treats a second submit five seconds later as the same request", () => {
    expect(isDuplicateLead({ email: "jo@example.com", district: "rg41", at: new Date("2026-11-02T14:33:30Z") }, existing)).toBe(true);
  });
  it("lets the same person ask about another district, or again after the window", () => {
    expect(isDuplicateLead({ email: "jo@example.com", district: "RG8", at: new Date("2026-11-02T14:33:30Z") }, existing)).toBe(false);
    expect(isDuplicateLead({ email: "jo@example.com", district: "RG41", at: new Date("2026-11-04T14:33:30Z") }, existing)).toBe(false);
  });
});

describe("isDeliverableBacklog", () => {
  const now = new Date("2026-11-17T12:00:00Z");
  it("needs recorded consent", () => {
    expect(isDeliverableBacklog({ consent_to_installer_sharing: false, created_at: "2026-11-16T00:00:00Z" }, now)).toBe(false);
    expect(isDeliverableBacklog({ consent_to_installer_sharing: null, created_at: "2026-11-16T00:00:00Z" }, now)).toBe(false);
  });
  it("stops after 30 days", () => {
    expect(isDeliverableBacklog({ consent_to_installer_sharing: true, created_at: "2026-10-20T00:00:00Z" }, now)).toBe(true);
    expect(isDeliverableBacklog({ consent_to_installer_sharing: true, created_at: "2026-10-10T00:00:00Z" }, now)).toBe(false);
  });
});
