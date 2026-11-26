import type { Metadata } from "next";
import Link from "next/link";
import { SoftenerLeadForm } from "@/components/softener-lead-form";
import { SoftenerGuidesNav } from "@/components/softener-guides-nav";
import { PartLChecker } from "@/components/part-l-checker";
import { ArticleSchema, BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { GeoCitation } from "@/components/geo-citation";
import { GuideBreadcrumb, GuideByline, GuideFaq, GuideFooter } from "@/components/guide-chrome";
import { getHardnessMap } from "@/lib/data";
import { postcodeAreaName } from "@/lib/postcode-areas";
import { isThamesApproximateDistrict } from "@/lib/thames-zones";
import { formatPriceRange, installedPriceRange } from "@/lib/softener-prices";
import {
  PART_L_DEFINITION,
  PART_L_HARD_WATER_PPM,
  PART_L_PARAGRAPH,
  PART_L_SOURCE_URL,
  packDistricts,
  summarisePartL,
  type PartLDistrict,
} from "@/lib/part-l";
import { OG_IMAGE } from "@/lib/og";

export const revalidate = 86400;

const year = new Date().getFullYear();
const SLUG = "hard-water-boiler-regulations";
const URL = `https://www.tapwater.uk/guides/${SLUG}`;
const TITLE = "New Boiler in a Hard Water Area: the 200 ppm Rule, by Postcode";
const DESCRIPTION =
  "Building regulations guidance for England asks for limescale protection on new combi boilers and water heaters where hardness is over 200 ppm. Check any postcode against the line.";

export function generateMetadata(): Metadata {
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: URL },
    openGraph: { images: OG_IMAGE, title: TITLE, description: DESCRIPTION, url: URL, type: "article" },
    twitter: { images: OG_IMAGE, card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  };
}

const FAQ_DATA = [
  {
    question: "Is a scale reducer a legal requirement on a new boiler?",
    answer:
      "Not by name. Approved Document L, the guidance on meeting the energy part of the Building Regulations in England, says that in hard water areas suitable measures should be taken to treat the feed water to water heaters and the hot water circuit of combination boilers. It defines a hard water area as over 200 ppm. Following the approved document is the usual way to show the work complies, and a scale reducer on the cold feed is the measure most installers use.",
  },
  {
    question: "What counts as a hard water area in the building regulations?",
    answer:
      "Water with a total hardness greater than 200 ppm of calcium carbonate. That is the definition in the key terms of Approved Document L, Volume 1: Dwellings. 200 ppm is the same as 200 mg/L, the unit water companies publish.",
  },
  {
    question: "Does a water softener count as a suitable measure?",
    answer:
      "The document does not list products. A softener takes the hardness out of all the water entering the house, including the feed to the boiler, which is what the paragraph asks for. Check the boiler maker's installation instructions as well, because some set their own conditions on softened water in the heating circuit.",
  },
  {
    question: "How do I find the water hardness for a property in ppm?",
    answer:
      "Enter the postcode in the check on this page. The figure is the water company's own reading in mg/L of calcium carbonate, which is the same number as ppm. Where a district has no reading of its own we say so and give the median for its postcode area.",
  },
  {
    question: "Does the 200 ppm rule apply in Wales, Scotland and Northern Ireland?",
    answer:
      "This page covers Approved Document L for England. Wales, Scotland and Northern Ireland publish their own building regulations guidance, so check with building control there. The hardness figures on this page cover the whole UK.",
  },
  {
    question: "My water is under 200 ppm. Do I still need scale protection?",
    answer:
      "The approved document does not ask for it. Hardness still varies from one supply zone to the next and through the year, so if the figure is close to the line, or the boiler maker's instructions set a lower limit, a scale reducer is a small cost against a scaled-up heat exchanger.",
  },
];

