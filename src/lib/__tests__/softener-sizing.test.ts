import { describe, expect, it } from "vitest";
import { householdLoad, householdLoads, LITRES_PER_PERSON_PER_DAY } from "../softener-sizing";

describe("householdLoad", () => {
  it("works out a year's water and the hardness minerals dissolved in it", () => {
    // 4 people x 137 litres x 365 days = 200,020 litres; at 295 mg/L that is 59 kg.
    expect(householdLoad(4, 295)).toEqual({ people: 4, litres: 200_000, kg: 59 });
    expect(householdLoad(1, 180)).toEqual({ people: 1, litres: 50_000, kg: 9 });
  });

  it("scales with the household and with the hardness", () => {
    const rows = householdLoads(300);
    expect(rows.map((r) => r.people)).toEqual([1, 2, 3, 4, 5]);
    expect(rows[4].kg).toBe(Math.round((5 * LITRES_PER_PERSON_PER_DAY * 365 * 300) / 1_000_000));
    expect(householdLoad(2, 400).kg).toBeGreaterThan(householdLoad(2, 200).kg);
  });
});
