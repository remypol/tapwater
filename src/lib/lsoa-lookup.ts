/**
 * Postcode district → LSOA resolver.
 *
 * Queries the postcode_lsoa table (seeded from ONS NSPL) to find
 * all LSOAs that fall within a postcode district.
 */

import { supabase } from "./supabase";

/**
 * Get all unique LSOA codes for a postcode district.
 * e.g., "DE21" → ["E01013062", "E01013063", ...]
 */
export async function getLsoasForDistrict(district: string): Promise<string[]> {
  if (!supabase) return [];

  const pattern = `${district.toUpperCase()} %`;

  const { data, error } = await supabase
    .from("postcode_lsoa")
    .select("lsoa_code")
    .like("postcode", pattern);

  if (error || !data) {
    console.error(`[lsoa-lookup] Failed to get LSOAs for ${district}:`, error);
    return [];
  }

  // Deduplicate
  return [...new Set(data.map((row) => row.lsoa_code))];
}

/**
 * Batch resolve multiple postcode districts to their LSOA codes in parallel.
 * Returns a Map of district → LSOA codes.
 */
export async function getLsoasForDistricts(
  districts: string[],
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (!supabase || districts.length === 0) return result;

  const resolved = await Promise.all(
    districts.map(async (district) => ({
      district,
      lsoas: await getLsoasForDistrict(district),
    })),
  );

  for (const { district, lsoas } of resolved) {
    result.set(district, lsoas);
  }

  return result;
}
