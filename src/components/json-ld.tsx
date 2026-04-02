import type { ContaminantReading } from "@/lib/types";

interface PostcodeDatasetSchemaProps {
  district: string;
  areaName: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  supplier: string;
  score: number;
  lastUpdated: string;
  contaminantsTested: number;
  readings: ContaminantReading[];
}

interface BreadcrumbSchemaProps {
  items: { name: string; url: string }[];
}

export function OrganizationSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TapWater.uk",
    url: "https://tapwater.uk",
    description: "Independent UK water quality research and reporting",
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function WebSiteSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TapWater.uk",
    url: "https://tapwater.uk",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://tapwater.uk/postcode/{search_term_string}/",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function FAQSchema({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function PersonSchema({ name, url, description }: { name: string; url: string; description: string }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url,
    description,
    sameAs: [url],
    knowsAbout: [
      "Water quality",
      "Environmental data analysis",
      "PFAS contamination",
      "UK drinking water regulation",
      "Environment Agency data",
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ArticleSchema({
  headline,
  description,
  url,
  datePublished,
  dateModified,
  authorName,
  authorUrl,
}: {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
  authorUrl: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url,
    datePublished,
    dateModified,
    author: {
      "@type": "Person",
      name: authorName,
      url: authorUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "TapWater.uk",
      url: "https://tapwater.uk",
    },
    mainEntityOfPage: url,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function PostcodeDatasetSchema({
  district,
  areaName,
  city,
  region,
  latitude,
  longitude,
  supplier,
  score,
  lastUpdated,
  contaminantsTested,
  readings,
}: PostcodeDatasetSchemaProps) {
  const hasScore = score >= 0;

  // Build per-contaminant PropertyValues for rich snippets
  const contaminantProperties = readings
    .filter((r) => !r.isPfas)
    .slice(0, 15)
    .map((r) => ({
      "@type": "PropertyValue",
      name: r.name,
      value: String(parseFloat(r.value.toPrecision(6))),
      unitText: r.unit,
      ...(r.ukLimit != null ? { maxValue: String(r.ukLimit) } : {}),
    }));

  const data = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `Water Quality Report for ${district}`,
    description: `Environmental water quality data for ${district} (${areaName}), ${city}, ${region}. Supplied by ${supplier}. ${hasScore ? `Safety score: ${score}/10 based on ${contaminantsTested} tested parameters.` : `${contaminantsTested} parameters tested.`}`,
    url: `https://tapwater.uk/postcode/${district}/`,
    dateModified: lastUpdated,
    creator: { "@type": "Organization", name: "TapWater.uk" },
    license:
      "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    isBasedOn: {
      "@type": "Dataset",
      name: "Environment Agency Water Quality Archive",
      url: "https://environment.data.gov.uk/water-quality",
      creator: { "@type": "GovernmentOrganization", name: "Environment Agency" },
    },
    temporalCoverage: "2020/2026",
    spatialCoverage: {
      "@type": "Place",
      name: `${areaName}, ${region}, United Kingdom`,
      geo: {
        "@type": "GeoCoordinates",
        latitude,
        longitude,
      },
    },
    variableMeasured: [
      ...(hasScore
        ? [
            {
              "@type": "PropertyValue",
              name: "Water Safety Score",
              value: String(score),
              maxValue: "10",
              unitText: "points",
            },
          ]
        : []),
      ...contaminantProperties,
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
