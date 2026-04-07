import { describe, it, expect } from "vitest";
import { generateSlug, generateSourceHash } from "@/lib/incidents";
import { extractPostcodeDistricts, mapPostcodesToCities } from "@/lib/incident-parsers/postcode-matcher";

describe("generateSlug", () => {
  it("creates a URL-safe slug from incident data", () => {
    const slug = generateSlug("boil_notice", ["SE5", "SE15"], new Date("2026-04-08"));
    expect(slug).toBe("boil-notice-se5-se15-2026-04-08");
  });

  it("limits postcode count in slug to 3", () => {
    const slug = generateSlug("pollution", ["SW1", "SW2", "SW3", "SW4", "SW5"], new Date("2026-04-08"));
    expect(slug).toBe("pollution-sw1-sw2-sw3-2026-04-08");
  });

  it("handles empty postcodes", () => {
    const slug = generateSlug("general", [], new Date("2026-04-08"));
    expect(slug).toBe("general-2026-04-08");
  });
});

describe("generateSourceHash", () => {
  it("produces consistent hashes for same input", () => {
    const a = generateSourceHash("water_company", "boil_notice", ["SE5", "SE15"], "2026-04-08");
    const b = generateSourceHash("water_company", "boil_notice", ["SE15", "SE5"], "2026-04-08");
    expect(a).toBe(b);
  });

  it("produces different hashes for different input", () => {
    const a = generateSourceHash("water_company", "boil_notice", ["SE5"], "2026-04-08");
    const b = generateSourceHash("water_company", "pollution", ["SE5"], "2026-04-08");
    expect(a).not.toBe(b);
  });
});

describe("extractPostcodeDistricts", () => {
  it("extracts postcode districts from text", () => {
    const result = extractPostcodeDistricts("Affected areas: SE5, SE15 3AB, and SW1A 1AA");
    expect(result).toContain("SE5");
    expect(result).toContain("SE15");
    expect(result).toContain("SW1A");
  });

  it("returns empty array for text with no postcodes", () => {
    const result = extractPostcodeDistricts("No postcodes mentioned here");
    expect(result).toEqual([]);
  });

  it("deduplicates districts", () => {
    const result = extractPostcodeDistricts("SE5 1AB and SE5 2CD are affected");
    expect(result).toEqual(["SE5"]);
  });
});

describe("mapPostcodesToCities", () => {
  it("maps London postcodes to london slug", () => {
    const result = mapPostcodesToCities(["SE5", "SE15"]);
    expect(result).toContain("london");
  });

  it("returns empty for unknown postcodes", () => {
    const result = mapPostcodesToCities(["ZZ99"]);
    expect(result).toEqual([]);
  });
});
