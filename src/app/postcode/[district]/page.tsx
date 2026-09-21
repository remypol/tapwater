import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPostcodeDistricts } from "@/lib/data";
import { highlightDescription } from "@/lib/district-highlights";
import { loadPostcodePage } from "@/lib/postcode-page-load";
import { PostcodeTank, PostcodeTankEmpty } from "@/components/tank/postcode-tank";
import { tankFonts } from "@/components/tank/fonts";
import { PostcodeDatasetSchema, BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { WaterReportTracker } from "@/components/conversion-tracker";

export const revalidate = 86400; // Revalidate daily (matches pipeline cron)

/**
 * Only the districts we actually hold exist at this route.
 *
 * With on-demand params, an unknown district rendered, hit notFound(), and Next
 * cached that result as a prerender — which Vercel then served with HTTP 200
 * (`x-nextjs-prerender: 1`, `x-vercel-cache: HIT`). So /postcode/ZZ99 and every
 * typo answered "200 OK" with a page titled "Not Found". Google is free to index those.
 *
 * generateStaticParams already enumerates every district we know about, so
 * anything outside that list genuinely does not exist and should say so.
 *
 * Trade-off: a district added to the database after the last build 404s until the
 * next one. The refresh cron fires a deploy hook, so that window is short, and a
 * brief honest 404 beats a permanent indexable non-page.
 */
export const dynamicParams = false;

interface Props {
  params: Promise<{ district: string }>;
}

export async function generateStaticParams() {
  // Build pages for ALL postcodes with data so every linked page exists
  const districts = await getAllPostcodeDistricts();
  return districts.map((district) => ({ district }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district } = await params;
  const page = await loadPostcodePage(district);
  if (!page) return { title: "Not Found" };
  const { data } = page;

  const hasData = data.safetyScore >= 0;
  const year = new Date().getFullYear();

  // Keep title under 60 chars (template adds " | TapWater.uk" = 15 chars)
  const maxTitleLen = 44; // 60 - 16 for " | TapWater.uk"
  const baseTitle = `${data.district} Water Quality`;
  const remainingLen = maxTitleLen - baseTitle.length - 3; // 3 for " | "
  const shortArea = remainingLen >= 8
    ? (data.areaName.length > remainingLen
      ? data.areaName.substring(0, remainingLen).replace(/,?\s*$/, '')
      : data.areaName)
    : null;
  const pageTitle = shortArea ? `${baseTitle} | ${shortArea}` : baseTitle;

  // The description leads with this district's most notable fact, so no two
  // districts share one. Thin pages keep the honest "not yet available" line.
  const description = hasData
    ? highlightDescription(data, page.highlights, year)
    : `Water quality data for ${data.district} (${data.areaName}) is not yet available. Check back soon for test results.`;

  return {
    title: pageTitle,
    description,
    // Prevent thin pages from polluting the index — keep follow for link equity.
    // ea-only districts rest on river/groundwater samples, not tap tests: they
    // stay live for visitors but are not a page we want Google to judge us on.
    ...(hasData && data.dataSource !== "ea-only" ? {} : { robots: "noindex, follow" }),
    openGraph: {
      title: `${data.district} Water Quality: Is It Safe?`,
      description,
      url: `https://www.tapwater.uk/postcode/${data.district}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${data.district} Water Quality: Is It Safe?`,
      description,
    },
    other: {
      "geo.position": `${data.latitude};${data.longitude}`,
      "geo.placename": `${data.areaName}, ${data.region}`,
      "geo.region": "GB",
      "ICBM": `${data.latitude}, ${data.longitude}`,
    },
  };
}

/**
 * The page itself is `PostcodeTank`; this file owns what search engines and analytics
 * need around it: the title and description above, the three schema blocks, and the
 * report-view event. All data comes from one loader shared with generateMetadata, so
 * the description and the page always lead with the same fact.
 */
export default async function PostcodePage({ params }: Props) {
  const { district } = await params;
  const page = await loadPostcodePage(district);
  if (!page) notFound();
  const { data, city, faqs, pfasNearby, hasData } = page;

  return (
    <div className={tankFonts}>
      <PostcodeDatasetSchema
        district={data.district}
        areaName={data.areaName}
        city={data.city}
        region={data.region}
        latitude={data.latitude}
        longitude={data.longitude}
        supplier={data.supplier}
        score={data.safetyScore}
        lastUpdated={data.lastUpdated}
        contaminantsTested={data.contaminantsTested}
        readings={data.readings}
        pfasNearby={pfasNearby}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          city.hasPage
            ? { name: data.city, url: `https://www.tapwater.uk/city/${city.slug}` }
            : { name: data.city, url: "https://www.tapwater.uk" },
          { name: data.district, url: `https://www.tapwater.uk/postcode/${data.district}` },
        ]}
      />
      {faqs.length > 0 ? <FAQSchema faqs={faqs} /> : null}
      {hasData ? (
        <>
          <WaterReportTracker
            postcodeArea={data.district}
            waterScoreBand={data.safetyScore >= 7 ? "good" : data.safetyScore >= 4 ? "attention" : "poor"}
          />
          <PostcodeTank page={page} />
        </>
      ) : (
        <PostcodeTankEmpty page={page} />
      )}
    </div>
  );
}
