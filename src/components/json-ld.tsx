interface PostcodeDatasetSchemaProps {
  district: string;
  areaName: string;
  supplier: string;
  score: number;
  lastUpdated: string;
  contaminantsTested: number;
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

export function PostcodeDatasetSchema({
  district,
  areaName,
  supplier,
  score,
  lastUpdated,
  contaminantsTested,
}: PostcodeDatasetSchemaProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `Water Quality Report for ${district}`,
    description: `Environmental water quality data for ${district} (${areaName}), supplied by ${supplier}. Safety score: ${score}/10 based on ${contaminantsTested} tested parameters.`,
    url: `https://tapwater.uk/postcode/${district}/`,
    dateModified: lastUpdated,
    creator: { "@type": "Organization", name: "TapWater.uk" },
    license:
      "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    temporalCoverage: "2020/2026",
    spatialCoverage: { "@type": "Place", name: `${areaName}, United Kingdom` },
    variableMeasured: [
      {
        "@type": "PropertyValue",
        name: "Water Safety Score",
        value: String(score),
        maxValue: "10",
        unitText: "points",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
