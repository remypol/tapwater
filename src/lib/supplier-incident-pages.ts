/**
 * Where each water company publishes its own live list of current incidents,
 * outages and works. These are the pages a reader should go to for the
 * supplier's latest word; our article is a snapshot, theirs is live.
 *
 * Every URL here was fetched and returned 200 with an incidents/"in your
 * area" page title on 2026-09-07. Suppliers missing from the list either
 * bot-wall automated checks (Anglian, Southern, Portsmouth) or do not
 * publish a live incident list at a stable URL (Thames Water, Wessex Water),
 * so callers should fall back to the supplier's homepage from the data layer.
 */
export const SUPPLIER_INCIDENT_PAGES: Record<string, string> = {
  "severn-trent": "https://www.stwater.co.uk/in-my-area/incidents/",
  "yorkshire-water": "https://www.yorkshirewater.com/incidents/",
  "united-utilities": "https://www.unitedutilities.com/my-local-area/news-in-your-area/",
  "south-west-water": "https://www.southwestwater.co.uk/in-your-area",
  "welsh-water": "https://www.dwrcymru.com/en/help-advice/in-your-area",
  "northumbrian-water": "https://www.nwl.co.uk/check-your-area/",
  "affinity-water": "https://www.affinitywater.co.uk/in-your-area",
  "south-east-water": "https://www.southeastwater.co.uk/help/works-and-outages/",
  "bristol-water":
    "https://www.bristolwater.co.uk/home/account-and-services/your-water/ongoing-incidents",
  "scottish-water": "https://www.scottishwater.co.uk/in-your-area",
  "ni-water":
    "https://www.niwater.com/whats-happening-in-your-area/current-service-updates",
};

export function getSupplierIncidentPage(supplierId: string | null): string | null {
  if (!supplierId) return null;
  return SUPPLIER_INCIDENT_PAGES[supplierId] ?? null;
}
