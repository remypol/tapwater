import type { MetadataRoute } from "next";
import { getAllPostcodeDistricts, getPostcodeData } from "@/lib/data";
import { MOCK_SUPPLIERS } from "@/lib/mock-data";

const BASE_URL = "https://tapwater.uk";

const CONTAMINANT_SLUGS = ["pfas", "lead", "nitrate"];

const GUIDE_SLUGS = [
  "pfas-uk-explained",
  "lead-pipes-uk",
  "water-hardness-map",
  "understanding-your-water-supplier",
  "how-to-test-your-water",
];

/**
 * Get the most recent data date across all postcodes for static pages.
 * Falls back to a fixed date rather than `new Date()` to avoid misleading freshness.
 */
function getLatestDataDate(): Date {
  let latest = "2024-01-01";
  for (const district of getAllPostcodeDistricts()) {
    const data = getPostcodeData(district);
    if (data && data.lastUpdated > latest) {
      latest = data.lastUpdated;
    }
  }
  return new Date(latest);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const latestDataDate = getLatestDataDate();

  const postcodePaths = getAllPostcodeDistricts().map((district) => {
    const data = getPostcodeData(district);
    const lastMod = data?.lastUpdated ? new Date(data.lastUpdated) : latestDataDate;
    return {
      url: `${BASE_URL}/postcode/${district}/`,
      lastModified: lastMod,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    };
  });

  const supplierPaths = MOCK_SUPPLIERS.map((s) => ({
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

  return [
    {
      url: `${BASE_URL}/`,
      lastModified: latestDataDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: latestDataDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about/methodology`,
      lastModified: latestDataDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about/data-sources`,
      lastModified: latestDataDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/disclaimer`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/affiliate-disclosure`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/guides`,
      lastModified: latestDataDate,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    ...GUIDE_SLUGS.map((slug) => ({
      url: `${BASE_URL}/guides/${slug}`,
      lastModified: latestDataDate,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...postcodePaths,
    ...supplierPaths,
    ...contaminantPaths,
  ];
}
