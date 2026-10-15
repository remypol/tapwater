import type { ProductCategory } from "./types";

/**
 * Category pages that compete with a buying guide for the same searches.
 *
 * Part of the October 2026 test on five buying guides (Search Console, 90 days
 * to 13 Oct). For these four categories the /filters page targets the listing
 * ("every X we review, compared") so the guide can own "best X UK", and a clear
 * link to the guide sits right under the heading. Every other category keeps
 * the generic wording: their guides are the control group.
 *
 * Only the boiling tap page hands its canonical to the guide. It shared 92
 * search terms with the guide, earned 0 Google clicks on 2,581 impressions at
 * an average position of 54, and lists a single product the guide also shows.
 * The other three overlap their guide on at most 4 search terms, so they stay
 * indexable listings. (The water softener category is empty and already
 * redirects to its guide.)
 */
export interface CategoryListing {
  title: string;
  h1: string;
  /** One sentence above the link to the buying guide. */
  guideLead: string;
  /** Point rel=canonical at the buying guide and leave the page out of the sitemap. */
  canonicalToGuide?: boolean;
}

export const CATEGORY_LISTING: Partial<Record<ProductCategory, CategoryListing>> = {
  whole_house: {
    title: "All Whole House Filters We Review: Prices, Specs and Removal Data",
    h1: "All Whole House Filters We Review",
    guideLead:
      "Choosing one? Our buying guide compares them on what they remove, what they cost to run and how they are fitted.",
  },
  shower: {
    title: "All Shower Filters We Review: Prices, Specs and Removal Data",
    h1: "All Shower Filters We Review",
    guideLead:
      "Choosing one? Our buying guide explains what a shower filter can and cannot do in hard water, and which type suits your shower.",
  },
  under_sink: {
    title: "All Under-Sink Filters We Review: Prices, Specs and Removal Data",
    h1: "All Under-Sink Filters We Review",
    guideLead:
      "Choosing one? Our buying guide compares them on certifications, what they remove and what a year of cartridges costs.",
  },
  boiling_tap: {
    title: "Boiling Water Taps We List: Prices and Specs",
    h1: "Boiling Water Taps We List",
    guideLead:
      "Looking for the best boiling water tap? Our buying guide compares Quooker, Qettle, Fohen, Franke and Hanstrom, and what hard water does to each.",
    canonicalToGuide: true,
  },
};
