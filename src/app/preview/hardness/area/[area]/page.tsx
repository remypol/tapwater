import { HardnessArea } from "@/components/tank/hardness-pages";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getHardnessArea, getHardnessAreaCodes } from "@/lib/data";
import { postcodeAreaName } from "@/lib/postcode-areas";
import { hardnessColour } from "@/components/hardness-map";
import { HardnessBands } from "@/components/hardness-bands";
import { PostcodeSearch } from "@/components/postcode-search";
import { SoftenerLeadForm } from "@/components/softener-lead-form";
import { SoftenerGuidesNav } from "@/components/softener-guides-nav";
import { FAQSchema, BreadcrumbSchema } from "@/components/json-ld";
import { HARD_WATER_THRESHOLD } from "@/lib/filters";

export const revalidate = 86400;

interface Props {
  params: Promise<{ area: string }>;
}


function bandSentence(median: number): string {
  if (median >= 250) return "very hard, the top band on the scale water companies use";
  if (median >= 180) return "hard, past the point where limescale starts costing money";
  if (median >= 120) return "moderately hard, with some scale over time but rarely enough to need a softener";
  if (median >= 60) return "moderately soft, with little limescale to speak of";
  return "soft, so limescale is not a problem here";
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Hardness area preview", robots: { index: false, follow: false } };
}
async function _unusedMetadata({ params }: Props): Promise<Metadata> {
  const { area } = await params;
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
  const data = await getHardnessArea(area);
  if (!data) notFound();
  const { summary, districts, nearby } = data;
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
      <HardnessArea data={data} faqs={faqs} />
    </>
  );
}
