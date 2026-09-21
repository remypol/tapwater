import type { Metadata } from "next";
import Link from "next/link";
import { PostcodeSearch } from "@/components/postcode-search";
import { FAQSchema, BreadcrumbSchema, ArticleSchema } from "@/components/json-ld";
import { CLASS_COLOUR } from "@/components/river-status";
import { getNationalRivers } from "@/lib/river-status-data";
import { ECOLOGICAL_CLASSES, ecologicalMeaning, type EcologicalClass, type RiverStatus } from "@/lib/river-status";
import { OG_IMAGE } from "@/lib/og";

// Rebuilt daily; the data behind it is refreshed monthly by /api/cron/river-status.
export const revalidate = 86400;

const URL = "https://www.tapwater.uk/rivers";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getNationalRivers();
  const year = data?.all.classificationYear || 2025;
  const pct = data?.all.goodOrBetterPct;
  const title = `River Health in England by Postcode (${year} Ratings)`;
  const description = pct
    ? `Only ${pct}% of England's rivers, estuaries and coastal waters rate good, and every one fails the chemical test. Look up the Environment Agency's rating for your local river.`
    : "Look up the Environment Agency's health rating for your local river by postcode.";
  return {
    title,
    description,
    alternates: { canonical: URL },
    openGraph: { images: OG_IMAGE, title, description, url: URL, type: "website" },
    twitter: { images: OG_IMAGE, card: "summary_large_image", title, description },
  };
}

const WORST_FIRST: EcologicalClass[] = [...ECOLOGICAL_CLASSES].reverse();

function DistrictLinks({ districts }: { districts: string[] }) {
  return (
    <>
      {districts.slice(0, 6).map((d, i) => (
        <span key={d}>
          {i > 0 && ", "}
          <Link href={`/postcode/${d}#river-health`} className="hover:text-accent hover:underline underline-offset-2">
            {d}
          </Link>
        </span>
      ))}
      {districts.length > 6 && ` and ${districts.length - 6} more`}
    </>
  );
}

