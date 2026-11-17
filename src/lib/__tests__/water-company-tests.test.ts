import { describe, it, expect } from "vitest";
import {
  UNCONFIRMED_OFFER,
  WATER_COMPANY_TESTS,
  WATER_COMPANY_TESTS_CHECKED,
  confirmedTestOffers,
  type WaterCompanyTest,
} from "../water-company-tests";

const row = (over: Partial<WaterCompanyTest>): WaterCompanyTest => ({
  company: "Example Water",
  offer: "Free lead test.",
  howToAsk: "Call them.",
  sourceUrl: "https://example.com/lead",
  checked: WATER_COMPANY_TESTS_CHECKED,
  confirmed: true,
  free: true,
  ...over,
});

describe("WATER_COMPANY_TESTS", () => {
  it("covers the fourteen major UK water companies", () => {
    const names = WATER_COMPANY_TESTS.map((r) => r.company);
    for (const expected of [
      "Thames Water",
      "Severn Trent",
      "United Utilities",
      "Anglian Water",
      "Yorkshire Water",
      "Southern Water",
      "South West Water",
      "Wessex Water",
      "Northumbrian Water",
      "Affinity Water",
      "South East Water",
      "Welsh Water (Dŵr Cymru)",
      "Scottish Water",
      "Northern Ireland Water",
    ]) {
      expect(names).toContain(expected);
    }
  });

  it("gives every row an https source URL and a checked date", () => {
    for (const r of WATER_COMPANY_TESTS) {
      expect(r.sourceUrl, r.company).toMatch(/^https:\/\/[^\s/]+\.[^\s/]+\//);
      expect(() => new URL(r.sourceUrl), r.company).not.toThrow();
      expect(r.checked, r.company).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(r.checked)), r.company).toBe(false);
    }
  });

  it("fills in every text field", () => {
    for (const r of WATER_COMPANY_TESTS) {
      expect(r.company.trim().length, r.company).toBeGreaterThan(0);
      expect(r.offer.trim().length, r.company).toBeGreaterThan(0);
      expect(r.howToAsk.trim().length, r.company).toBeGreaterThan(0);
    }
  });

  it("uses the 'Contact them to ask' wording on unconfirmed rows, and only there", () => {
    expect(UNCONFIRMED_OFFER).toBe("Contact them to ask");
    for (const r of WATER_COMPANY_TESTS) {
      if (r.confirmed) {
        expect(r.offer, r.company).not.toBe(UNCONFIRMED_OFFER);
      } else {
        expect(r.offer, r.company).toBe(UNCONFIRMED_OFFER);
      }
    }
  });

  it("never calls a test free unless the row is confirmed", () => {
    for (const r of WATER_COMPANY_TESTS) {
      if (r.free) expect(r.confirmed, r.company).toBe(true);
      // The word "free" may only appear in an offer the source page states is free.
      if (!r.free) expect(r.offer, r.company).not.toMatch(/\bfree\b/i);
    }
  });

  it("has no duplicate companies", () => {
    const names = WATER_COMPANY_TESTS.map((r) => r.company.trim().toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("confirmedTestOffers", () => {
  it("returns only confirmed rows, in the original order", () => {
    const rows = [
      row({ company: "A" }),
      row({ company: "B", confirmed: false, free: false, offer: UNCONFIRMED_OFFER }),
      row({ company: "C" }),
    ];
    expect(confirmedTestOffers(rows).map((r) => r.company)).toEqual(["A", "C"]);
  });

  it("does not change the list it is given", () => {
    const rows = [row({ company: "A", confirmed: false, free: false, offer: UNCONFIRMED_OFFER })];
    expect(confirmedTestOffers(rows)).toEqual([]);
    expect(rows).toHaveLength(1);
  });

  it("defaults to the published list", () => {
    const confirmed = confirmedTestOffers();
    expect(confirmed.length).toBeGreaterThan(0);
    expect(confirmed.every((r) => r.confirmed)).toBe(true);
    expect(confirmed.length).toBe(WATER_COMPANY_TESTS.filter((r) => r.confirmed).length);
  });
});