export default async function HardWaterBoilerRegulationsGuide() {
  const { districts } = await getHardnessMap();
  const rows: PartLDistrict[] = districts.map((d) => ({
    district: d.district,
    value: d.value,
    basis: !d.measured ? "e" : isThamesApproximateDistrict(d.district) ? "a" : "m",
  }));
  const summary = summarisePartL(rows);
  const share = summary.measured > 0 ? Math.round((summary.over / summary.measured) * 100) : 0;
  const topAreas = summary.areas.slice(0, 15);
  const softenerPrice = formatPriceRange(installedPriceRange());

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          { name: "Hard water and new boilers", url: URL },
        ]}
      />
      <ArticleSchema
        headline={TITLE}
        description={DESCRIPTION}
        url={URL}
        datePublished="2026-11-17"
        dateModified={new Date().toISOString().split("T")[0]}
        authorName="TapWater.uk Research"
        authorUrl="https://www.tapwater.uk/about"
      />
      <FAQSchema faqs={FAQ_DATA} />

      <div className="max-w-3xl mx-auto">
        <GuideBreadcrumb title="Hard water and new boilers" />
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          New boiler in a hard water area: the {PART_L_HARD_WATER_PPM} ppm rule
        </h1>
        <GuideByline updated={`November ${year}`} />

        <p className="text-lg text-body leading-relaxed">
          If a combination boiler or water heater is being fitted in England and the water is harder than {PART_L_HARD_WATER_PPM} ppm, the
          building regulations guidance expects limescale protection on it. Below is the wording, a check for any postcode, and what counts as
          protection.
        </p>

        <div className="card p-5 sm:p-6 mt-8">
          <h2 className="font-display text-xl italic text-ink" style={{ marginTop: 0 }}>Is this postcode over {PART_L_HARD_WATER_PPM} ppm?</h2>
          <p className="text-sm text-muted mt-1 mb-5">Water company hardness readings for {rows.length.toLocaleString("en-GB")} UK postcode districts.</p>
          <PartLChecker packed={packDistricts(rows)} />
        </div>

        <GeoCitation
          headline={`According to TapWater.uk, ${summary.over.toLocaleString("en-GB")} of ${summary.measured.toLocaleString("en-GB")} UK postcode districts with a hardness reading (${share}%) are over the ${PART_L_HARD_WATER_PPM} ppm line that Approved Document L uses to define a hard water area.`}
          detail="In those districts the guidance for England asks for limescale protection on new combination boilers and water heaters."
        />

        {/* ── The wording ─────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">What the document says</h2>
        <p className="text-base text-body leading-relaxed">
          The rule sits in Approved Document L, Volume 1: Dwellings (2021 edition incorporating 2023 amendments), in the section on commissioning
          hot water systems. Paragraph 8.8 reads:
        </p>
        <blockquote className="border-l-2 border-rule pl-5 my-5 text-base text-ink leading-relaxed">&ldquo;{PART_L_PARAGRAPH}&rdquo;</blockquote>
        <p className="text-base text-body leading-relaxed">And the key terms at the back say what a hard water area is:</p>
        <blockquote className="border-l-2 border-rule pl-5 my-5 text-base text-ink leading-relaxed">&ldquo;{PART_L_DEFINITION}&rdquo;</blockquote>
        <p className="text-base text-body leading-relaxed">
          Two things follow. The line is <strong className="text-ink">over</strong> {PART_L_HARD_WATER_PPM}, so a reading of exactly{" "}
          {PART_L_HARD_WATER_PPM} is not caught. And an approved document is guidance, not the law itself: following it is the usual way to show
          building control that the work meets the Building Regulations. It applies in England.{" "}
          <a href={PART_L_SOURCE_URL} className="text-accent hover:underline" rel="noopener noreferrer" target="_blank">
            Approved Document L on gov.uk
          </a>
        </p>

        {/* ── ppm ─────────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">What {PART_L_HARD_WATER_PPM} ppm means</h2>
        <p className="text-base text-body leading-relaxed">
          Parts per million of calcium carbonate is the same number as milligrams per litre, which is how water companies publish hardness. On
          the scale most of them use, water is hard from 180 mg/L and very hard from 250, so the building regulations line falls inside the hard
          band. A district at 190 is hard by the water company&rsquo;s description and still under the line.
        </p>

        {/* ── How much of the country ─────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">How much of the country is over the line</h2>
        <p className="text-base text-body leading-relaxed">
          Of the {summary.measured.toLocaleString("en-GB")} postcode districts where we hold a water company reading,{" "}
          <strong className="text-ink">{summary.over.toLocaleString("en-GB")} are over {PART_L_HARD_WATER_PPM} ppm</strong>, about {share} in
          every 100. These are the postcode areas with the most districts over the line.
        </p>
        <div className="overflow-x-auto -mx-4 px-4 mt-5">
          <table className="w-full text-sm border-collapse">
            <caption className="sr-only">Postcode areas with the most districts over {PART_L_HARD_WATER_PPM} ppm</caption>
            <thead>
              <tr className="border-b border-rule text-left">
                <th scope="col" className="py-2.5 pr-3 text-xs font-medium text-muted">Postcode area</th>
                <th scope="col" className="py-2.5 px-3 text-xs font-medium text-muted text-right">Districts over the line</th>
                <th scope="col" className="py-2.5 pl-3 text-xs font-medium text-muted text-right">Median, ppm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {topAreas.map((a) => (
                <tr key={a.area}>
                  <td className="py-3 pr-3 font-medium text-ink">
                    <Link href={`/hardness/${a.area.toLowerCase()}`} className="hover:text-accent">
                      {postcodeAreaName(a.area)} ({a.area})
                    </Link>
                  </td>
                  <td className="py-3 px-3 text-right font-data text-ink">
                    {a.over} of {a.measured}
                  </td>
                  <td className="py-3 pl-3 text-right font-data text-ink">{a.median}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted leading-relaxed mt-3">
          Counted from readings only; districts where we hold just a postcode-area estimate are left out. Thames Water reports by supply
          zone, so its districts take the average of the zones they fall in. In inner London (E1 to E9, N1 to N9, W2 to W9) Thames&apos;s
          checker cannot name the zone, and we use the zones of the districts around them.{" "}
          <Link href="/guides/water-hardness-map" className="text-accent hover:underline">
            See the whole country on the hardness map
          </Link>
        </p>

        {/* ── Suitable measures ───────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">What counts as a suitable measure</h2>
        <p className="text-base text-body leading-relaxed">
          The document names no product. In practice there are two routes, and they do different jobs.
        </p>
        <div className="space-y-6 mt-5">
          <div className="border-l-2 border-rule pl-5">
            <h3 className="font-semibold text-ink text-lg">A scale reducer on the cold feed to the boiler</h3>
            <p className="text-base text-body leading-relaxed mt-1">
              A small inline unit fitted on the pipe that feeds the boiler&rsquo;s hot water side. Some dose a trace of polyphosphate to hold the
              minerals in the water; others are electrolytic or magnetic. It protects the boiler and nothing else: the water stays as hard as it
              was, so kettles, taps and shower screens scale up as before. What the evidence says about each kind is in our{" "}
              <Link href="/guides/salt-free-water-softener-uk" className="text-accent hover:underline">
                guide to salt-free devices
              </Link>
              .
            </p>
          </div>
          <div className="border-l-2 border-rule pl-5">
            <h3 className="font-semibold text-ink text-lg">A water softener on the rising main</h3>
            <p className="text-base text-body leading-relaxed mt-1">
              Takes the hardness out of all the water entering the house, so the boiler, the cylinder and every tap are covered at once, and the
              reading in ppm falls. Supplied and fitted, one typically costs {softenerPrice}. It is the only one of the two that removes
              limescale from the rest of the home. Check the boiler maker&rsquo;s instructions too, because some set conditions on softened
              water in the heating circuit.
            </p>
          </div>
        </div>

        {/* ── Who is reading ──────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">If you are having a boiler fitted</h2>
        <p className="text-base text-body leading-relaxed">
          Check the postcode above. If it is over the line, ask the installer what they are fitting for scale and where, and ask for it to be
          written on the commissioning record. The approved document notes that the Benchmark Commissioning Checklist can be used to show the
          system was commissioned properly, so that is the natural place for it.
        </p>

        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">If you fit boilers</h2>
        <p className="text-base text-body leading-relaxed">
          The check above works on a phone and takes the first half of the postcode. The figures are the water companies&rsquo; own, with a note
          wherever a district has no reading of its own. If you want the hardness for every job in your own quoting or survey software, it is
          available for every district as a file or over an API.{" "}
          <Link href="/for-business" className="text-accent hover:underline">
            Water data for business
          </Link>
        </p>

        <div className="mt-10">
          <SoftenerLeadForm
            hardnessValue={220}
            hardnessLabel="hard"
            source="softener_guide"
          />
        </div>

        <GuideFaq faqs={FAQ_DATA} />

        <SoftenerGuidesNav current={SLUG} className="mt-14" />

        <GuideFooter reviewed={`November ${year}`}>
          The quoted wording was read from the gov.uk copy of Approved Document L, Volume 1: Dwellings, on 17 November 2026.{" "}
        </GuideFooter>
      </div>
    </div>
  );
}
