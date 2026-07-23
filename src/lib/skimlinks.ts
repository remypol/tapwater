/**
 * Skimlinks monetises outbound links to shops we have no affiliate deal with —
 * BRITA, PUR, Aqua Optima and the long tail we mention in passing. Those links
 * currently earn nothing.
 *
 * The catch is that it must never touch a link we already earn on. Skimlinks
 * normally recognises affiliate-network links and leaves them alone, but it
 * explicitly does not do that for direct merchant programmes whose tracking sits
 * on the merchant's own domain:
 *
 *   "if you are part of a direct merchant program where the affiliate link uses
 *    the normal merchant domain [...] then Skimlinks will overwrite these links"
 *   — https://support.skimlinks.com/hc/en-us/articles/223835948
 *
 * That is exactly our Osmio setup (osmiowater.co.uk/…?aw_affiliate=…), where a
 * sale is worth a £50-75 fixed bounty. Left unexcluded, Skimlinks would rewrite
 * those links and we would trade that bounty for a few percent — silently, with
 * nothing in the UI to show for it.
 *
 * So every domain we already earn on is listed here. Domains we do NOT earn on
 * are deliberately absent: those are the ones Skimlinks is installed for.
 */

/**
 * Domains carrying our own affiliate tracking. Skimlinks leaves these alone.
 *
 * Matched by the Skimlinks script against the link's host, so a bare domain also
 * covers its subdomains (www.osmiowater.co.uk, etc.).
 */
export const OUR_OWN_PARTNER_DOMAINS = [
  // Direct programme, fixed bounty, tracking on their own domain — the one case
  // Skimlinks documents as "we will overwrite this". Most valuable link we have.
  "osmiowater.co.uk",

  // Amazon Associates tag (?tag=…). Only ~3%, but it is ours.
  "amazon.co.uk",

  // Awin deeplinks (Waterdrop 7%, Bark once approved).
  "awin1.com",

  // Impact deeplinks, plus the destination they land on.
  "pxf.io",
  "sjv.io",
  "waterdropfilter.eu",
] as const;

/**
 * The Skimlinks publisher id, e.g. "306687X1234567".
 *
 * Deliberately read from the environment rather than hardcoded: until it is set,
 * nothing is injected and the site behaves exactly as it did before. That also
 * means a wrong id can be corrected without a code change.
 */
export function skimlinksPublisherId(): string | null {
  const id = process.env.NEXT_PUBLIC_SKIMLINKS_ID?.trim();
  return id ? id : null;
}
