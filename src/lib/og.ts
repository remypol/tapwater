import type { Metadata } from "next";

/**
 * Default social share image.
 *
 * The root layout sets openGraph.images, but Next.js replaces nested metadata objects
 * rather than merging them: any page exporting its own `openGraph` drops the layout's
 * images entirely. A crawl found 383 pages with og:title, og:description, og:type and
 * og:url but no og:image for exactly that reason, and their twitter cards declared
 * summary_large_image with no image to show.
 *
 * Segments with their own opengraph-image file (the home page, /pfas, /postcode/[district],
 * /city/[slug], /pfas/[city]) keep those — a route-level image beats this generic one.
 * Everywhere else, spread this into the openGraph and twitter blocks.
 */
export const OG_IMAGE: NonNullable<
  NonNullable<Metadata["openGraph"]>["images"]
> = [
  {
    url: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: "TapWater.uk — UK Water Quality Data",
  },
];
