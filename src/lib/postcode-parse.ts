/**
 * Turn whatever someone typed into the district we hold data for.
 *
 * Reports are per district ("SW1A", "M1"), which is the outward half of a full
 * postcode. Accepts "sw1a 1aa", "SW1A1AA", "sw1a", with any spacing or case.
 */
const DISTRICT_RE = /^[A-Z]{1,2}[0-9][0-9A-Z]?$/;

export function extractDistrict(input: string): string | null {
  const normalized = input.trim().toUpperCase();
  const parts = normalized.split(/\s+/);
  let district: string;
  if (parts.length > 1) {
    district = parts[0];
  } else {
    const compact = normalized.replace(/[^A-Z0-9]/g, "");
    // A full postcode without a space: the inward code is always digit + two letters.
    district = /^[A-Z]{1,2}[0-9][0-9A-Z]?[0-9][A-Z]{2}$/.test(compact) ? compact.slice(0, -3) : compact.slice(0, 4);
  }
  return DISTRICT_RE.test(district) ? district : null;
}
