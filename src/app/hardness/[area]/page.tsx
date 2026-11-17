import { HardnessArea, HardnessTownPage } from "@/components/tank/hardness-pages";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getHardnessArea, getHardnessAreaCodes, getHardnessTowns, getPostcodeData } from "@/lib/data";
import { nearbyTowns, type HardnessTown } from "@/lib/hardness-towns";
import { formatPriceRange, installedPriceRange } from "@/lib/softener-prices";
import { formatSampleDate } from "@/lib/tank-plan";
import { isThamesRotationDistrict } from "@/lib/thames-zones";
import { postcodeAreaName } from "@/lib/postcode-areas";
import { FAQSchema, BreadcrumbSchema } from "@/components/json-ld";
import { HARD_WATER_THRESHOLD } from "@/lib/filters";

export const revalidate = 86400;
export const dynamicParams = false;

interface Props {
  params: Promise<{ area: string }>;
}

export async function generateStaticParams() {
  const [codes, towns] = await Promise.all([getHardnessAreaCodes(), getHardnessTowns()]);
  return [...codes.map((area) => ({ area: area.toLowerCase() })), ...towns.map((t) => ({ area: t.slug }))];
}

/**
 * This segment serves two kinds of page: a postcode area ("rg") and a town
 * ("wokingham"). Area codes are one or two letters and town slugs are always
 * longer, so the two can never collide.
 */
async function findTown(slug: string): Promise<{ town: HardnessTown; all: HardnessTown[] } | null> {
  if (slug.length <= 2) return null;
  const all = await getHardnessTowns();
  const town = all.find((t) => t.slug === slug.toLowerCase());
  return town ? { town, all } : null;
}

function townTitle(town: HardnessTown): string {
  const full = `Water Hardness in ${town.name}: ${town.median} mg/L, ${town.median >= 250 ? "Very Hard" : "Hard"}`;
  return full.length > 65 ? `Water Hardness in ${town.town}: ${town.median} mg/L` : full;
}

function townDescription(town: HardnessTown): string {
  const approximate = town.districts.some((d) => d.measured && isThamesRotationDistrict(d.district));
  const range = approximate ? "" : town.measuredCount > 1 ? `, from ${town.min} to ${town.max} mg/L across ${town.measuredCount} measured districts` : ` in ${town.districts.find((d) => d.measured)?.district}`;
  return `${town.town} tap water is ${town.median >= 250 ? "very hard" : "hard"} at ${town.median} mg/L${range}. District table, what it costs you and softener quotes.`;
}

async function TownRoute({ town, all }: { town: HardnessTown; all: HardnessTown[] }) {
  const measured = town.districts.filter((d) => d.measured);
  const [records, area] = await Promise.all([
    Promise.all(measured.slice(0, 6).map((d) => getPostcodeData(d.district))),
    getHardnessArea(town.area),
  ]);
  const approximate = measured.some((d) => isThamesRotationDistrict(d.district));
  // The supplier on record for these districts comes from the same unreliable list.
  const suppliers = approximate ? [] : [...new Set(records.map((r) => r?.supplier).filter((s): s is string => Boolean(s)))];
  const newest = records.map((r) => r?.lastSampleDate).filter((d): d is string => Boolean(d)).sort().pop();
  const softenerPrice = formatPriceRange(installedPriceRange());
  const veryHard = town.median >= 250;
  const hardest = measured[0];

  const faqs = [
    {
      question: `Is ${town.town} a hard water area?`,
      answer: `Yes. ${approximate ? `Water in the supply zones covering ${town.town} is about ${town.median} mg/L calcium carbonate` : town.measuredCount === 1 ? `The reading for ${hardest.district} is ${hardest.value} mg/L calcium carbonate` : `The median across ${town.measuredCount} measured ${town.town} districts is ${town.median} mg/L calcium carbonate`}, which is ${veryHard ? "very hard" : "hard"}. Hard starts at 180 mg/L and very hard at 250.`,
    },
    {
      question: `What is the water hardness in ${town.town} in other units?`,
      answer: `${town.median} mg/L calcium carbonate is about ${(town.median / 14.25).toFixed(1)} degrees Clark, ${(town.median / 17.8).toFixed(1)} German degrees and ${(town.median / 10).toFixed(1)} French degrees. Dishwashers and washing machines usually ask for one of these.`,
    },
    {
      question: `Do I need a water softener in ${town.town}?`,
      answer: `At ${town.median} mg/L a softener pays for itself in most homes, because kettles, boilers and showers scale up quickly. Fitted, one typically costs ${softenerPrice}. Check your own postcode first${town.measuredCount > 1 && !approximate ? `, because ${town.town} districts range from ${town.min} to ${town.max} mg/L` : ""}.`,
    },
    ...(suppliers.length > 0
      ? [{
          question: `Who supplies water in ${town.town}?`,
          answer: `${suppliers.join(" and ")}. The hardness comes from the rock the water is drawn through, so it changes little from year to year.`,
        }]
      : []),
  ];

  const url = `https://www.tapwater.uk/hardness/${town.slug}`;
  return (
    <>
      <FAQSchema faqs={faqs} />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Water hardness", url: "https://www.tapwater.uk/hardness" },
          { name: postcodeAreaName(town.area), url: `https://www.tapwater.uk/hardness/${town.area.toLowerCase()}` },
          { name: town.town, url },
        ]}
      />
      <HardnessTownPage
        town={town}
        nearby={nearbyTowns(town, all)}
        areaMedian={area?.summary.median ?? null}
        suppliers={suppliers}
        sampled={newest ? formatSampleDate(newest) : null}
        softenerPrice={softenerPrice}
        faqs={faqs}
      />
    </>
  );
}



