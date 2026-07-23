/**
 * City-vs-city comparison pairs.
 *
 * Previously this list lived only in sitemap.ts, so the pages were submitted to
 * search engines but linked from nowhere on the site — a crawl found 42 of them
 * orphaned. Keeping the list here lets the sitemap and the /compare index share one
 * source, so a pair can never again exist in one and not the other.
 *
 * Pages are generated in both directions (a-vs-b and b-vs-a).
 */
export const CITY_COMPARISON_PAIRS: [string, string][] = [
  ["london", "manchester"], ["london", "birmingham"], ["london", "leeds"],
  ["london", "glasgow"], ["london", "edinburgh"], ["london", "bristol"],
  ["london", "liverpool"], ["london", "sheffield"], ["london", "nottingham"],
  ["london", "cardiff"],
  ["manchester", "birmingham"], ["manchester", "leeds"], ["manchester", "liverpool"],
  ["manchester", "sheffield"], ["manchester", "glasgow"],
  ["birmingham", "leeds"], ["birmingham", "bristol"], ["birmingham", "nottingham"],
  ["edinburgh", "glasgow"], ["leeds", "sheffield"],
  ["bristol", "cardiff"], ["liverpool", "leeds"],
  ["newcastle", "sunderland"], ["nottingham", "leicester"],
];

/**
 * The canonical direction for a pair.
 *
 * Both directions are generated (leeds-vs-liverpool and liverpool-vs-leeds), and they
 * show the same comparison, so without a canonical they compete as duplicates and
 * split their link equity. This returns the direction listed above, which the page
 * uses as its canonical URL and which the sitemap and /compare index link to.
 * Returns null for a pair we do not list at all.
 */
export function canonicalCityPair(
  a: string,
  b: string,
): [string, string] | null {
  const match = CITY_COMPARISON_PAIRS.find(
    ([x, y]) => (x === a && y === b) || (x === b && y === a),
  );
  return match ?? null;
}

/** Title-cases a city slug for display: "newcastle" -> "Newcastle". */
export function cityLabel(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
