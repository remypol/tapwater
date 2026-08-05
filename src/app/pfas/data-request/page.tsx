import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { OG_IMAGE } from "@/lib/og";

/**
 * The rest of the site states that PFAS results are not published by location.
 * That is a strong claim to make without evidence, so this page is the evidence:
 * we asked the regulator for the data and were refused. Everything here is drawn
 * from the refusal letter (DWI, ref EIR2026/16348, 5 August 2026) and from the
 * Inspectorate's own published PFAS guidance, both cited inline.
 *
 * The letter itself is not published here. It is addressed to a named individual
 * and carries their personal email address; the reference number is enough for
 * anyone to verify it with the Inspectorate.
 */

const TITLE = "We Asked the Regulator for PFAS Results by Area";
const DESCRIPTION =
  "We asked the Drinking Water Inspectorate for PFAS monitoring results by water supply zone. The request was refused on cost grounds. Here is what we asked, what they said, and what is actually known.";
const URL = "https://www.tapwater.uk/pfas/data-request";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    images: OG_IMAGE,
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    type: "article",
  },
  twitter: {
    images: OG_IMAGE,
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const FAQS = [
  {
    question: "Are PFAS results published for my area in the UK?",
    answer:
      "No. Water companies in England and Wales monitor PFAS and report results to the Drinking Water Inspectorate, but those results are not published by water supply zone or by postcode. We requested them under the Environmental Information Regulations in July 2026 and the request was refused on cost grounds (ref EIR2026/16348).",
  },
  {
    question: "Why were the PFAS results refused?",
    answer:
      "The Drinking Water Inspectorate refused under regulation 12(4)(b) of the Environmental Information Regulations, which allows a public authority to refuse a request that is manifestly unreasonable. It said the dataset contains millions of reported parameters, that it could not process a request of this size in Microsoft Excel, and that extracting and quality checking the data would take several days of staff time.",
  },
  {
    question: "What is the UK PFAS limit in drinking water?",
    answer:
      "There is no statutory limit in England and Wales. The Drinking Water Inspectorate operates a three-tier guidance system: tier 1 is below 0.01 micrograms per litre, tier 2 is below 0.1, and tier 3 is 0.1 or above. At tier 3 the Inspectorate expects emergency contingency measures to stop water above 0.1 being supplied to consumers, and the result must be notified to the regulator.",
  },
];

export default function PfasDataRequestPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk/" },
          { name: "PFAS Tracker", url: "https://www.tapwater.uk/pfas" },
          { name: "Data request", url: URL },
        ]}
      />
      <FAQSchema faqs={FAQS} />

      <div className="max-w-3xl mx-auto">
        <nav className="text-sm text-muted mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-accent transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/pfas" className="hover:text-accent transition-colors">
                PFAS Tracker
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-ink" aria-current="page">
              Data request
            </li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold font-display italic text-ink mb-4">
          We asked the regulator for PFAS results by area
        </h1>
        <p className="text-base text-body leading-relaxed mb-4">
          Everywhere else on this site we say the same thing: nobody can tell
          you how much PFAS is in the water at your postcode, because the
          results are not published by location. That is a strong claim, so
          this page is the evidence behind it.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          In July 2026 we asked the Drinking Water Inspectorate for the
          underlying data. The request was refused. Below is what we asked for,
          what the Inspectorate said, and what is actually known in the absence
          of the data.
        </p>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">
          What we asked for
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          On 23 July 2026 we made a request under the Environmental Information
          Regulations 2004 for the PFAS monitoring results reported to the
          Inspectorate by water companies in England and Wales, covering the
          most recent twelve months of complete data, at the lowest geographic
          level held. For each result we asked for:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-base text-body leading-relaxed">
          <li>the water company</li>
          <li>the supply zone or site identifier, and its name</li>
          <li>the sample date</li>
          <li>
            the determinand, meaning the individual PFAS compound and the
            sum-of-48 figure where it is calculated
          </li>
          <li>the measured value and its unit</li>
          <li>
            the limit of detection or reporting limit, so that a genuine
            non-detection could be told apart from a sample that was never
            tested
          </li>
        </ul>
        <p className="text-base text-body leading-relaxed mb-4">
          That last point matters more than it looks. Without a detection
          limit, a blank result and a clean result are indistinguishable, and
          any map built on the data would quietly present untested areas as
          safe ones.
        </p>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">
          What the Inspectorate said
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          The request was refused on 5 August 2026 under regulation 12(4)(b) of
          the Environmental Information Regulations, which allows a public
          authority to refuse a request it considers{" "}
          <em>manifestly unreasonable</em>. The refusal was made on cost
          grounds, and the Inspectorate carried out the public interest test
          that the regulations require, concluding in favour of withholding.
          The reference is EIR2026/16348.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The reasons given were that answering would require several members
          of staff to extract and quality check the data from a very large
          dataset, that there are, in the Inspectorate&apos;s words,{" "}
          <em>millions of parameters reported</em>, that this volume could not
          be handled in Microsoft Excel so additional tooling would have to be
          developed, and that the work would take several days.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The Inspectorate also offered advice on narrowing the request,
          suggesting asking for a single tier of results, and pointed to the
          summary figures published in its annual report. It added that a
          narrowed request would still be likely to be refused in part under
          other exceptions, giving national security as an example.
        </p>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">
          What this does and does not mean
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          It does not mean PFAS goes untested. Water companies in England and
          Wales are required to monitor it and to report what they find. It
          does not mean the Inspectorate acted improperly either: the
          regulations permit exactly this refusal, and the letter sets out the
          reasoning and the appeal route.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          What it means is narrower and more stubborn. The results exist, the
          regulator holds them, and they are not available to the public at the
          level of a supply zone. So when a website offers to tell you the PFAS
          level in your postcode, it is not working from the monitoring data,
          because that data has not been released.
        </p>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">
          What is known: the tier system
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          There is no statutory PFAS standard for drinking water in England and
          Wales. What exists instead is regulator guidance, published by the
          Inspectorate in March 2025, setting a three-tier system that applies
          both to individual PFAS compounds and to the combined sum-of figure:
        </p>
        <div className="card p-4 lg:p-6 mb-4">
          <ul className="space-y-3 text-base text-body leading-relaxed">
            <li>
              <strong className="text-ink">Tier 1, below 0.01 µg/L.</strong>{" "}
              Routine monitoring and a risk assessment for every site.
            </li>
            <li>
              <strong className="text-ink">Tier 2, below 0.1 µg/L.</strong>{" "}
              Monitoring increases to between monthly and quarterly, and the
              company must design a strategy to bring concentrations down and
              prepare contingency measures.
            </li>
            <li>
              <strong className="text-ink">Tier 3, 0.1 µg/L or above.</strong>{" "}
              This is a notifiable event. The company must tell the
              Inspectorate, notify the UK Health Security Agency and local
              health authorities, put emergency measures in place to stop water
              at or above 0.1 µg/L reaching consumers, and review the catchment
              risk assessment within three working days.
            </li>
          </ul>
        </div>
        <p className="text-base text-body leading-relaxed mb-4">
          For scale, the Inspectorate notes that 0.1 µg/L corresponds to a
          daily intake of 0.0033 µg per kg of body weight for a 60 kg adult
          drinking two litres a day.
        </p>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">
          What we do instead
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          We do not estimate. Our{" "}
          <Link href="/pfas" className="text-accent hover:underline">
            PFAS tracker
          </Link>{" "}
          says what is known and says plainly where nothing is known, rather
          than filling the gap with modelled numbers that would look like
          measurements. If you want the background on what PFAS are and where
          they come from, start with our{" "}
          <Link
            href="/guides/pfas-uk-explained"
            className="text-accent hover:underline"
          >
            guide to PFAS in UK water
          </Link>
          . If you would rather reduce your exposure regardless of what the
          data eventually shows, reverse osmosis is the treatment with the
          strongest evidence against PFAS, covered in our{" "}
          <Link
            href="/guides/best-water-filter-pfas"
            className="text-accent hover:underline"
          >
            PFAS filter guide
          </Link>
          .
        </p>

        <h2 className="font-display text-xl italic text-ink mt-10 mb-4">
          Sources
        </h2>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-base text-body leading-relaxed">
          <li>
            Drinking Water Inspectorate, response to information request
            EIR2026/16348, 5 August 2026. Held by us; quoted above and
            verifiable from the Inspectorate by reference number.
          </li>
          <li>
            <a
              href="https://www.dwi.gov.uk/what-we-do/annual-report/"
              className="text-accent hover:underline"
              rel="nofollow noopener"
              target="_blank"
            >
              Drinking Water Inspectorate annual report
            </a>
            , which publishes summary PFAS figures including sample counts per
            tier.
          </li>
          <li>
            Drinking Water Inspectorate, guidance specific to PFAS in drinking
            water, version 1.1, March 2025, for the tier thresholds and the
            actions required at each tier.
          </li>
        </ul>
        <p className="text-sm text-muted leading-relaxed">
          Last updated 5 August 2026. If the Inspectorate releases the
          underlying results, we will publish them here and say so on this
          page.
        </p>
      </div>
    </div>
  );
}
