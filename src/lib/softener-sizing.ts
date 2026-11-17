/**
 * The local figures behind "a water softener in {town}": how much dissolved
 * hardness a household takes in at the local reading. Pure, so it can be used
 * anywhere and is unit-tested.
 */

/**
 * Household water use in England: 136.5 litres a person a day in 2024-25, 137
 * the year before. Environment Agency, "Water resources 2024 to 2025: analysis
 * of the water industry's annual water resources performance" (gov.uk), read
 * 17 November 2026.
 */
export const LITRES_PER_PERSON_PER_DAY = 137;
export const WATER_USE_SOURCE = "the Environment Agency's figure for household water use in England";

export interface HouseholdLoad {
  people: number;
  /** Litres of mains water a year, to the nearest thousand. */
  litres: number;
  /** Kilograms of hardness minerals (as calcium carbonate) dissolved in that water. */
  kg: number;
}

/** What a household of this size takes in over a year at this hardness. */
export function householdLoad(people: number, hardnessMgL: number): HouseholdLoad {
  const litres = people * LITRES_PER_PERSON_PER_DAY * 365;
  return {
    people,
    litres: Math.round(litres / 1000) * 1000,
    kg: Math.round((litres * hardnessMgL) / 1_000_000),
  };
}

export const HOUSEHOLD_SIZES = [1, 2, 3, 4, 5];

export function householdLoads(hardnessMgL: number): HouseholdLoad[] {
  return HOUSEHOLD_SIZES.map((people) => householdLoad(people, hardnessMgL));
}

/** Requests in the last 90 days, the same window the installer page quotes. */
export const REQUEST_WINDOW_DAYS = 90;
