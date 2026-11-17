import { describe, it, expect } from "vitest";
import {
  MARKETPLACE_GUIDE,
  NO_PUBLISHED_PRICE,
  SOFTENER_PRICES,
  formatGbp,
  formatPriceRange,
  installedPriceRange,
  lowestPrice,
  unitPriceRange,
} from "../softener-prices";

describe("SOFTENER_PRICES", () => {
  it("has enough rows to be a comparison, with at least one installed price", () => {
    expect(SOFTENER_PRICES.length).toBeGreaterThanOrEqual(8);
    expect(SOFTENER_PRICES.some((r) => r.includes === "installed")).toBe(true);
    expect(SOFTENER_PRICES.some((r) => r.includes === "unit")).toBe(true);
  });

  it("gives every row an https source and a checked date", () => {
    for (const row of SOFTENER_PRICES) {
      expect(row.sourceUrl, `${row.brand} ${row.model}`).toMatch(/^https:\/\//);
      expect(row.sourceName.length, `${row.brand} ${row.model}`).toBeGreaterThan(0);
      expect(row.checked, `${row.brand} ${row.model}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("gives every row a real price: never zero, never missing", () => {
    for (const row of SOFTENER_PRICES) {
      const label = `${row.brand} ${row.model}`;
      const published = [row.priceGbp, row.priceFromGbp, row.priceToGbp].filter(
        (p): p is number => p !== undefined,
      );
      expect(published.length, label).toBeGreaterThan(0);
      for (const p of published) expect(p, label).toBeGreaterThan(0);
      expect(Number.isFinite(lowestPrice(row)), label).toBe(true);
    }
  });

  it("does not give a row both a single price and a range", () => {
    for (const row of SOFTENER_PRICES) {
      if (row.priceGbp !== undefined) {
        expect(row.priceFromGbp, `${row.brand} ${row.model}`).toBeUndefined();
        expect(row.priceToGbp, `${row.brand} ${row.model}`).toBeUndefined();
      }
      if (row.priceToGbp !== undefined) {
        expect(row.priceFromGbp, `${row.brand} ${row.model}`).toBeLessThan(row.priceToGbp);
      }
    }
  });

  it("does not list the same model twice from the same source", () => {
    const keys = SOFTENER_PRICES.map((r) => `${r.brand}|${r.model}|${r.sourceName}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("keeps brands with no published price out of the price table", () => {
    const priced = new Set(SOFTENER_PRICES.map((r) => r.brand));
    for (const b of NO_PUBLISHED_PRICE) {
      expect(priced.has(b.brand), b.brand).toBe(false);
      expect(b.sourceUrl).toMatch(/^https:\/\//);
    }
  });
});

describe("installedPriceRange", () => {
  it("returns a low below the high", () => {
    const { low, high } = installedPriceRange();
    expect(low).toBeGreaterThan(0);
    expect(low).toBeLessThan(high);
  });

  it("starts at the cheapest installed row and ends at the top marketplace band", () => {
    const { low, high } = installedPriceRange();
    const installed = SOFTENER_PRICES.filter((r) => r.includes === "installed").map(lowestPrice);
    expect(low).toBe(Math.min(...installed));
    expect(high).toBe(Math.max(...MARKETPLACE_GUIDE.installedBands.map((b) => b.high)));
  });

  it("brackets the marketplace average", () => {
    const { low, high } = installedPriceRange();
    expect(MARKETPLACE_GUIDE.averageInstalledGbp).toBeGreaterThanOrEqual(low);
    expect(MARKETPLACE_GUIDE.averageInstalledGbp).toBeLessThanOrEqual(high);
  });
});

describe("unitPriceRange", () => {
  it("spans the unit-only rows and sits below the installed range's top", () => {
    const unit = unitPriceRange();
    expect(unit.low).toBeLessThan(unit.high);
    expect(unit.high).toBeLessThan(installedPriceRange().high);
  });
});

describe("formatPriceRange", () => {
  it("formats whole pounds with thousands separators", () => {
    expect(formatPriceRange({ low: 1195, high: 2900 })).toBe("£1,195 to £2,900");
    expect(formatPriceRange({ low: 540, high: 1000 })).toBe("£540 to £1,000");
  });

  it("keeps pence when a price has them", () => {
    expect(formatPriceRange({ low: 591.83, high: 976.49 })).toBe("£591.83 to £976.49");
    expect(formatGbp(912.6)).toBe("£912.60");
  });

  it("formats the live installed range without decimals or stray symbols", () => {
    expect(formatPriceRange(installedPriceRange())).toMatch(/^£[\d,]+ to £[\d,]+$/);
  });
});