function RiverTable({ rows }: { rows: { river: RiverStatus; districts: string[] }[] }) {
  return (
    <div className="overflow-x-auto border-t border-rule-strong">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th scope="col" className="py-2 pr-4 font-medium">River or water</th>
            <th scope="col" className="py-2 pr-4 font-medium">Area</th>
            <th scope="col" className="py-2 pr-4 font-medium">Rating</th>
            <th scope="col" className="py-2 font-medium">Postcode districts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule border-y border-rule">
          {rows.map(({ river, districts }) => (
            <tr key={river.waterBodyId}>
              <td className="py-2.5 pr-4 text-ink">{river.name}</td>
              <td className="py-2.5 pr-4 text-body">{river.managementCatchment || river.riverBasinDistrict}</td>
              <td className="py-2.5 pr-4">
                <span className="flex items-center gap-2 text-ink font-medium whitespace-nowrap">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ background: river.ecologicalClass ? CLASS_COLOUR[river.ecologicalClass] : "var(--color-faint)" }}
                    aria-hidden="true"
                  />
                  {river.ecologicalClass ?? "Not rated"}
                </span>
              </td>
              <td className="py-2.5 text-body"><DistrictLinks districts={districts} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function RiversPage() {
  const data = await getNationalRivers();

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h1 className="font-display text-3xl italic text-ink">River health in England</h1>
        <p className="mt-4 text-body">
          The Environment Agency&apos;s river ratings could not be loaded just now. Try again in a few minutes.
        </p>
      </div>
    );
  }

  const { all, riversOnly, withDistricts } = data;
  // The day the ratings last changed, not the day this page was rendered.
  const dateModified = data.lastChanged ?? "2026-09-21";
  const year = all.classificationYear;
  const worst = withDistricts.filter((r) => r.river.ecologicalClass === "Bad").slice(0, 40);
  const best = withDistricts
    .filter((r) => r.river.ecologicalClass === "High" || r.river.ecologicalClass === "Good")
    .sort((a, b) => b.districts.length - a.districts.length)
    .slice(0, 25);

  const faqs = [
    {
      question: "Are England's rivers clean?",
      answer: `Mostly not. In the Environment Agency's ${year} assessment, ${all.goodOrBetterPct}% of England's ${all.total.toLocaleString("en-GB")} rivers, estuaries and coastal waters were rated good or high for ecological health. ${all.chemicalFail === all.chemicalAssessed ? "Every single one failed the chemical test." : `${all.chemicalFail.toLocaleString("en-GB")} of ${all.chemicalAssessed.toLocaleString("en-GB")} failed the chemical test.`}`,
    },
    {
      question: "Why does every river in England fail the chemical test?",
      answer:
        "Because of a small group of pollutants that last for decades and are now found everywhere: mercury, PFOS (a forever chemical once used in firefighting foam and stain-proofing) and PBDEs (flame retardants banned years ago). They build up in fish and river mud. The Environment Agency does not expect rivers to be clear of them until 2063.",
    },
    {
      question: "Does a polluted river mean my tap water is unsafe?",
      answer:
        "No. River ratings describe the river, not the water in your tap. Tap water is treated and tested against separate drinking water standards before it reaches you. A poorly rated river does make treatment harder and more expensive where that river is a drinking water source. You can check the tap water test results for your postcode on TapWater.uk.",
    },
    {
      question: "What does good ecological status mean?",
      answer:
        "It means the river is only slightly changed from its natural state: the fish, insects and plants you would expect are there, and oxygen, nutrients and flow are close to natural. The law set good status as the target for every river. Moderate, poor and bad mean the river falls short, by a growing margin.",
    },
    {
      question: "How often are river ratings updated?",
      answer: `The Environment Agency runs a full assessment about every six years, with partial updates in between. The figures on this page come from the ${year} assessment, published in August 2026. We check for a new release every month.`,
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-14">
      <FAQSchema faqs={faqs} />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "River health", url: URL },
        ]}
      />
      <ArticleSchema
        headline={`River health in England by postcode (${year} ratings)`}
        description={`The Environment Agency's ${year} health ratings for England's rivers, estuaries and coastal waters, searchable by postcode.`}
        url={URL}
        datePublished="2026-09-21"
        dateModified={dateModified}
        authorName="TapWater.uk Research"
        authorUrl="https://www.tapwater.uk/about"
      />

      <div className="max-w-4xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-muted mb-8">
          <Link href="/" className="hover:text-ink transition-colors">Home</Link>
          <span>/</span>
          <span className="text-body">River health</span>
        </nav>

        <h1 className="font-display text-4xl lg:text-5xl text-ink leading-[1.08] max-w-3xl">
          {all.goodOrBetterPct}% of England&apos;s rivers are in good health. Every one fails on chemicals.
        </h1>

        {/* The whole country as one bar: each segment is a rating, sized by how many waters hold it. */}
        <p className="mt-4 text-sm text-muted">
          Environment Agency {all.classificationYear} assessment. Ratings last changed{" "}
          <time dateTime={dateModified}>
            {new Date(`${dateModified}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
          </time>
          ; we check for a new release every month.
        </p>

        <figure className="mt-10">
          <div className="flex h-10 sm:h-12 overflow-hidden rounded-[3px]" role="img"
            aria-label={WORST_FIRST.map((c) => `${c}: ${all.byEcologicalClass[c]}`).join(", ")}>
            {WORST_FIRST.map((c) => (
              <div
                key={c}
                style={{ width: `${(all.byEcologicalClass[c] / all.total) * 100}%`, background: CLASS_COLOUR[c] }}
              />
            ))}
          </div>
          <figcaption className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-3">
            {WORST_FIRST.map((c) => (
              <div key={c} className="text-sm">
                <p className="flex items-center gap-2 text-ink font-semibold">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: CLASS_COLOUR[c] }} aria-hidden="true" />
                  {c}
                </p>
                <p className="font-data text-ink text-lg mt-0.5">
                  {all.byEcologicalClass[c].toLocaleString("en-GB")}
                  <span className="text-muted text-sm font-normal">
                    {" "}
                    ({Math.round((all.byEcologicalClass[c] / all.total) * 1000) / 10}%)
                  </span>
                </p>
              </div>
            ))}
          </figcaption>
        </figure>

        <p className="mt-8 text-base text-body leading-relaxed max-w-2xl">
          These are the Environment Agency&apos;s own ratings from its {year} assessment of{" "}
          {all.total.toLocaleString("en-GB")} rivers, estuaries and coastal waters, published in August 2026.
          Looking at rivers alone, {riversOnly.goodOrBetterPct}% reach good health. The agency&apos;s headline
          figure of 14.3% also counts lakes, which score lower and are not listed here. The
          law set good as the target for all of them.
        </p>

        <div className="mt-10 border-t border-rule-strong pt-6 max-w-xl">
          <h2 className="text-lg font-semibold text-ink">Find your local river</h2>
          <p className="text-sm text-muted mt-1 mb-4">
            Enter a postcode in England to see which river your area drains into and how it is rated.
          </p>
          <PostcodeSearch size="lg" hash="river-health" />
        </div>

        <section className="mt-14">
          <h2 className="font-display text-2xl text-ink italic">What the ratings mean</h2>
          <dl className="mt-4 divide-y divide-rule border-y border-rule max-w-2xl">
            {ECOLOGICAL_CLASSES.map((c) => (
              <div key={c} className="flex gap-4 py-3 text-sm">
                <dt className="w-24 shrink-0 flex items-center gap-2 text-ink font-semibold">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: CLASS_COLOUR[c] }} aria-hidden="true" />
                  {c}
                </dt>
                <dd className="text-body">The river is {ecologicalMeaning(c)}.</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-body leading-relaxed max-w-2xl">
            A rating is built from what lives in the river (fish, insects, plants), the water itself
            (oxygen, phosphate, ammonia, temperature) and how natural its flow and banks are. The lowest
            scoring part sets the overall rating, so one problem is enough to hold a river back.
          </p>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-2xl text-ink italic">Why every river fails on chemicals</h2>
          <div className="mt-3 space-y-4 text-base text-body leading-relaxed max-w-2xl">
            <p>
              Separately from ecological health, each river is tested for a list of hazardous chemicals.{" "}
              {all.chemicalFail === all.chemicalAssessed
                ? `All ${all.chemicalAssessed.toLocaleString("en-GB")} waters failed.`
                : `${all.chemicalFail.toLocaleString("en-GB")} of ${all.chemicalAssessed.toLocaleString("en-GB")} waters failed.`}{" "}
              Almost all of that comes from three kinds of pollutant that last for decades: mercury, PFOS
              (one of the <Link href="/pfas" className="text-accent hover:underline underline-offset-2">forever chemicals</Link>)
              and PBDEs, flame retardants that were banned years ago. They collect in fish and river mud, and
              the Environment Agency does not expect them to clear until 2063.
            </p>
            <p>
              This is about rivers, not the water in your tap. Tap water is treated and tested against its
              own standards. You can see those test results by{" "}
              <Link href="/postcode" className="text-accent hover:underline underline-offset-2">looking up your postcode</Link>.
              Where PFAS is a concern, our{" "}
              <Link href="/guides/best-water-filter-pfas" className="text-accent hover:underline underline-offset-2">
                guide to filters that remove PFAS
              </Link>{" "}
              covers what works at home.
            </p>
          </div>
        </section>

        {worst.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl text-ink italic">Rivers rated bad</h2>
            <p className="text-sm text-muted mt-1 mb-4 max-w-2xl">
              The lowest rating, for rivers and waters that at least one postcode district drains into.
              {all.byEcologicalClass.Bad > worst.length &&
                ` ${all.byEcologicalClass.Bad} waters in England are rated bad in total.`}
            </p>
            <RiverTable rows={worst} />
          </section>
        )}

        {best.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl text-ink italic">Rivers rated good or high</h2>
            <p className="text-sm text-muted mt-1 mb-4 max-w-2xl">
              The healthiest rivers and waters, starting with those that serve the most postcode districts.
            </p>
            <RiverTable rows={best} />
          </section>
        )}

        <section className="mt-14">
          <h2 className="font-display text-2xl text-ink italic">Common questions</h2>
          <div className="mt-4 divide-y divide-rule border-y border-rule max-w-2xl">
            {faqs.map((f) => (
              <div key={f.question} className="py-4">
                <h3 className="text-base font-semibold text-ink">{f.question}</h3>
                <p className="mt-1.5 text-sm text-body leading-relaxed">{f.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-10 text-xs text-muted leading-relaxed max-w-2xl">
          Source: Environment Agency, Water Environment (Water Framework Directive) Regulations classification{" "}
          {year}, river catchments and transitional and coastal waters, under the Open Government Licence.
          Covers England only. Postcode districts are matched to the river catchment their centre sits in;
          tidal and seaside districts are matched to the nearest estuary or coastal water. Checked for a new
          release every month.
        </p>
      </div>
    </div>
  );
}
