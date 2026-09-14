import { describe, it, expect } from "vitest";
import {
  districtHighlights,
  highlightDescription,
  ordinal,
  type HighlightInput,
} from "@/lib/district-highlights";
import type { PostcodeData, ContaminantReading } from "@/lib/types";

const NOW = new Date("2026-09-14T12:00:00Z");

function reading(partial: Partial<ContaminantReading> & { name: string }): ContaminantReading {
  return {
    value: 1,
    unit: "mg/l",
    ukLimit: 10,
    whoGuideline: null,
    status: "pass",
    ...partial,
  };
}

function district(partial: Partial<PostcodeData> = {}): PostcodeData {
  return {
    district: "LU5",
    areaName: "Dunstable",
    city: "Luton",
    region: "East of England",
    latitude: 51.9,
    longitude: -0.5,
    supplier: "Affinity Water",
    supplierId: "affinity-water",
    supplyZone: "",
    safetyScore: 7.4,
    scoreGrade: "good",
    contaminantsTested: 12,
    contaminantsFlagged: 0,
    pfasDetected: false,
    pfasLevel: null,
    pfasSource: null,
    lastUpdated: "2026-08-01",
    lastSampleDate: "2026-06-10",
    readings: [
      reading({ name: "Nitrate", value: 31, ukLimit: 50 }),
      reading({ name: "Lead", value: 0.5, ukLimit: 10, unit: "µg/l" }),
      reading({ name: "Copper", value: 0.1, ukLimit: 2 }),
    ],
    nearbyPostcodes: [],
    dataSource: "stream",
    drinkingWaterReadings: [],
    environmentalReadings: [],
    sampleCount: 140,
    dateRange: { from: "2025-01-05", to: "2026-06-10" },
    ...partial,
  };
}

function input(partial: Partial<HighlightInput> = {}): HighlightInput {
  const data = partial.data ?? district();
  return {
    data,
    cityPeers: [data],
    neighbours: [],
    nationalAverage: 6.9,
    hardness: null,
    pfasNearby: null,
    cityName: "Luton",
    citySlug: "luton",
    now: NOW,
    ...partial,
  };
}

describe("ordinal", () => {
  it("handles the English exceptions", () => {
    expect(ordinal(1)).toBe("1st");
    expect(ordinal(2)).toBe("2nd");
    expect(ordinal(3)).toBe("3rd");
    expect(ordinal(4)).toBe("4th");
    expect(ordinal(11)).toBe("11th");
    expect(ordinal(12)).toBe("12th");
    expect(ordinal(13)).toBe("13th");
    expect(ordinal(21)).toBe("21st");
    expect(ordinal(102)).toBe("102nd");
    expect(ordinal(111)).toBe("111th");
  });
});

