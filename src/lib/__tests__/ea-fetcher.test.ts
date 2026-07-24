import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchRecentObservations } from "../ea-fetcher";

/**
 * The EA archive holds decades of readings per sampling point and hands them back
 * oldest first, with no sort parameter. Fetching a plain first page therefore
 * returns the earliest readings ever taken — on SO-E0000957 that is January 2000,
 * while the same point has readings from last month.
 *
 * The site published those 2000 figures as current water quality, headline score
 * included. These tests pin the paging that reaches the recent end instead.
 */

function observation(date: string, determinand = "Nitrate as N", value = 1) {
  return {
    observedProperty: { prefLabel: determinand, notation: "117" },
    hasSimpleResult: value,
    hasUnit: "mg/l",
    phenomenonTime: date,
  };
}

function mockEa(total: number, page: Record<string, unknown>[]) {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      calls.push(url);
      const isCountProbe = url.includes("limit=1&") || url.endsWith("limit=1");
      return {
        ok: true,
        json: async () =>
          isCountProbe
            ? { totalItems: total, member: page.slice(0, 1) }
            : { totalItems: total, member: page },
      };
    }),
  );
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe("fetchRecentObservations", () => {
  it("pages to the newest readings instead of the oldest", async () => {
    const calls = mockEa(4066, [observation("2026-06-19T09:00:00")]);

    await fetchRecentObservations("SO-E0000957", 50);

    // 4066 total, 50 wanted → start at 4016 so the window lands on the recent end.
    const dataCall = calls.find((c) => c.includes("limit=50"));
    expect(dataCall).toContain("skip=4016");
  });

  it("does not skip when the point has fewer readings than the page size", async () => {
    const calls = mockEa(12, [observation("2026-06-19T09:00:00")]);

    await fetchRecentObservations("SO-SMALL", 50);

    const dataCall = calls.find((c) => c.includes("limit=50"));
    expect(dataCall).not.toContain("skip=");
  });

  it("still returns readings when the count is unavailable", async () => {
    // A failed probe must not cost us the whole sampling point: stale readings with
    // an honest age warning beat an empty page.
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("limit=1")) return { ok: false, json: async () => ({}) };
        return {
          ok: true,
          json: async () => ({ member: [observation("2001-01-01T09:00:00")] }),
        };
      }),
    );

    const obs = await fetchRecentObservations("SO-E0000957", 50);
    expect(obs).toHaveLength(1);
  });

  it("drops readings whose unit is not a water measurement", async () => {
    // Celsius and pH units are deliberately kept; flow and depth readings are not
    // water quality and must not reach the score.
    mockEa(2, [
      observation("2026-06-19T09:00:00"),
      { ...observation("2026-06-19T09:00:00", "River Depth"), hasUnit: "m" },
    ]);

    const obs = await fetchRecentObservations("SO-E0000957", 50);
    expect(obs.map((o) => o.determinand)).toEqual(["Nitrate as N"]);
  });
});