export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area } = await params;
  const found = await findTown(area);
  if (found) {
    const title = townTitle(found.town);
    const description = townDescription(found.town);
    const url = `https://www.tapwater.uk/hardness/${found.town.slug}`;
    return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, type: "article" } };
  }
  const data = await getHardnessArea(area);
  if (!data) return { title: "Not Found" };
  const town = postcodeAreaName(data.area);
  const year = new Date().getFullYear();
  const title = `Water Hardness in ${town} (${data.area} Postcodes): ${data.summary.median} mg/L, ${data.summary.label}`;
  const description = `${town}'s tap water is ${data.summary.label} at a median ${data.summary.median} mg/L, ranging from ${data.summary.min} to ${data.summary.max} across ${data.districts.length} ${data.area} districts. Measured from water company tests. Free ${year} report.`;
  return {
    title: title.length > 65 ? `Water Hardness in ${town} (${data.area}): ${data.summary.label}` : title,
    description: description.length > 155 ? description.slice(0, 152).replace(/[\s,;:]+\S*$/, "") + "…" : description,
    openGraph: { title, description, url: `https://www.tapwater.uk/hardness/${data.area.toLowerCase()}`, type: "article" },
  };
}

export default async function HardnessAreaPage({ params }: Props) {
  const { area } = await params;
  const found = await findTown(area);
  if (found) return <TownRoute town={found.town} all={found.all} />;
  const data = await getHardnessArea(area);
  if (!data) notFound();
  const { summary, districts } = data;
  const town = postcodeAreaName(data.area);
  const hard = summary.median >= HARD_WATER_THRESHOLD;
  const measured = districts.filter((d) => d.measured);
  const hardest = districts[0];
  const softest = districts[districts.length - 1];
  const hardShare = districts.length
    ? Math.round((districts.filter((d) => d.value >= HARD_WATER_THRESHOLD).length / districts.length) * 100)
    : 0;

  const faqs = [
    {
      question: `Is ${town} a hard water area?`,
      answer: `${hard ? "Yes" : "No"}. The median hardness across ${data.area} postcode districts is ${summary.median} mg/L calcium carbonate, which is ${summary.label}. ${hardShare}% of the ${districts.length} districts we hold readings for are hard or very hard (180 mg/L and above).`,
    },
    {
      question: `What is the water hardness in ${town}?`,
      answer: `Between ${summary.min} and ${summary.max} mg/L depending on the district, with a median of ${summary.median}. The hardest measured district is ${hardest.district} at ${hardest.value} mg/L and the softest is ${softest.district} at ${softest.value}. Figures come from water company drinking-water tests${measured.length < districts.length ? ", with postcode-area estimates for districts that have no reading of their own" : ""}.`,
    },
    {
      question: `Do I need a water softener in ${town}?`,
      answer: hard
        ? `In most ${data.area} homes a softener pays for itself: at ${summary.median} mg/L kettles, boilers and showers scale up quickly. Check your own district first, because hardness varies from ${summary.min} to ${summary.max} within the area.`
        : `Usually not. At a median of ${summary.median} mg/L limescale is a minor issue in ${town}. A filter jug or a shower filter covers the everyday effects. Only districts at 180 mg/L or above are worth a softener quote.`,
    },
  ];

  return (
    <>
      <FAQSchema faqs={faqs} />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Water hardness", url: "https://www.tapwater.uk/hardness" },
          { name: town, url: `https://www.tapwater.uk/hardness/${data.area.toLowerCase()}` },
        ]}
      />
      <HardnessArea data={data} faqs={faqs} towns={(await getHardnessTowns()).filter((t) => t.area === data.area)} />
    </>
  );
}
