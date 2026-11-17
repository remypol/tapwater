import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
import { ArticleSchema, BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { GeoCitation } from "@/components/geo-citation";
import {
  GuideBreadcrumb,
  GuideByline,
  GuideFaq,
  GuideFooter,
} from "@/components/guide-chrome";
import {
  WATER_COMPANY_TESTS,
  WATER_COMPANY_TESTS_CHECKED,
  confirmedTestOffers,
} from "@/lib/water-company-tests";
import { OG_IMAGE } from "@/lib/og";

export const revalidate = 86400;

const SLUG = "how-to-test-your-water";
const URL = `https://www.tapwater.uk/guides/${SLUG}`;
const TITLE = "How to Test Water Quality at Home (UK): Free, Kit and Lab";
const DESCRIPTION =
  "Three ways to test tap water in the UK: ask your water company (several test for lead free), use a strip kit (about £10 to £15) or pay a lab (about £70 to £250).";

/** "2026-11-17" -> "17 November 2026" */
const CHECKED_ON = new Date(`${WATER_COMPANY_TESTS_CHECKED}T00:00:00Z`).toLocaleDateString(
  "en-GB",
  { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" },
);

const CONFIRMED = confirmedTestOffers();
const FREE_COMPANIES = CONFIRMED.filter((row) => row.free).map((row) => row.company);
const FREE_COMPANY_LIST =
  FREE_COMPANIES.length > 1
    ? `${FREE_COMPANIES.slice(0, -1).join(", ")} and ${FREE_COMPANIES[FREE_COMPANIES.length - 1]}`
    : FREE_COMPANIES.join("");

export function generateMetadata(): Metadata {
  return {
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
}

/* ── Sources ─────────────────────────────────────────────────────────── */

const SOURCES = {
  manomanoStrips:
    "https://www.manomano.co.uk/p/16-in-1-drinking-water-test-kit-water-quality-test-strips-quick-and-easy-testing-100-pieces-easy-100-224843419",
  ivario: "https://www.ivario-lab.co.uk/",
  feedwaterMicro: "https://feedwater.co.uk/product/microbial-potability-tvc-analysis/",
  feedwaterMetals: "https://feedwater.co.uk/product/potable-water-metals-analysis-including-heavy/",
  acceptaMicro:
    "https://accepta.com/product/laboratory-analysis-services/microbiological-laboratory-water-analysis/ecoli-coliforms-tvc-water-analysis",
  ukasSearch: "https://www.ukas.com/find-an-organisation/",
  dwiPrivate: "https://www.dwi.gov.uk/private-water-supplies/customers-receiving-pws/",
  dwiSingleDwelling:
    "https://www.dwi.gov.uk/private-water-supplies/customers-receiving-pws/single-dwelling-supplies-2/",
  dwiWhatArePrivate: "https://www.dwi.gov.uk/private-water-supplies/what-are-private-supplies/",
} as const;

/* ── Content ─────────────────────────────────────────────────────────── */

const ROUTES: { route: string; cost: string; bestFor: string; limits: string }[] = [
  {
    route: "Ask your water company",
    cost: "Often free for lead. Check the table below.",
    bestFor: "Lead in an older home, or water that has changed in taste, smell or colour.",
    limits: "They test for what you report, not for everything.",
  },
  {
    route: "Home strip kit",
    cost: "About £10 to £15.",
    bestFor: "A quick check of hardness, pH and chlorine at your own tap.",
    limits: "Gives a colour band, not a figure. Cannot measure lead against the legal limit.",
  },
  {
    route: "Accredited laboratory",
    cost: "About £70 to £250, depending on what is tested.",
    bestFor: "Private supplies, house purchases, and any result you need in writing.",
    limits: "Costs the most and takes days, not minutes.",
  },
];

const LAB_PRICES: {
  lab: string;
  test: string;
  price: string;
  turnaround: string;
  accreditation: string;
  href: string;
}[] = [
  {
    lab: "IVARIO",
    test: "Water test kits, from 8 substances (Basic) to 50 (Premium)",
    price: "£69.90 to £249.90",
    turnaround: "About 5 to 7 days after the sample reaches the lab",
    accreditation:
      "The page says accredited laboratories but does not name UKAS. The company is based in Hamburg.",
    href: SOURCES.ivario,
  },
  {
    lab: "Feedwater",
    test: "E. coli, coliforms and total bacteria count",
    price: "£82.68 before VAT",
    turnaround: "About 3 days",
    accreditation: "The page says UKAS testing covers these three tests in drinking water.",
    href: SOURCES.feedwaterMicro,
  },
  {
    lab: "Feedwater",
    test: "14 metals, including lead",
    price: "£206.70 before VAT",
    turnaround: "Up to 12 working days",
    accreditation: "The page does not state UKAS accreditation for this test.",
    href: SOURCES.feedwaterMetals,
  },
  {
    lab: "Accepta",
    test: "E. coli, coliforms and total bacteria count",
    price: "£82.68 before VAT",
    turnaround: "About 3 days",
    accreditation: "The page says UKAS accredited from a partner lab.",
    href: SOURCES.acceptaMicro,
  },
];

const DECISIONS: { situation: string; action: string; href?: string; linkLabel?: string }[] = [
  {
    situation: "You are worried about lead in an older house",
    action:
      "Homes built before 1970 may still have lead pipes. Ask your water company first, because several test for lead free. If your company does not offer a test, pay a lab for a lead test and follow its sampling instructions exactly.",
    href: "/guides/lead-pipes-uk",
    linkLabel: "How to check for lead pipes",
  },
  {
    situation: "Your water tastes or smells odd, or looks different",
    action:
      "Report it to your water company before you buy anything. A change in taste, smell or colour is theirs to investigate, and they can tell you if there is a known problem in your area. A strip kit will not find the cause.",
  },
  {
    situation: "You are buying a house",
    action:
      "Check the postcode on this site for the area results and the hardness. If the house was built before 1970, ask the seller whether the lead supply pipe has been replaced. If the house has a private supply, ask for recent lab results and speak to the local council before you exchange.",
    href: "/guides/moving-house-water-check",
    linkLabel: "Water checks when moving house",
  },
  {
    situation: "You have a baby in the home",
    action:
      "Mains tap water in the UK is tested to legal standards, so most homes need no extra test. The two things worth checking are lead pipes in an older home, through your water company, and nitrate if you are on a private supply, through a lab.",
    href: "/guides/water-quality-pregnancy",
    linkLabel: "Water quality in pregnancy and for babies",
  },
  {
    situation: "You are on a private supply (well, borehole or spring)",
    action:
      "Nobody tests this water unless you arrange it. Contact your local council environmental health team, and use an accredited lab for bacteria, nitrate and metals. Strips are only useful between lab tests.",
  },
];

const FAQ_DATA = [
  {
    question: "How do I get my tap water tested in the UK?",
    answer:
      "There are three routes. Ask your water company, which costs nothing to ask and is often free if your worry is lead. Use a home strip kit, which costs about £10 to £15 and gives a rough reading in a few minutes. Or pay a laboratory, which costs about £70 to £250 and gives a figure for each substance. Start with your water company if you are on mains water, and with a laboratory if you are on a private supply.",
  },
  {
    question: "Will my water company test my tap water for free?",
    answer: `It depends on the company and on what you are worried about. When we checked each company's own website on ${CHECKED_ON}, ${FREE_COMPANIES.length} of the ${WATER_COMPANY_TESTS.length} major UK water companies said they test for lead free: ${FREE_COMPANY_LIST}. Thames Water and South West Water said they will sample for lead but did not state a price. For the others we could not confirm an offer, so contact them and ask. The table in this guide links to each company's page.`,
  },
  {
    question: "Is there water testing near me?",
    answer:
      "You do not usually need to travel. Water companies that offer a lead test send someone to your home to take the sample. Laboratories post you a sample bottle and you post it back, so the location of the lab matters less than its accreditation. If you are on a private supply, your local council environmental health team is the local contact.",
  },
  {
    question: "How much does a tap water test kit cost?",
    answer: `Strip kits cost about £10 to £15. A 100-strip, 16-in-1 kit was listed at £10.89 on ManoMano on ${CHECKED_ON}. Postal laboratory kits cost more: IVARIO listed kits from £69.90 to £249.90 on the same date, and Feedwater listed a metals test that includes lead at £206.70 before VAT.`,
  },
  {
    question: "Can a home test kit tell me if my water is safe to drink?",
    answer:
      "No. A strip kit shows a colour band for a few things such as hardness, pH and chlorine. It cannot give a figure for lead that you can compare with the UK limit of 10 micrograms per litre, and it cannot detect PFAS. If you need to know whether water meets the legal standards, you need a laboratory result or the results your water company already publishes.",
  },
  {
    question: "What does UKAS accredited mean for a water test?",
    answer:
      "UKAS is the United Kingdom Accreditation Service. It checks that a laboratory can carry out specific tests to a recognised standard. Accreditation applies test by test, so a lab can be accredited for bacteria but not for metals. Ask which of the tests you are paying for are covered, or look the lab up on the UKAS website.",
  },
  {
    question: "Who tests a private water supply?",
    answer:
      "Local councils regulate private water supplies. In England and Wales, a supply to a single home that is not rented out or used for a business does not have to be monitored, but the council will test it if the owner or occupier asks, and it can charge for the visit and the analysis. Shared, rented and commercial supplies must be risk assessed and monitored by the council.",
  },
  {
    question: "Can I check my water quality without testing it?",
    answer:
      "Yes, if you are on mains water. Water companies test their supply zones and publish the results. Enter your postcode on TapWater.uk to see the latest published results for your area, including hardness. These results describe the water in your area, not the pipes in your home, so they will not show lead from your own plumbing.",
  },
];

/* ── Helpers ─────────────────────────────────────────────────────────── */

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent hover:underline"
    >
      {children}
    </a>
  );
}

function hostOf(url: string): string {
  return url.replace(/^https:\/\/(www\.)?/, "").split("/")[0];
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function HowToTestYourWaterPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          { name: "How to Test Your Tap Water", url: URL },
        ]}
      />
      <ArticleSchema
        headline={TITLE}
        description={DESCRIPTION}
        url={URL}
        datePublished="2026-04-01"
        dateModified={WATER_COMPANY_TESTS_CHECKED}
        authorName="TapWater.uk Research"
        authorUrl="https://www.tapwater.uk/about"
      />
      <FAQSchema faqs={FAQ_DATA} />

      <div className="max-w-3xl mx-auto">
        <GuideBreadcrumb title="How to Test Your Water" />

        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          How to test your tap water in the UK
        </h1>
        <GuideByline updated="November 2026" />

        <p className="text-lg text-body leading-relaxed">
          There are three ways to get tap water tested in the UK. You can ask
          your water company, which is often free if you are worried about
          lead. You can use a home strip kit for about £10 to £15. Or you can
          pay an accredited laboratory, which costs about £70 to £250
          depending on what is tested.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Ask your water company first if you are on mains water. Use a strip
          kit only for a rough check of hardness, pH or chlorine. Pay a
          laboratory if you are on a private supply, or if you need a result
          in writing.
        </p>

        <GeoCitation
          headline={`According to TapWater.uk, ${FREE_COMPANIES.length} of the ${WATER_COMPANY_TESTS.length} major UK water companies said on their own websites on ${CHECKED_ON} that they test customers' tap water for lead free of charge.`}
          detail="Home strip kits cost about £10 to £15 and give a colour band, not a figure. Postal laboratory tests cost about £70 to £250."
        />

        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          How to test water quality at home: the three routes
        </h2>

        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm border-collapse min-w-[560px]">
            <caption className="sr-only">
              The three ways to test tap water in the UK, with cost and best use
            </caption>
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="py-2.5 pr-3 text-xs font-medium text-muted">Route</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted">Rough cost</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted">Best for</th>
                <th className="py-2.5 pl-3 text-xs font-medium text-muted">Limits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {ROUTES.map((row) => (
                <tr key={row.route}>
                  <td className="py-3 pr-3 font-medium text-ink align-top">{row.route}</td>
                  <td className="py-3 px-3 text-body align-top">{row.cost}</td>
                  <td className="py-3 px-3 text-body align-top">{row.bestFor}</td>
                  <td className="py-3 pl-3 text-body align-top">{row.limits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-faint mt-3">
          Costs are from the retailer and laboratory pages named further down
          this guide, checked on {CHECKED_ON}.
        </p>

        {/* ── Water company ───────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Ask your water company first
        </h2>
        <p className="text-base text-body leading-relaxed">
          Your water company already tests the water in your area, and it is
          the first place to report a problem. If your water has changed
          in taste, smell or colour, report it to them before you pay for
          anything. They can tell you whether there is a known problem nearby,
          and some will send someone to take a sample.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Lead is the test most companies offer to households. Lead does not
          come from the mains. It comes from old pipes between the street and
          your kitchen tap, mostly in homes built before 1970. That is why the
          company has to sample at your tap to find it.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          We read the website of each major UK water company on {CHECKED_ON}{" "}
          and recorded what it says it offers. {CONFIRMED.length} of the{" "}
          {WATER_COMPANY_TESTS.length} describe a test on their own page, and{" "}
          {FREE_COMPANIES.length} of those say it is free. Where a company
          does not describe a test, the table says so and gives the link. We
          have not guessed.
        </p>

        <div className="overflow-x-auto -mx-4 px-4 mt-6">
          <table className="w-full text-sm border-collapse min-w-[640px]">
            <caption className="sr-only">
              What each major UK water company says it offers for testing tap
              water, checked on {CHECKED_ON}
            </caption>
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="py-2.5 pr-3 text-xs font-medium text-muted">Water company</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted">What it offers</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted">How to ask</th>
                <th className="py-2.5 pl-3 text-xs font-medium text-muted">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {WATER_COMPANY_TESTS.map((row) => (
                <tr key={row.company}>
                  <td className="py-3 pr-3 font-medium text-ink align-top">{row.company}</td>
                  <td className={`py-3 px-3 align-top ${row.confirmed ? "text-body" : "text-muted"}`}>
                    {row.offer}
                  </td>
                  <td className="py-3 px-3 text-body align-top">{row.howToAsk}</td>
                  <td className="py-3 pl-3 align-top whitespace-nowrap">
                    <Ext href={row.sourceUrl}>{hostOf(row.sourceUrl)}</Ext>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-faint mt-3">
          Source: the web page of each company, linked in the last column,
          read on {CHECKED_ON}. Offers and phone numbers change, so check the
          company page before you call. If your supplier is not listed, ask it
          the same question.
        </p>

        {/* ── Home kits ───────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Home test kits
        </h2>
        <p className="text-base text-body leading-relaxed">
          A home kit is usually a tub of paper strips. You dip a strip in a
          glass of tap water, wait a minute or two, and match the coloured
          pads to a chart. It is quick and cheap, and you get an answer the
          same day.
        </p>
        <h3 className="font-semibold text-ink text-lg mt-8 mb-2">What a strip kit can tell you</h3>
        <ul className="list-disc pl-6 space-y-2 text-base text-body leading-relaxed">
          <li>Roughly how hard your water is.</li>
          <li>Whether the pH is in the normal range.</li>
          <li>Whether chlorine is present.</li>
          <li>Whether a filter or softener is making a difference, if you test before and after.</li>
        </ul>
        <h3 className="font-semibold text-ink text-lg mt-8 mb-2">What a strip kit cannot tell you</h3>
        <ul className="list-disc pl-6 space-y-2 text-base text-body leading-relaxed">
          <li>
            Whether lead is above or below the UK limit of 10 micrograms per
            litre. The colour bands are too wide.
          </li>
          <li>Whether PFAS or pesticides are present. No strip detects them.</li>
          <li>
            A figure you can show to a landlord, a buyer or a council. The
            result depends on your eye and your lighting.
          </li>
        </ul>
        <h3 className="font-semibold text-ink text-lg mt-8 mb-2">Typical price</h3>
        <p className="text-base text-body leading-relaxed">
          Expect to pay about £10 to £15. A 100-strip, 16-in-1 kit was listed
          at £10.89 on <Ext href={SOURCES.manomanoStrips}>ManoMano</Ext> when
          we checked on {CHECKED_ON}. The two strip kits in our kit guide are
          listed there at about £13 and about £15. Prices on marketplaces move
          often, so treat these as a guide.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          For which kits are worth buying and how to read the colour chart,
          see our guide to the{" "}
          <Link href="/guides/best-water-testing-kit-uk" className="text-accent hover:underline">
            best water testing kits in the UK
          </Link>
          .
        </p>

        {/* ── Labs ────────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Laboratory tests
        </h2>
        <p className="text-base text-body leading-relaxed">
          A laboratory test gives you a figure for each substance, which you
          can compare with the legal limit. It is worth paying for when:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-base text-body leading-relaxed mt-4">
          <li>you are on a private supply, such as a well, borehole or spring;</li>
          <li>your water company does not offer a lead test and your home was built before 1970;</li>
          <li>you are buying a house and want a result in writing;</li>
          <li>you need evidence for a landlord, a council or a complaint.</li>
        </ul>
        <p className="text-base text-body leading-relaxed mt-4">
          If you are on mains water, have no old pipes and the water tastes
          normal, a laboratory test is unlikely to tell you anything the
          published results do not.
        </p>

        <h3 className="font-semibold text-ink text-lg mt-8 mb-2">
          What UKAS and the Drinking Water Inspectorate mean here
        </h3>
        <p className="text-base text-body leading-relaxed">
          UKAS is the United Kingdom Accreditation Service. It checks that a
          laboratory can carry out a specific test to a recognised standard.
          Accreditation is given test by test. A lab can be accredited for
          bacteria and not for metals, so ask which of the tests you are
          buying are covered. You can look a lab up on the{" "}
          <Ext href={SOURCES.ukasSearch}>UKAS search page</Ext>.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          The Drinking Water Inspectorate is the regulator for public water
          supplies in England and Wales. It checks the water companies. It
          does not test water for households, and it does not approve home
          test kits. Scotland and Northern Ireland have their own regulators.
        </p>

        <h3 className="font-semibold text-ink text-lg mt-8 mb-2">What it costs</h3>
        <p className="text-base text-body leading-relaxed mb-6">
          These are prices from the product pages of each seller on {CHECKED_ON}.
          They are examples, not recommendations. We have no arrangement with
          any laboratory and have not used these services.
        </p>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm border-collapse min-w-[640px]">
            <caption className="sr-only">
              Example UK laboratory water test prices, checked on {CHECKED_ON}
            </caption>
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="py-2.5 pr-3 text-xs font-medium text-muted">Seller</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted">Test</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted whitespace-nowrap">Listed price</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted">Results</th>
                <th className="py-2.5 pl-3 text-xs font-medium text-muted">Accreditation stated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {LAB_PRICES.map((row) => (
                <tr key={`${row.lab}-${row.test}`}>
                  <td className="py-3 pr-3 font-medium text-ink align-top">
                    <Ext href={row.href}>{row.lab}</Ext>
                  </td>
                  <td className="py-3 px-3 text-body align-top">{row.test}</td>
                  <td className="py-3 px-3 font-data text-ink align-top whitespace-nowrap">{row.price}</td>
                  <td className="py-3 px-3 text-body align-top">{row.turnaround}</td>
                  <td className="py-3 pl-3 text-body align-top">{row.accreditation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-faint mt-3">
          Source: the product page of each seller, linked from its name,
          read on {CHECKED_ON}. Prices shown before VAT will be 20% higher at
          the checkout.
        </p>

        <h3 className="font-semibold text-ink text-lg mt-8 mb-2">How sampling and results work</h3>
        <ol className="list-decimal pl-6 space-y-3 text-base text-body leading-relaxed">
          <li>
            You order online. The lab posts you a sample bottle, instructions
            and return packaging.
          </li>
          <li>
            You fill the bottle at the cold kitchen tap. Use the bottle the
            lab sends, and do not touch the inside of the bottle or the lid.
          </li>
          <li>
            Follow the lab instructions on timing. For lead, labs often ask
            for the first water out of the tap in the morning, because water
            that has stood in the pipes overnight shows the highest level.
          </li>
          <li>
            Post it back the same day. Bacteria samples have to reach the lab
            within about 24 hours. Feedwater, for example, asks customers to
            sample only from Monday to Thursday so the bottle does not sit in
            the post over a weekend.
          </li>
          <li>
            Results come by email or online. On the pages we checked this took
            from about 3 days for bacteria to up to 12 working days for
            metals.
          </li>
        </ol>
        <p className="text-base text-body leading-relaxed mt-4">
          When a water company tests for lead, it does the sampling for you.
          Anglian Water, for example, says its technician takes three samples
          from the kitchen tap and that results can take up to 10 working
          days.
        </p>

        {/* ── Private supplies ────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Private water supplies
        </h2>
        <p className="text-base text-body leading-relaxed">
          A private supply is any water supply that does not come from a water
          company. Wells, boreholes and springs are the common ones. No water
          company tests this water, so the checks above do not apply.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Local councils regulate private supplies. The Drinking Water
          Inspectorate advises councils but does not deal with owners
          directly. Its guidance for{" "}
          <Ext href={SOURCES.dwiPrivate}>people who receive a private supply</Ext>{" "}
          explains the rules for England and Wales:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-base text-body leading-relaxed mt-4">
          <li>
            If the supply serves one home that is not rented out or used for a
            business, the council does not have to monitor it. It will carry
            out a test or a risk assessment if the owner or occupier asks, and
            it can charge for the visit and the analysis. See the guidance on{" "}
            <Ext href={SOURCES.dwiSingleDwelling}>single dwelling supplies</Ext>.
          </li>
          <li>
            If the supply is shared, rented out or used for a business, the
            council must risk assess and monitor it.
          </li>
          <li>
            The Inspectorate strongly advises registering a private supply
            with the council.
          </li>
        </ul>
        <p className="text-base text-body leading-relaxed mt-4">
          So the first step is to contact the environmental health team at
          your local council. Ask what it holds on your supply, what a test
          costs, and which laboratory it uses. If you arrange your own test,
          use a laboratory that is accredited for the tests you need. Scotland
          and Northern Ireland have their own rules and regulators. The
          Inspectorate also explains{" "}
          <Ext href={SOURCES.dwiWhatArePrivate}>what counts as a private supply</Ext>.
        </p>

        {/* ── Free check ──────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          What you can check free right now
        </h2>
        <p className="text-base text-body leading-relaxed">
          If you are on mains water, results for your area already exist.
          Water companies test their supply zones and publish what they find.
          Our <Link href="/" className="text-accent hover:underline">postcode lookup</Link>{" "}
          shows the latest published results for your area. Our{" "}
          <Link href="/hardness" className="text-accent hover:underline">water hardness checker</Link>{" "}
          shows how hard your water is.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          These results describe the water in your area, not the pipes in your
          home. They will not show lead from your own plumbing, and they do
          not cover private supplies. We publish these results. We do not test
          water ourselves.
        </p>

        <div className="mt-8 card-elevated p-8 text-center rounded-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center">
              <Search className="w-6 h-6 text-accent" aria-hidden="true" />
            </div>
          </div>
          <h3 className="font-display text-xl italic text-ink">
            See the latest published results for your postcode
          </h3>
          <p className="text-base text-muted mt-2 max-w-md mx-auto">
            Hardness, chlorine, lead, nitrate and more for your area, next to
            the UK limits. Free to use.
          </p>
          <div className="mt-6 max-w-sm mx-auto">
            <PostcodeSearch />
          </div>
        </div>

        {/* ── Decision list ───────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Which should I do?
        </h2>
        <dl className="border-y border-rule divide-y divide-rule">
          {DECISIONS.map((row) => (
            <div
              key={row.situation}
              className="py-4 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6"
            >
              <dt className="text-base font-medium text-ink">{row.situation}</dt>
              <dd className="text-base text-body leading-relaxed mt-1 sm:mt-0">
                {row.action}
                {row.href && row.linkLabel ? (
                  <>
                    {" "}
                    <Link href={row.href} className="text-accent hover:underline">
                      {row.linkLabel}
                    </Link>
                    .
                  </>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-muted mt-4">
          This guide is general information, not medical advice. If you are
          worried about your health, speak to your GP or call NHS 111.
        </p>

        <GuideFaq faqs={FAQ_DATA} />

        {/* ── Related ─────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Related guides
        </h2>
        <ul className="space-y-2">
          {[
            ["/guides/best-water-testing-kit-uk", "Best water testing kits in the UK"],
            ["/guides/lead-pipes-uk", "Lead pipes in UK homes"],
            ["/contaminant/lead", "Lead in UK tap water: the limit and the results"],
            ["/guides/is-uk-tap-water-safe", "Is UK tap water safe?"],
            ["/guides/understanding-your-water-supplier", "Understanding your water supplier"],
          ].map(([href, label]) => (
            <li key={href}>
              <Link
                href={href}
                className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
              >
                <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <GuideFooter reviewed="November 2026">
          Water company offers, kit prices and laboratory prices were read
          from the linked pages on {CHECKED_ON} and may have changed since. We
          have no commercial arrangement with any water company or laboratory
          named here.{" "}
        </GuideFooter>
      </div>
    </div>
  );
}
