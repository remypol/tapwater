import { describe, it, expect } from "vitest";
import { getStreamSource, getAllStreamSupplierIds } from "../stream-sources";

describe("getStreamSource", () => {
  it("returns config for yorkshire-water", () => {
    const source = getStreamSource("yorkshire-water");
    expect(source).not.toBeNull();
    expect(source!.orgId).toBe("1WqkK5cDKUbF0CkH");
    expect(source!.geoField).toBe("LSOA");
    expect(source!.services.length).toBeGreaterThan(0);
    expect(source!.services[0].year).toBeGreaterThanOrEqual(2024);
  });

  it("returns config for severn-trent", () => {
    const source = getStreamSource("severn-trent");
    expect(source).not.toBeNull();
    expect(source!.orgId).toBe("XxS6FebPX29TRGDJ");
  });

  it("returns null for thames-water (not on Stream)", () => {
    expect(getStreamSource("thames-water")).toBeNull();
  });

  it("returns null for unknown supplier", () => {
    expect(getStreamSource("nonexistent")).toBeNull();
  });

  it("returns config for cambridge-water", () => {
    const source = getStreamSource("cambridge-water");
    expect(source).not.toBeNull();
    expect(source!.orgId).toBe("XxS6FebPX29TRGDJ");
    expect(source!.services.length).toBeGreaterThan(0);
  });

  it("lists all stream supplier IDs", () => {
    const ids = getAllStreamSupplierIds();
    expect(ids).toContain("yorkshire-water");
    expect(ids).toContain("severn-trent");
    expect(ids).not.toContain("thames-water");
  });
});
