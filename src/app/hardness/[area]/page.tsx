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
export const dynamicParams = false;

interface Props {
  params: Promise<{ area: string }>;
}

export async function generateStaticParams() {
  const codes = await getHardnessAreaCodes();
  return codes.map((area) => ({ area: area.toLowerCase() }));
}

function bandSentence(median: number): string {
  if (median >= 250) return "very hard, the top band on the scale water companies use";
  if (median >= 180) return "hard, past the point where limescale starts costing money";
  if (median >= 120) return "moderately hard, with some scale over time but rarely enough to need a softener";
  if (median >= 60) return "moderately soft, with little limescale to speak of";
  return "soft, so limescale is not a problem here";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
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
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-14">
      <FAQSchema faqs={faqs} />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Water hardness", url: "https://www.tapwater.uk/hardness" },
          { name: town, url: `https://www.tapwater.uk/hardness/${data.area.toLowerCase()}` },
        ]}
      />
      <div className="max-w-3xl mx-auto">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-faint">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/hardness" className="hover:text-accent transition-colors">Water hardness</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink font-medium">{town}</span>
        </nav>

        <h1 className="font-display text-3xl lg:text-4xl italic text-ink mt-6 mb-4 leading-tight">
          Is {town} a hard water area?
        </h1>

        <p className="text-lg text-body leading-relaxed">
          <strong className="text-ink">{hard ? "Yes." : "No."}</strong> Tap water across the {data.area} postcode area is{" "}
          <strong className="text-ink">{bandSentence(summary.median)}</strong>, with a median of{" "}
          <span className="font-data text-ink">{summary.median} mg/L</span> calcium carbonate. It ranges from{" "}
          {softest.value} mg/L in{" "}
          <Link href={`/postcode/${softest.district}`} className="text-ink underline underline-offset-2 decoration-rule hover:decoration-accent">{softest.district}</Link>{" "}
          to {hardest.value} mg/L in{" "}
          <Link href={`/postcode/${hardest.district}`} className="text-ink underline underline-offset-2 decoration-rule hover:decoration-accent">{hardest.district}</Link>
          , from {measured.length} district{measured.length === 1 ? "" : "s"} with their own water company reading
          {measured.length < districts.length ? ` and ${districts.length - measured.length} estimated from the area` : ""}.
        </p>

        <HardnessBands />

        <h2 id="districts" className="font-display text-xl italic mt-10 mb-3 text-ink">Hardness by {data.area} district</h2>
        <p className="text-sm text-body mb-4 max-w-2xl leading-relaxed">
          Hardest first. Hard starts at 180 mg/L, very hard at 250.
          {measured.length < districts.length && " Districts marked with an asterisk take the area's median rather than a reading of their own."}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-rule-strong">
                <th className="py-2 pr-3 font-medium">District</th>
                <th className="py-2 pr-3 font-medium hidden sm:table-cell">Area</th>
                <th className="py-2 pr-3 font-medium text-right">mg/L</th>
                <th className="py-2 font-medium">Hardness</th>
              </tr>
            </thead>
            <tbody>
              {districts.map((d) => (
                <tr key={d.district} className="border-b border-rule">
                  <td className="py-2 pr-3">
                    <span className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle" style={{ background: hardnessColour(d.value) }} aria-hidden="true" />
                    <Link href={`/postcode/${d.district}`} className="font-medium text-ink hover:text-accent transition-colors">{d.district}</Link>
                    {!d.measured && <span className="text-muted" title="Postcode-area estimate">*</span>}
                  </td>
                  <td className="py-2 pr-3 text-muted hidden sm:table-cell">{d.areaName}</td>
                  <td className="py-2 pr-3 text-right font-data text-ink">{d.value}</td>
                  <td className="py-2 capitalize">{d.value < 60 ? "soft" : d.value < 120 ? "moderately soft" : d.value < 180 ? "moderately hard" : d.value < 250 ? "hard" : "very hard"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hard ? (
          <div className="mt-10">
            <SoftenerLeadForm
              hardnessValue={summary.median}
              hardnessLabel={summary.label}
              source="hardness_area"
              heading={`Softener quotes for ${town}`}
              intro={`At ${summary.median} mg/L most ${data.area} homes get their money back on a softener within a few years. Free quotes from installers covering your postcode, no obligation.`}
            />
            <SoftenerGuidesNav className="mt-8" />
          </div>
        ) : (
          <div className="card p-5 mt-10">
            <p className="font-medium text-ink">You do not need a softener in {town}.</p>
            <p className="text-sm text-body mt-2 leading-relaxed">
              At {summary.median} mg/L the practical effects are minor. If you notice anything, it is usually chlorine rather than hardness:{" "}
              <Link href="/guides/best-shower-filter-uk" className="text-ink underline underline-offset-2 decoration-rule hover:decoration-accent">a shower filter</Link>{" "}
              or{" "}
              <Link href="/guides/best-water-filter-jug-uk" className="text-ink underline underline-offset-2 decoration-rule hover:decoration-accent">a filter jug</Link>{" "}
              deals with that.
            </p>
          </div>
        )}

        <h2 className="font-display text-xl italic mt-10 mb-3 text-ink">Check your exact postcode</h2>
        <p className="text-sm text-body mb-4">The area figure is a median. Your district can sit anywhere between {summary.min} and {summary.max} mg/L.</p>
        <PostcodeSearch size="sm" />

        {nearby.length > 0 && (
          <>
            <h2 className="font-display text-xl italic mt-10 mb-3 text-ink">Nearby areas</h2>
            <ul className="flex flex-wrap gap-2">
              {nearby.map((n) => (
                <li key={n.area}>
                  <Link href={`/hardness/${n.area.toLowerCase()}`} className="pill">
                    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: hardnessColour(n.median) }} aria-hidden="true" />
                    {postcodeAreaName(n.area)} <span className="text-muted ml-1 font-data text-xs">{n.median}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <dl className="mt-10 space-y-5">
          {faqs.map((f) => (
            <div key={f.question}>
              <dt className="font-semibold text-ink">{f.question}</dt>
              <dd className="text-sm text-body leading-relaxed mt-1">{f.answer}</dd>
            </div>
          ))}
        </dl>

        <p className="text-xs text-muted mt-10">
          Hardness as mg/L calcium carbonate from water company drinking-water tests and postcode checkers. See the{" "}
          <Link href="/guides/water-hardness-map" className="underline hover:text-ink">UK hardness map</Link> for every area.
        </p>
      </div>
    </div>
  );
}