describe("districtHighlights", () => {
  it("returns nothing for an unscored district", () => {
    expect(districtHighlights(input({ data: district({ safetyScore: -1 }) }))).toEqual([]);
  });

  it("puts an exceeded limit ahead of everything except staleness", () => {
    const data = district({
      contaminantsFlagged: 1,
      readings: [
        reading({ name: "Nitrate", value: 62, ukLimit: 50, status: "fail" }),
        reading({ name: "Lead", value: 0.5, ukLimit: 10, unit: "µg/l" }),
      ],
    });
    const [first] = districtHighlights(input({ data }));
    expect(first.kind).toBe("exceeded");
    expect(first.lead).toBe("Nitrate was measured at 62 mg/l, 24% over the UK limit");
    expect(first.detail).toContain("the only one of 12 tested substances");
  });

  it("uses 'times' wording once a reading is at least double its limit", () => {
    const data = district({
      contaminantsFlagged: 2,
      readings: [
        reading({ name: "Iron", value: 900, ukLimit: 200, unit: "µg/l", status: "fail" }),
        reading({ name: "Manganese", value: 60, ukLimit: 50, unit: "µg/l", status: "warning" }),
      ],
    });
    const [first] = districtHighlights(input({ data }));
    expect(first.lead).toBe("Iron was measured at 900 µg/l, 4.5 times the UK limit");
    expect(first.detail).toContain("of the 2 substances flagged");
  });

  it("puts a zero-tolerance detection ahead of a numeric exceedance", () => {
    const data = district({
      contaminantsFlagged: 2,
      readings: [
        reading({ name: "Coliform Bacteria", value: 3, unit: "count/100ml", ukLimit: 0, whoGuideline: 0, status: "fail" }),
        reading({ name: "Nitrite", value: 0.38, ukLimit: 0.5, status: "warning" }),
      ],
    });
    const [first] = districtHighlights(input({ data }));
    expect(first.kind).toBe("exceeded");
    expect(first.lead).toBe(
      "Coliform Bacteria detected at 3 per 100 ml, where any amount fails the legal standard",
    );
    expect(first.detail).toBe("Any detection is a failure for this substance. It is one of 2 flagged here.");
  });

  it("treats a warning as flagged but not over the limit", () => {
    const data = district({
      contaminantsFlagged: 1,
      readings: [
        reading({ name: "Nitrite", value: 0.38, ukLimit: 0.5, status: "warning" }),
        reading({ name: "Lead", value: 0.5, ukLimit: 10, unit: "µg/l" }),
      ],
    });
    const hs = districtHighlights(input({ data }), 10);
    expect(hs.find((h) => h.kind === "exceeded")).toBeUndefined();
    const near = hs.find((h) => h.kind === "near-limit");
    expect(near?.lead).toBe(
      "Nitrite is within its legal limit but flagged, at 76% of the 0.5 mg/l maximum",
    );
    expect(hs[0].kind).toBe("near-limit");
  });

  it("leads with staleness when the newest sample is over two years old", () => {
    const data = district({ lastSampleDate: "2023-03-01" });
    const [first] = districtHighlights(input({ data }));
    expect(first.kind).toBe("stale");
    expect(first.lead).toBe("The newest sample here is from March 2023");
    expect(first.detail).toContain("over 3 years old");
  });

  it("names the reading closest to its limit when nothing failed", () => {
    const hs = districtHighlights(input());
    const near = hs.find((h) => h.kind === "near-limit");
    expect(near?.lead).toBe(
      "Nitrate is the reading closest to its limit, at 62% of the 50 mg/l maximum",
    );
  });

  it("says so when nothing came near a limit", () => {
    const data = district({
      readings: [
        reading({ name: "Nitrate", value: 5, ukLimit: 50 }),
        reading({ name: "Lead", value: 0.5, ukLimit: 10, unit: "µg/l" }),
      ],
    });
    const near = districtHighlights(input({ data }), 10).find((h) => h.kind === "near-limit");
    expect(near?.lead).toBe("Nothing tested came within 40% of its legal limit");
    expect(near?.detail).toBe("The highest was Nitrate at 10% of the 50 mg/l maximum.");
  });

  it("ranks the district against its city and names the runner-up", () => {
    const me = district({ safetyScore: 8.2 });
    const peers = [
      me,
      district({ district: "LU1", safetyScore: 7.9 }),
      district({ district: "LU2", safetyScore: 6.1 }),
      district({ district: "LU3", safetyScore: 5.0 }),
    ];
    const rank = districtHighlights(input({ data: me, cityPeers: peers }), 10).find((h) => h.kind === "city-rank");
    expect(rank?.lead).toBe("The cleanest tap water of the 4 areas tested in Luton");
    expect(rank?.detail).toBe("LU5 scores 8.2 out of 10, ahead of LU1 in second place on 7.9.");
    expect(rank?.link?.href).toBe("/city/luton");
  });

  it("uses an ordinal for a mid-table district", () => {
    const me = district({ safetyScore: 7.0 });
    const peers = [
      me,
      district({ district: "LU1", safetyScore: 7.9 }),
      district({ district: "LU2", safetyScore: 6.1 }),
      district({ district: "LU3", safetyScore: 5.0 }),
      district({ district: "LU4", safetyScore: 8.5 }),
    ];
    const rank = districtHighlights(input({ data: me, cityPeers: peers }), 10).find((h) => h.kind === "city-rank");
    expect(rank?.lead).toBe("3rd cleanest of 5 areas tested in Luton");
  });

  it("skips the city rank when fewer than three peers are scored", () => {
    const me = district();
    const peers = [me, district({ district: "LU1", safetyScore: 7.9 })];
    const hs = districtHighlights(input({ data: me, cityPeers: peers }), 10);
    expect(hs.find((h) => h.kind === "city-rank")).toBeUndefined();
  });

  it("describes hardness with the district or area it was measured in", () => {
    const measured = districtHighlights(
      input({ hardness: { value: 312, label: "very hard", estimated: false } }),
      10,
    ).find((h) => h.kind === "hardness");
    expect(measured?.lead).toBe("Among the hardest water in the country at 312 mg/L");
    expect(measured?.detail).toContain("in LU5");

    const estimated = districtHighlights(
      input({ hardness: { value: 45, label: "soft", estimated: true, estimatedFrom: "LU" } }),
      10,
    ).find((h) => h.kind === "hardness");
    expect(estimated?.lead).toBe("Soft water at 45 mg/L");
    expect(estimated?.detail).toContain("across the LU postcode area");
  });

  it("compares against neighbours only with three or more of them", () => {
    const two = districtHighlights(
      input({ neighbours: [{ district: "LU1", score: 5 }, { district: "LU2", score: 6 }] }),
      10,
    );
    expect(two.find((h) => h.kind === "neighbours")).toBeUndefined();

    const three = districtHighlights(
      input({
        neighbours: [
          { district: "LU1", score: 5 },
          { district: "LU2", score: 6 },
          { district: "LU3", score: 7.2 },
        ],
      }),
      10,
    ).find((h) => h.kind === "neighbours");
    expect(three?.lead).toBe("Scores higher than all 3 neighbouring districts");
    expect(three?.detail).toBe("The nearest rival is LU3 on 7.2, against 7.4 here.");
  });

  it("never returns two facts of the same kind and honours the limit", () => {
    const hs = districtHighlights(input(), 3);
    expect(hs).toHaveLength(3);
    expect(new Set(hs.map((h) => h.kind)).size).toBe(3);
  });

  it("gives two different districts different leading facts", () => {
    const hard = districtHighlights(
      input({ hardness: { value: 320, label: "very hard", estimated: false } }),
    );
    const failing = districtHighlights(
      input({
        data: district({
          district: "M18",
          contaminantsFlagged: 1,
          readings: [reading({ name: "Lead", value: 14, ukLimit: 10, unit: "µg/l", status: "fail" })],
        }),
      }),
    );
    expect(hard[0].lead).not.toBe(failing[0].lead);
    expect(hard[0].kind).toBe("hardness");
    expect(failing[0].kind).toBe("exceeded");
  });
});

