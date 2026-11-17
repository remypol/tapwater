import { describe, it, expect } from "vitest";
import { isRankable, MIN_TESTED_TO_RANK } from "../data";
import type { PostcodeData } from "../types";

/**
 * isRankable decides which districts may be named on the homepage, in /rankings and
 * in the press stories that hand journalists a ready-made citation.
 *
 * Before this gate, ranking by score alone put river and groundwater samples at the
 * top of "highest lead levels in drinking water" — DA13 was headlined off a sample
 * taken in January 2000, on a page that says "tap water tests not yet available for
 * Thames Water". And "cleanest water" showed three 10.0/10 scores each built on two
 * measured parameters.
 */

function yearsAgo(n: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d.toISOString().split("T")[0];
}

function district(overrides: Partial<PostcodeData> = {}): PostcodeData {
  return {
    district: "LS1",
    safetyScore: 7,
    dataSource: "stream",
    lastSampleDate: yearsAgo(1),
    contaminantsTested: 22,
    ...overrides,
  } as PostcodeData;
}

describe("isRankable", () => {
  it("accepts recent, well-tested drinking water results", () => {
    expect(isRankable(district())).toBe(true);
  });

  it("rejects environmental monitoring, however bad the score looks", () => {
    // River and groundwater samples flag far more than treated tap water does, so
    // ranking by score alone selects for them.
    expect(isRankable(district({ dataSource: "ea-only", safetyScore: 5.2 }))).toBe(false);
  });

  it("rejects samples older than three years", () => {
    expect(isRankable(district({ lastSampleDate: yearsAgo(4) }))).toBe(false);
    expect(isRankable(district({ lastSampleDate: yearsAgo(2) }))).toBe(true);
  });

  it("rejects a headline score built on a handful of parameters", () => {
    expect(isRankable(district({ safetyScore: 10, contaminantsTested: 2 }))).toBe(false);
    expect(isRankable(district({ contaminantsTested: MIN_TESTED_TO_RANK }))).toBe(true);
  });

  it("rejects districts with no score at all", () => {
    expect(isRankable(district({ safetyScore: -1 }))).toBe(false);
  });

  it("accepts mixed sources, which still contain drinking water results", () => {
    expect(isRankable(district({ dataSource: "mixed" }))).toBe(true);
  });

  it("keeps districts on borrowed Thames zones out, and lets matched ones in", () => {
    // E1 and W4 have no zone of their own from Thames's checker; they borrow their neighbours'.
    expect(isRankable(district({ district: "E1" }))).toBe(false);
    expect(isRankable(district({ district: "W4" }))).toBe(false);
    // SE10 and DA5 shared one zone's lead reading under the old rotation. Both now have their own zones.
    expect(isRankable(district({ district: "SE10" }))).toBe(true);
    expect(isRankable(district({ district: "DA5" }))).toBe(true);
    expect(isRankable(district({ district: "LS1" }))).toBe(true);
  });
});
