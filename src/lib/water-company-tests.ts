/**
 * What each major UK water company says, on its own website, about testing a
 * customer's tap water. Used by /guides/how-to-test-your-water.
 *
 * Rules for editing this file:
 *  - Every row was read from the company's own page on the `checked` date.
 *    `sourceUrl` is that page.
 *  - `confirmed` is true only when that page states what the company offers.
 *    If it does not, `offer` must be exactly UNCONFIRMED_OFFER. Never infer an
 *    offer from another company, a council page or a news story.
 *  - `free` is true only when the company's own page says the test is free.
 *    A confirmed test with no stated price stays `free: false`.
 */

export const WATER_COMPANY_TESTS_CHECKED = "2026-11-17" as const;

export const UNCONFIRMED_OFFER = "Contact them to ask";

export interface WaterCompanyTest {
  company: string;
  /** What the company's own page says it offers, in plain words. */
  offer: string;
  howToAsk: string;
  /** The company's own page the row was read from. */
  sourceUrl: string;
  /** ISO date the source page was read. */
  checked: typeof WATER_COMPANY_TESTS_CHECKED;
  /** True when the source page itself states the offer. */
  confirmed: boolean;
  /** True only when the source page says the test is free. */
  free: boolean;
}

const checked = WATER_COMPANY_TESTS_CHECKED;

export const WATER_COMPANY_TESTS: WaterCompanyTest[] = [
  {
    company: "Thames Water",
    offer:
      "Will collect samples to check for lead if you are worried and cannot replace a lead pipe. The page does not say whether there is a charge.",
    howToAsk: "Call 0800 316 9800.",
    sourceUrl: "https://www.thameswater.co.uk/help/water-and-waste-help/water-quality/lead",
    checked,
    confirmed: true,
    free: false,
  },
  {
    company: "Severn Trent",
    offer: UNCONFIRMED_OFFER,
    howToAsk:
      "Use the contact options in its water quality guide. The guide says an engineer may visit to take a sample if its team decides one is needed.",
    sourceUrl: "https://www.stwater.co.uk/help-and-contact/customer-information/water-quality-guide/",
    checked,
    confirmed: false,
    free: false,
  },
  {
    company: "United Utilities",
    offer: UNCONFIRMED_OFFER,
    howToAsk:
      "Its lead fact sheet gives 0345 672 3723 for questions about lead pipes and drinking water.",
    sourceUrl: "https://www.unitedutilities.com/help-and-support/your-water-supply/your-pipes/lead-pipes/",
    checked,
    confirmed: false,
    free: false,
  },
  {
    company: "Anglian Water",
    offer:
      "Free lead test. A technician takes three samples from your kitchen tap and one from the boundary box if there is one. Results can take up to 10 working days.",
    howToAsk: "Book with the online form on its page, or call the Lead Advice Line on 0345 070 3445.",
    sourceUrl:
      "https://www.anglianwater.co.uk/help-and-advice/drinking-water-advice/lead/book-a-free-lead-test/",
    checked,
    confirmed: true,
    free: true,
  },
  {
    company: "Yorkshire Water",
    offer: "Free test of a sample of your water if you are worried about lead.",
    howToAsk: "Get in touch through the contact link on its lead page.",
    sourceUrl: "https://www.yorkshirewater.com/your-water/drinking-water-standards/lead-in-yorkshires-water/",
    checked,
    confirmed: true,
    free: true,
  },
  {
    company: "Southern Water",
    offer: UNCONFIRMED_OFFER,
    howToAsk:
      "Use the contact details on its lead page. The page would not load on the day we checked, so no offer is listed.",
    sourceUrl: "https://www.southernwater.co.uk/lead-plumbing",
    checked,
    confirmed: false,
    free: false,
  },
  {
    company: "South West Water",
    offer:
      "Will test your water and tell you if it contains more than the permitted level of lead. The page does not say whether there is a charge.",
    howToAsk: "Call 0344 346 2020.",
    sourceUrl: "https://www.southwestwater.co.uk/lead",
    checked,
    confirmed: true,
    free: false,
  },
  {
    company: "Wessex Water",
    offer: "Free water quality sample from your kitchen tap to test the level of lead, if you think you have lead pipes.",
    howToAsk: "Contact Wessex Water through its lead pipes page.",
    sourceUrl: "https://www.wessexwater.co.uk/your-water/lead-pipes",
    checked,
    confirmed: true,
    free: true,
  },
  {
    company: "Northumbrian Water",
    offer: "Free water test if you are unsure about the amount of lead in your tap water.",
    howToAsk: "Call 0345 717 1100 to book.",
    sourceUrl: "https://www.nwl.co.uk/leadpipes",
    checked,
    confirmed: true,
    free: true,
  },
  {
    company: "Affinity Water",
    offer: UNCONFIRMED_OFFER,
    howToAsk: "Use the contact options on its lead page. The page explains lead pipes but does not describe a test.",
    sourceUrl: "https://www.affinitywater.co.uk/lead",
    checked,
    confirmed: false,
    free: false,
  },
  {
    company: "South East Water",
    offer:
      "Free visit to take a water sample for lead analysis, if you think you have lead plumbing or want your drinking water checked for lead.",
    howToAsk: "Call 0333 000 0002. The offer is in the lead pipes section of its water quality page.",
    sourceUrl: "https://www.southeastwater.co.uk/help/water-supply/water-quality/",
    checked,
    confirmed: true,
    free: true,
  },
  {
    company: "Welsh Water (Dŵr Cymru)",
    offer: "Free water test from the cold kitchen tap to check lead levels, if you think you have lead pipes or solder.",
    howToAsk: "Contact Welsh Water through its water quality in the home page.",
    sourceUrl: "https://www.dwrcymru.com/en/help-advice/drinking-water-quality/water-quality-in-the-home",
    checked,
    confirmed: true,
    free: true,
  },
  {
    company: "Scottish Water",
    offer: UNCONFIRMED_OFFER,
    howToAsk: "If you are concerned about lead, call the customer helpline on 0800 0778 778 or report it online.",
    sourceUrl: "https://www.scottishwater.co.uk/your-home/your-water/lead-and-your-water/what-you-can-do",
    checked,
    confirmed: false,
    free: false,
  },
  {
    company: "Northern Ireland Water",
    offer: "Free of charge: a sampler visits to take a drinking water sample for lead analysis.",
    howToAsk: "Call Waterline on 03457 440088 to request a lead sample.",
    sourceUrl: "https://www.niwater.com/about-your-water/lead-pipes",
    checked,
    confirmed: true,
    free: true,
  },
];

/** Rows where the company's own page states what it offers. */
export function confirmedTestOffers(
  rows: readonly WaterCompanyTest[] = WATER_COMPANY_TESTS,
): WaterCompanyTest[] {
  return rows.filter((row) => row.confirmed);
}
