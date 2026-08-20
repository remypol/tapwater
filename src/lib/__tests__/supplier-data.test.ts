import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Chainable Supabase query-builder stub: every method returns itself and the
 * chain is awaitable, resolving to whatever `result` holds at call time.
 */
const result: { data: unknown; error: unknown } = { data: [], error: null };
const eqCalls: [string, string][] = [];

function makeBuilder() {
  const builder = {
    select: () => builder,
    eq: (column: string, value: string) => {
      eqCalls.push([column, value]);
      return builder;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    then: (resolve: (value: any) => void) => resolve(result),
  };
  return builder;
}

vi.mock("@/lib/supabase", () => ({
  // data.ts guards on the `supabase` instance: null sends getSuppliersList
  // down the MOCK_SUPPLIERS fallback, which is exactly what we want to test.
  supabase: null,
  getSupabase: () => ({
    from: () => makeBuilder(),
  }),
}));

import { getSupplierBySlug } from "../data";
import { getActiveIncidentsForSupplier } from "../incidents";

beforeEach(() => {
  result.data = [];
  result.error = null;
  eqCalls.length = 0;
});

describe("getSupplierBySlug", () => {
  it("resolves a known supplier through the unified list", async () => {
    const supplier = await getSupplierBySlug("wessex-water");
    expect(supplier?.name).toBe("Wessex Water");
    expect(supplier?.postcodeAreas.length).toBeGreaterThan(0);
  });

  it("returns null for an unknown slug instead of throwing", async () => {
    expect(await getSupplierBySlug("niet-bestaande-supplier")).toBeNull();
  });
});

describe("getActiveIncidentsForSupplier", () => {
  it("filters on active status and the supplier_id column", async () => {
    result.data = [{ id: "1", supplier_id: "thames-water" }];
    const incidents = await getActiveIncidentsForSupplier("thames-water");
    expect(incidents).toHaveLength(1);
    expect(eqCalls).toContainEqual(["status", "active"]);
    expect(eqCalls).toContainEqual(["supplier_id", "thames-water"]);
  });

  it("returns an empty list on query errors rather than crashing the page", async () => {
    result.error = { message: "boom" };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await getActiveIncidentsForSupplier("thames-water")).toEqual([]);
    spy.mockRestore();
  });
});
