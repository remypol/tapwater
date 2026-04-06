import type { MetadataRoute } from "next";
import { getScoredPostcodeDistricts, getPostcodeData, getSuppliersList } from "@/lib/data";
import { CITIES } from "@/lib/cities";
import { REGIONS } from "@/lib/regions";
import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/products";

const BASE_URL = "https://www.tapwater.uk";

const CONTAMINANT_SLUGS = ["pfas", "lead", "nitrate", "copper", "chlorine", "fluoride", "trihalomethanes", "ecoli"];

const GUIDE_SLUGS = [
  "best-water-filters-uk",
  "pfas-uk-explained",
  "lead-pipes-uk",
  "water-hardness-map",
  "understanding-your-water-supplier",
  "how-to-test-your-water",
  "microplastics-uk-water",
  "tap-water-vs-bottled-water",
  "best-reverse-osmosis-system-uk",
  "best-shower-filter-uk",
  "best-whole-house-water-filter-uk",
  "best-water-testing-kit-uk",
  "best-water-filter-pfas",
  "best-water-filter-jug-uk",
];

/**
 * Get the most recent data date across all postcodes for static pages.
 * Falls back to a fixed date rather than `new Date()` to avoid misleading freshness.
 */
async function getLatestDataDate(): Promise<Date> {
  let latest = "2024-01-01";
  for (const district of await getScoredPostcodeDistricts()) {
    const data = await getPostcodeData(district);
    if (data && data.lastUpdated > latest) {
      latest = data.lastUpdated;
    }
  }
  return new Date(latest);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const latestDataDate = await getLatestDataDate();
  const districts = await getScoredPostcodeDistricts();

  const postcodePaths = await Promise.all(
    districts.map(async (district) => {
      const data = await getPostcodeData(district);
      const lastMod = data?.lastUpdated ? new Date(data.lastUpdated) : latestDataDate;
      return {
        url: `${BASE_URL}/postcode/${district}/`,
        lastModified: lastMod,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    }),
  );

  const suppliers = await getSuppliersList();
  const supplierPaths = suppliers.map((s) => ({
    url: `${BASE_URL}/supplier/${s.id}/`,
    lastModified: latestDataDate,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const contaminantPaths = CONTAMINANT_SLUGS.map((slug) => ({
    url: `${BASE_URL}/contaminant/${slug}/`,
    lastModified: latestDataDate,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const cityPaths = CITIES.map((city) => ({
    url: `${BASE_URL}/city/${city.slug}/`,
    lastModified: latestDataDate,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const regionPaths = REGIONS.map((r) => ({
    url: `${BASE_URL}/region/${r.slug}`,
    lastModified: latestDataDate,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  return [
    {
      url: `${BASE_URL}/`,
      lastModified: latestDataDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/compare/`,
      lastModified: latestDataDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/supplier/`,
      lastModified: latestDataDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contaminant/`,
      lastModified: latestDataDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about/`,
      lastModified: latestDataDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about/methodology/`,
      lastModified: latestDataDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about/data-sources/`,
      lastModified: latestDataDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact/`,
      lastModified: latestDataDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy/`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/disclaimer/`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/affiliate-disclosure/`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/guides/`,
      lastModified: latestDataDate,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    ...GUIDE_SLUGS.map((slug) => ({
      url: `${BASE_URL}/guides/${slug}/`,
      lastModified: latestDataDate,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    // Filter pages
    {
      url: `${BASE_URL}/filters/`,
      lastModified: latestDataDate,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    ...CATEGORY_ORDER.map((cat) => ({
      url: `${BASE_URL}/filters/${CATEGORY_META[cat].slug}/`,
      lastModified: latestDataDate,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...regionPaths,
    ...cityPaths,
    ...postcodePaths,
    ...supplierPaths,
    ...contaminantPaths,
  ];
}
