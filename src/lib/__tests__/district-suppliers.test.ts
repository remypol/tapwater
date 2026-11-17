import { describe, expect, it } from "vitest";
import { SUPPLIER_NAMES, describeSupplierSplit, getDistrictSuppliers, getSupplier, getSupplierFor, supplierShare } from "../suppliers";
import { THAMES_DISTRICTS, getThamesZones, isThamesApproximateDistrict, thamesZoneCodes } from "../thames-zones";
import districtSuppliers from "../../data/district-suppliers.json";

const FILE = districtSuppliers as unknown as Record<string, [string, number][]>;

describe("district suppliers, from Ofwat's map", () => {
  it("names the company that really supplies places the council list got wrong", () => {
    // Each of these said Thames Water, Southern Water or Severn Trent before November 2026.
    expect(getSupplierFor("GU21", "Woking").id).toBe("affinity-water");
    expect(getSupplierFor("AL1", "St Albans").id).toBe("affinity-water");
    expect(getSupplierFor("SM1", "Sutton").id).toBe("ses-water");
    expect(getSupplierFor("RM1", "Havering").id).toBe("essex-suffolk-water");
    expect(getSupplierFor("BN21", "Eastbourne").id).toBe("south-east-water");
    expect(getSupplierFor("B70", "Sandwell").id).toBe("south-staffs-water");
    expect(getSupplierFor("RG1", "Reading").id).toBe("thames-water");
  });

  it("falls back to the council list outside England and Wales", () => {
    expect(getDistrictSuppliers("EH1")).toBeNull();
    expect(getSupplierFor("EH1", "City of Edinburgh")).toEqual(getSupplier("City of Edinburgh"));
    expect(getSupplierFor("BT1", "Belfast").id).toBe("ni-water");
  });

  it("leaves border districts that are mostly in Scotland to the fallback", () => {
    for (const d of ["DG16", "TD9", "TD12", "TD5"]) expect(getDistrictSuppliers(d)).toBeNull();
  });

  it("accepts lower case and stray spaces", () => {
    expect(getDistrictSuppliers(" gu21 ")?.[0].id).toBe("affinity-water");
  });

  it("has a display name for every supplier id in the file", () => {
    const ids = new Set(Object.values(FILE).flatMap((rows) => rows.map(([id]) => id)));
    for (const id of ids) expect(SUPPLIER_NAMES[id], id).toBeTruthy();
  });

  it("lists shares largest first, each at least 5%, adding up to about 100", () => {
    for (const [district, rows] of Object.entries(FILE)) {
      expect(rows.length, district).toBeGreaterThan(0);
      for (let i = 1; i < rows.length; i++) expect(rows[i - 1][1], district).toBeGreaterThanOrEqual(rows[i][1]);
      for (const [, share] of rows) expect(share, district).toBeGreaterThanOrEqual(5);
      const total = rows.reduce((s, [, share]) => s + share, 0);
      expect(total, district).toBeGreaterThanOrEqual(90);
      expect(total, district).toBeLessThanOrEqual(101);
    }
  });

  it("describes a split district and stays silent for a whole one", () => {
    expect(describeSupplierSplit("RG1")).toBeNull();
    const split = describeSupplierSplit("KT17");
    expect(split).toMatch(/^about \d+% of postcodes; .+ supplies the rest$/);
    const three = describeSupplierSplit("GU3");
    expect(three).toMatch(/^about \d+% of postcodes; .+ about \d+% and .+ about \d+%$/);
  });

  it("gives a company's share of a district", () => {
    expect(supplierShare("RG1", "thames-water")).toBe(100);
    expect(supplierShare("RG1", "affinity-water")).toBe(0);
    expect(supplierShare("EH1", "scottish-water")).toBeNull();
  });
});

describe("Thames zone map", () => {
  it("only holds districts Thames mainly supplies", () => {
    for (const d of THAMES_DISTRICTS) expect(getDistrictSuppliers(d)?.[0].id, d).toBe("thames-water");
  });

  it("no longer holds the places Thames does not supply", () => {
    for (const d of ["GU21", "AL1", "SM1", "RM1", "HA1", "RG40", "SN10"]) expect(getThamesZones(d), d).toBeNull();
  });

  it("gives every district at least one zone with a positive weight", () => {
    for (const d of THAMES_DISTRICTS) {
      const zones = Object.values(getThamesZones(d)?.zones ?? {});
      expect(zones.length, d).toBeGreaterThan(0);
      for (const w of zones) expect(w, d).toBeGreaterThan(0);
    }
  });

  it("marks only the short inner London districts as borrowed, and never from south of the river", () => {
    const approx = THAMES_DISTRICTS.filter(isThamesApproximateDistrict);
    expect(approx.length).toBeGreaterThan(15);
    for (const d of approx) {
      expect(d, d).toMatch(/^[ENW][0-9]$/);
      for (const code of Object.keys(getThamesZones(d)?.zones ?? {})) expect(code, d).toMatch(/^(NL|LV)/);
    }
    expect(isThamesApproximateDistrict("RG1")).toBe(false);
    expect(isThamesApproximateDistrict("GU21")).toBe(false);
  });

  it("lists the zone codes the import needs", () => {
    const codes = thamesZoneCodes();
    expect(codes).toContain("R31");
    expect(new Set(codes).size).toBe(codes.length);
  });
});
