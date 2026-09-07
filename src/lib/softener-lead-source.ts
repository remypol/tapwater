/**
 * Where a softener quote request was made. Shared by the lead form, the partner
 * CTA and the API route so a new entry point cannot ship a source value the
 * route silently rewrites to "postcode_page".
 */
export const SOFTENER_LEAD_SOURCES = [
  "postcode_page",
  "hardness_page",
  "softener_guide",
] as const;

export type SoftenerLeadSource = (typeof SOFTENER_LEAD_SOURCES)[number];

export function isSoftenerLeadSource(value: unknown): value is SoftenerLeadSource {
  return (
    typeof value === "string" &&
    (SOFTENER_LEAD_SOURCES as readonly string[]).includes(value)
  );
}
