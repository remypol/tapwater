import { describe, expect, it } from "vitest";
import { buildHardnessTowns, nearbyTowns, townSlug, type TownSourceDistrict } from "../hardness-towns";
import { POST_TOWNS, type PostTown } from "@/data/post-towns";

const d = (district: string, value: number, measured = true): TownSourceDistrict => ({ district, areaName: "Wokingham", value, measured });

const TOWNS: PostTown[] = [
  { town: "Reading", county: "Berkshire", area: "RG", districts: ["RG1", "RG2"] },
  { town: "Wokingham", county: "Berkshire", area: "RG", districts: ["RG40", "RG41"] },
  { town: "Crowthorne", county: "Berkshire", area: "RG", districts: ["RG45"] },
  { town: "Whitchurch", county: "Hampshire", area: "RG", districts: ["RG28"] },
  { town: "Whitchurch", county: "Shropshire", area: "SY", districts: ["SY13"] },
  { town: "London", county: "London", area: "N", districts: ["N1"] },
];
const DISTRICTS = [d("RG1", 300), d("RG2", 290), d("RG40", 260.4), d("RG41", 235), d("RG45", 295, false), d("RG28", 280), d("SY13", 150), d("N1", 270)];

describe("townSlug", () => {
  it("makes a plain address from a town name", () => {
    expect(townSlug("Henley-on-Thames")).toBe("henley-on-thames");
    expect(townSlug("St Ives")).toBe("st-ives");
    expect(townSlug("Ystrad Mynach & Hengoed")).toBe("ystrad-mynach-and-hengoed");
  });
});

describe("buildHardnessTowns", () => {
  const towns = buildHardnessTowns(TOWNS, DISTRICTS);
  const bySlug = new Map(towns.map((t) => [t.slug, t]));

  it("leaves London and the town the postcode area is named after to their existing pages", () => {
    expect(bySlug.has("london")).toBe(false);
    expect(bySlug.has("reading")).toBe(false);
  });
  it("needs at least one district with its own reading", () => {
    expect(bySlug.has("crowthorne")).toBe(false);
  });
  it("reports the median, range and districts hardest first, from measured districts only", () => {
    const w = bySlug.get("wokingham")!;
    expect(w.median).toBe(248);
    expect([w.min, w.max]).toEqual([235, 260]);
    expect(w.districts.map((x) => x.district)).toEqual(["RG40", "RG41"]);
    expect(w.measuredCount).toBe(2);
  });
  it("tells apart towns that share a name", () => {
    expect(bySlug.get("whitchurch-hampshire")?.name).toBe("Whitchurch, Hampshire");
    expect(bySlug.get("whitchurch-shropshire")?.area).toBe("SY");
  });
  it("links towns in the same postcode area, closest in hardness first", () => {
    const near = nearbyTowns(bySlug.get("wokingham")!, towns).map((t) => t.slug);
    expect(near).toEqual(["whitchurch-hampshire"]);
  });
});

describe("the real post-town list", () => {
  const all = buildHardnessTowns(
    POST_TOWNS,
    POST_TOWNS.flatMap((t) => t.districts).map((code) => d(code, 200)),
  );
  it("gives every town a unique address that cannot be mistaken for a postcode area", () => {
    const slugs = all.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every((s) => s.length > 2 && /^[a-z0-9-]+$/.test(s))).toBe(true);
  });
  it("covers well over a thousand towns", () => {
    expect(all.length).toBeGreaterThan(1200);
  });
});
