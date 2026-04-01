import type { MetadataRoute } from "next";
import { getAllPostcodeDistricts } from "@/lib/data";
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

export default function sitemap(): MetadataRoute.Sitemap {
  const postcodePaths = getAllPostcodeDistricts().map((district) => ({
    url: `${BASE_URL}/postcode/${district}/`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const supplierPaths = MOCK_SUPPLIERS.map((s) => ({
    url: `${BASE_URL}/supplier/${s.id}/`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const contaminantPaths = CONTAMINANT_SLUGS.map((slug) => ({
    url: `${BASE_URL}/contaminant/${slug}/`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about/methodology`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about/data-sources`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/disclaimer`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/affiliate-disclosure`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/guides`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    ...GUIDE_SLUGS.map((slug) => ({
      url: `${BASE_URL}/guides/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...postcodePaths,
    ...supplierPaths,
    ...contaminantPaths,
  ];
}
