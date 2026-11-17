import { describe, expect, it } from "vitest";
import { isOverPartLLine, packDistricts, summarisePartL, unpackDistricts, type PartLDistrict } from "../part-l";

const rows: PartLDistrict[] = [
  { district: "IP1", value: 402, basis: "m" },
  { district: "IP2", value: 200, basis: "m" },
  { district: "IP3", value: 310, basis: "e" },
  { district: "RG1", value: 295.4, basis: "a" },
  { district: "M1", value: 29, basis: "m" },
];

describe("the 200 ppm line", () => {
  it("is greater than 200, as the document words it", () => {
    expect(isOverPartLLine(201)).toBe(true);
    expect(isOverPartLLine(200)).toBe(false);
    expect(isOverPartLLine(180)).toBe(false);
  });
});

describe("packing districts for the page", () => {
  it("round-trips district, value and basis", () => {
    const back = unpackDistricts(packDistricts(rows));
    expect(back.size).toBe(5);
    expect(back.get("RG1")).toEqual({ district: "RG1", value: 295, basis: "a" });
    expect(back.get("IP3")?.basis).toBe("e");
  });

  it("ignores anything malformed", () => {
    expect(unpackDistricts("IP1:402m,nonsense,:5m,M1:29x").size).toBe(1);
  });
});

describe("summarisePartL", () => {
  it("counts readings only and leaves area estimates out", () => {
    const s = summarisePartL(rows);
    expect(s.measured).toBe(4);
    expect(s.over).toBe(2);
    // Same count over the line, so the higher median leads.
    expect(s.areas.map((a) => a.area)).toEqual(["IP", "RG"]);
    expect(s.areas.find((a) => a.area === "IP")).toEqual({ area: "IP", measured: 2, over: 1, median: 301 });
    expect(s.areas.some((a) => a.area === "M")).toBe(false);
  });
});
