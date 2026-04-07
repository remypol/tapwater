import { describe, it, expect } from "vitest";
import { generateSlug, generateSourceHash } from "@/lib/incidents";

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