describe("highlightDescription", () => {
  it("carries the top fact and stays under 155 characters", () => {
    const hs = districtHighlights(input({ hardness: { value: 312, label: "very hard", estimated: false } }));
    const desc = highlightDescription(district(), hs, 2026);
    expect(desc).toBe(
      "LU5 tap water (Dunstable). Among the hardest water in the country at 312 mg/L. Free 2026 report.",
    );
    expect(desc.length).toBeLessThanOrEqual(155);
  });

  it("drops the tail rather than exceed the limit", () => {
    const long = district({ areaName: "Dunstable, Houghton Regis and the surrounding villages of south Bedfordshire" });
    const hs = districtHighlights(input({ data: long }));
    const desc = highlightDescription(long, hs, 2026);
    expect(desc.length).toBeLessThanOrEqual(155);
  });

  it("falls back to the score when there are no highlights", () => {
    expect(highlightDescription(district(), [], 2026)).toBe(
      "LU5 tap water (Dunstable): 12 substances tested, scored 7.4/10. Free 2026 report.",
    );
  });
});

describe("hardness bands match the site's labels", () => {
  it("calls 193 mg/L hard, not very hard", () => {
    const h = districtHighlights(input({ hardness: { value: 193, label: "hard", estimated: false } }), 10).find((x) => x.kind === "hardness");
    expect(h?.lead).toBe("Hard water at 193 mg/L");
  });
  it("calls 260 mg/L very hard", () => {
    const h = districtHighlights(input({ hardness: { value: 260, label: "very hard", estimated: false } }), 10).find((x) => x.kind === "hardness");
    expect(h?.lead).toBe("Very hard water at 260 mg/L");
  });
});
