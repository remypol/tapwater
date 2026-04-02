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
