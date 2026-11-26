import type { Metadata } from "next";
import Link from "next/link";
import { SoftenerLeadForm } from "@/components/softener-lead-form";
import { SoftenerGuidesNav } from "@/components/softener-guides-nav";
import { ProductCard } from "@/components/product-card";
import { ArticleSchema, BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { GeoCitation } from "@/components/geo-citation";
import {
  GuideBreadcrumb,
  GuideByline,
  GuideDisclosure,
  GuideFaq,
  GuideFooter,
} from "@/components/guide-chrome";
import { getProductsByCategory } from "@/lib/products";
import { OG_IMAGE } from "@/lib/og";
import {
  MARKETPLACE_GUIDE,
  NO_PUBLISHED_PRICE,
  SOFTENER_PRICES,
  formatGbp,
  formatPriceRange,
  installedPriceRange,
  unitPriceRange,
  type SoftenerPrice,
} from "@/lib/softener-prices";

export const revalidate = 86400;

const year = new Date().getFullYear();
const SLUG = "water-softener-cost-uk";
const URL = `https://www.tapwater.uk/guides/${SLUG}`;

/* ── Figures, all derived from src/lib/softener-prices.ts ─────────────── */

const CHECKED_ON = "17 November 2026";
const MJQ = MARKETPLACE_GUIDE;

const INSTALLED = formatPriceRange(installedPriceRange());
const HARVEY_FROM = formatGbp(installedPriceRange().low);
const AVERAGE = formatGbp(MJQ.averageInstalledGbp);
const LABOUR = formatPriceRange(MJQ.labour);
const SERVICE = formatPriceRange(MJQ.serviceYearly);

/** Unit-only prices rounded to the nearest £10 for prose; the table has the exact figures. */
const round10 = (n: number) => Math.round(n / 10) * 10;
const unitExact = unitPriceRange();
const unitRounded = { low: round10(unitExact.low), high: round10(unitExact.high) };
const UNIT = formatPriceRange(unitRounded);
/** A merchant unit plus a plumber, using MyJobQuote's labour range. */
const OWN_PLUMBER = formatPriceRange({
  low: unitRounded.low + MJQ.labour.low,
  high: unitRounded.high + MJQ.labour.high,
});

/* Harvey's finance example, from its payment options page. */
const HARVEY_FACTS_URL = "https://www.harveywatersofteners.co.uk/facts-culligan-harvey/";
const HARVEY_PAYMENT_URL = "https://www.harveywatersofteners.co.uk/payment-options/";
const LOAN = 2300;
const FINANCE: { term: string; apr: string; monthly: number; total: number }[] = [
  { term: "12 months", apr: "0%", monthly: 191.67, total: 2300 },
  { term: "3 years", apr: "11.9% APR", monthly: 76.28, total: 2746.08 },
  { term: "5 years", apr: "11.9% APR", monthly: 51.05, total: 3063 },
];
const interest = (total: number) => formatGbp(Math.round((total - LOAN) * 100) / 100);

const TITLE = `Water Softener Cost UK (${year}): Prices by Brand, Fitting and Running Costs`;
const DESCRIPTION = `A water softener costs about ${INSTALLED} fitted in the UK. Published prices for Harvey, BWT, Monarch, Tapworks and more, each with its source, plus fitting, salt and finance costs.`;

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
    question: "How much does a water softener cost in the UK?",
    answer: `About ${INSTALLED} fitted, when you buy it as an installed package. Harvey publishes a starting price of ${HARVEY_FROM} including VAT for a basic installation package, and MyJobQuote puts a high-end unit with labour at up to ${formatGbp(installedPriceRange().high)}. MyJobQuote gives ${AVERAGE} as the average. Buying a unit from a plumbing merchant for about ${UNIT} and paying your own plumber ${LABOUR} comes to about ${OWN_PLUMBER}.`,
  },
  {
    question: "How much does water softener installation cost?",
    answer: `MyJobQuote says plumbers typically charge a fixed rate of ${LABOUR} to fit a softener, and that the job usually takes two to four hours. Brands that sell direct, such as Harvey, include fitting in the package price, which starts from ${HARVEY_FROM}. Harvey says all pricing is subject to a site survey and pipework complexity, so long pipe runs or an awkward stop tap raise the price.`,
  },
  {
    question: "What are the running costs of a water softener?",
    answer: `Salt is the main one. Harvey says a typical twin-cylinder softener uses about one block of salt per person each month, costing roughly £5 to £7 a month. MyJobQuote puts tablet salt at around £5 to £10 a bag, with most households using one to two bags a month. MyJobQuote also gives ${SERVICE} a year for a professional service. A softener uses some water each time it cleans itself, which shows on a metered bill.`,
  },
  {
    question: "Does a water softener save money?",
    answer:
      "It can in hard water, and it rarely does in soft water. Harvey says a softener saves up to £400 a year through less soap, better heating efficiency and longer appliance life. That is the maker's own figure, not an independent one. If your water is under about 200 mg/L you have less limescale to prevent, so there is less to save. Check your hardness by postcode before you ask for quotes.",
  },
  {
    question: "Is a cheap water softener worth it?",
    answer: `A cheaper softener softens water in the same way as a dear one, because both use the same kind of resin. On the day we checked, City Plumbing listed single tank electric units from Monarch, BWT and Tapworks at about £600 to £690, and twin tank units at about £940 to £980. The extra buys soft water while the unit cleans itself, and in some cases no need for a plug socket. A brand that installs for you also handles the fitting and the aftercare.`,
  },
  {
    question: "Is it cheaper to pay for a water softener monthly?",
    answer: `No, unless the finance is interest free. Harvey's own example for a ${formatGbp(LOAN)} loan shows no interest over 12 months, ${interest(FINANCE[1].total)} of interest over three years and ${interest(FINANCE[2].total)} over five years, both at 11.9% APR. The monthly payment falls as the term gets longer, but the total you repay rises. Compare the total repayable, not the monthly figure.`,
  },
  {
    question: "Are there grants for water softeners in the UK?",
    answer:
      "We have not found a UK government grant that covers a water softener. Some sellers offer finance or rental instead. Treat finance as a loan and compare the total repayable with the price for paying outright.",
  },
];

function priceLabel(row: SoftenerPrice): string {
  if (row.priceGbp !== undefined) return formatGbp(row.priceGbp);
  if (row.priceFromGbp !== undefined && row.priceToGbp !== undefined) {
    return formatPriceRange({ low: row.priceFromGbp, high: row.priceToGbp });
  }
  return row.priceFromGbp !== undefined ? `from ${formatGbp(row.priceFromGbp)}` : "";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-11-17" to "17 Nov 2026", without going through a time zone. */
function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function Source({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
      {children}
    </a>
  );
}

export default function WaterSoftenerCostGuide() {
  const salt = getProductsByCategory("softener_salt");
  const rail = ["hydrosalt-tablets-25kg", "aquasol-tablets-3x25kg"]
    .map((id) => salt.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const notes = SOFTENER_PRICES.filter((r) => r.note);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          { name: "Water Softener Cost UK", url: URL },
        ]}
      />
      <ArticleSchema
        headline={TITLE}
        description={DESCRIPTION}
        url={URL}
        datePublished="2026-09-07"
        dateModified="2026-11-17"
        authorName="TapWater.uk Research"
        authorUrl="https://www.tapwater.uk/about"
      />
      <FAQSchema faqs={FAQ_DATA} />

      <div className="max-w-3xl mx-auto">
        <GuideBreadcrumb title="Water Softener Cost UK" />
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Water softener cost UK ({year})
        </h1>
        <GuideByline updated="November 2026" />

        <p className="text-lg text-body leading-relaxed">
          A water softener costs about {INSTALLED} fitted in a UK home when you
          buy it as an installed package. The lower figure is the starting price
          Harvey publishes for a basic installation package, and the upper
          figure is the top of MyJobQuote&rsquo;s range for a high-end unit with
          labour.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          MyJobQuote gives {AVERAGE} as the average. There is a cheaper route:
          buy a unit from a plumbing merchant for about {UNIT} and pay your own
          plumber {LABOUR} to fit it, which comes to about {OWN_PLUMBER}. Every
          price on this page has its source next to it and the date we read it.
        </p>

        <GeoCitation
          headline={`According to TapWater.uk's check of published UK prices on ${CHECKED_ON}, a water softener costs about ${INSTALLED} installed, and about ${UNIT} for the unit alone from a plumbing merchant.`}
          detail={`Sources: Harvey Water Softeners (from ${HARVEY_FROM} installed), MyJobQuote (average ${AVERAGE} installed) and City Plumbing unit prices. Kinetico and TwinTec do not publish prices.`}
        />

        <GuideDisclosure quotes />

        {/* ── Price table ─────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          Water softener prices by brand and model
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          These are prices the seller or maker shows on its own website,
          including VAT unless a note below says otherwise. &ldquo;Installed&rdquo; means the price covers fitting.
          &ldquo;Unit only&rdquo; means you still need to pay a plumber. We read
          each page on {CHECKED_ON}. Prices change, so follow the link before
          you rely on one.
        </p>

        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm border-collapse">
            <caption className="sr-only">
              Published UK water softener prices by brand and model, with source and date checked
            </caption>
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="py-2.5 pr-3 text-xs font-medium text-muted">Brand and model</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted">Type</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted">Price</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted">Includes</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted">Source</th>
                <th className="py-2.5 pl-3 text-xs font-medium text-muted">Checked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {SOFTENER_PRICES.map((row) => (
                <tr key={`${row.brand}-${row.model}`}>
                  <td className="py-3 pr-3 align-top">
                    <span className="font-medium text-ink">{row.brand}</span>
                    <span className="block text-xs text-muted">{row.model}</span>
                  </td>
                  <td className="py-3 px-3 align-top text-body">{row.type}</td>
                  <td className="py-3 px-3 align-top font-data text-ink whitespace-nowrap">
                    {priceLabel(row)}
                  </td>
                  <td className="py-3 px-3 align-top text-body whitespace-nowrap">
                    {row.includes === "installed" ? "Installed" : "Unit only"}
                  </td>
                  <td className="py-3 px-3 align-top">
                    <Source href={row.sourceUrl}>{row.sourceName}</Source>
                  </td>
                  <td className="py-3 pl-3 align-top text-muted whitespace-nowrap">
                    {shortDate(row.checked)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-4 space-y-1.5 text-sm text-muted leading-relaxed">
          {notes.map((row) => (
            <li key={`${row.brand}-${row.model}`}>
              <strong className="text-ink">
                {row.brand} {row.model}:
              </strong>{" "}
              {row.note}
            </li>
          ))}
        </ul>

        <h3 className="font-semibold text-ink text-lg mt-10 mb-2">Prices we could not find</h3>
        <p className="text-base text-body leading-relaxed">
          Some brands sell only through a home visit or a dealer and show no
          price online. We have left them out of the table instead of guessing.
        </p>
        <ul className="mt-4 space-y-3 text-base text-body">
          {NO_PUBLISHED_PRICE.map((b) => (
            <li key={b.brand} className="pl-5 border-l-2 border-rule">
              <strong className="text-ink">{b.brand}.</strong> {b.says}{" "}
              <Source href={b.sourceUrl}>{b.brand} website</Source>
            </li>
          ))}
          <li className="pl-5 border-l-2 border-rule">
            <strong className="text-ink">Harvey, model by model.</strong> Harvey
            publishes one starting price and nothing for each model. Its facts
            page says: &ldquo;All pricing is strictly subject to site survey and
            pipework complexity.&rdquo;{" "}
            <Source href={HARVEY_FACTS_URL}>Harvey Water Softeners</Source>
          </li>
          <li className="pl-5 border-l-2 border-rule">
            <strong className="text-ink">Water2Buy and EcoWater.</strong> We
            could not confirm a current UK price from either maker&rsquo;s own
            page on {CHECKED_ON}, so neither is in the table.
          </li>
        </ul>

        {/* ── Installation ────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Installation cost and what changes it
        </h2>
        <p className="text-base text-body leading-relaxed">
          <Source href={MJQ.sourceUrl}>MyJobQuote</Source> says plumbers
          typically charge a fixed rate of {LABOUR} to fit a softener, and that
          the job usually takes two to four hours. Its figures for a softener
          supplied and fitted are below.
        </p>
        <dl className="border-y border-rule divide-y divide-rule mt-6">
          {MJQ.installedBands.map((band) => (
            <div key={band.label} className="py-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5">
              <dt className="text-base text-ink">{band.label}, fitted</dt>
              <dd className="font-data text-base text-ink text-right whitespace-nowrap">
                {formatPriceRange(band)}
              </dd>
            </div>
          ))}
          <div className="py-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5">
            <dt className="text-base text-ink">Labour alone</dt>
            <dd className="font-data text-base text-ink text-right whitespace-nowrap">{LABOUR}</dd>
          </div>
          <div className="py-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5">
            <dt className="text-base text-ink">Average, fitted</dt>
            <dd className="font-data text-base text-ink text-right whitespace-nowrap">{AVERAGE}</dd>
          </div>
        </dl>
        <p className="text-sm text-muted mt-3">
          Source: MyJobQuote, water softener installation cost guide, read on {CHECKED_ON}.
        </p>
        <p className="text-base text-body leading-relaxed mt-6">
          Harvey sells its softeners fitted. Its{" "}
          <Source href={HARVEY_FACTS_URL}>facts page</Source> says: &ldquo;Basic
          installation packages start from {HARVEY_FROM} (inclusive of
          VAT).&rdquo; It also says all pricing is subject to a site survey and
          pipework complexity. So the starting price is for a simple job.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          These are the things that move a fitting price up or down.
        </p>
        <ul className="mt-4 space-y-3 text-base text-body">
          <li className="pl-5 border-l-2 border-rule">
            <strong className="text-ink">Where the water comes in.</strong> A
            softener goes on the mains pipe just after the stop tap. If that is
            under the kitchen sink with a drain nearby, the job is simple. If
            it is boxed in, or in a hallway or garage, expect more pipework.
          </li>
          <li className="pl-5 border-l-2 border-rule">
            <strong className="text-ink">How far the drain is.</strong> The
            softener rinses itself and needs a waste pipe and an overflow. A
            long run to a drain adds time.
          </li>
          <li className="pl-5 border-l-2 border-rule">
            <strong className="text-ink">Pipe size.</strong> Merchants sell
            fitting kits in 15mm and 22mm. Homes with a larger mains pipe need
            the larger kit, which costs more.
          </li>
          <li className="pl-5 border-l-2 border-rule">
            <strong className="text-ink">A hard-water drinking tap.</strong> The
            Drinking Water Inspectorate advises keeping an unsoftened tap for
            drinking and cooking. Check whether the quote includes one.
          </li>
          <li className="pl-5 border-l-2 border-rule">
            <strong className="text-ink">A plug socket.</strong> Electric units
            need one near the softener. Non-electric and battery units do not.
          </li>
        </ul>
        <p className="text-base text-body leading-relaxed mt-4">
          The fitting itself is explained step by step in{" "}
          <Link href="/guides/water-softener-installation-uk/" className="text-accent hover:underline">
            water softener installation UK
          </Link>
          .
        </p>

        <div className="mt-10">
          <SoftenerLeadForm
            hardnessValue={220}
            hardnessLabel="hard"
            source="softener_guide"
          />
        </div>

        {/* ── Running costs ───────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Running costs: salt, water and servicing
        </h2>
        <dl className="divide-y divide-rule border-y border-rule">
          <div className="py-4 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6">
            <dt className="text-base font-medium text-ink">Salt</dt>
            <dd className="text-base text-body leading-relaxed mt-1 sm:mt-0">
              Harvey says a typical twin-cylinder softener uses about one block
              of salt per person each month, &ldquo;costing roughly £5–£7 a
              month&rdquo;. MyJobQuote says tablet salt costs around £5 to £10 a
              bag, with most households using one to two bags a month. Sources:{" "}
              <Source href={HARVEY_FACTS_URL}>Harvey Water Softeners</Source> and{" "}
              <Source href={MJQ.sourceUrl}>MyJobQuote</Source>.
            </dd>
          </div>
          <div className="py-4 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6">
            <dt className="text-base font-medium text-ink">Water</dt>
            <dd className="text-base text-body leading-relaxed mt-1 sm:mt-0">
              A softener uses some water each time it rinses its resin, and
              that water goes down the drain. If you have a water meter you pay
              for it. Neither Harvey nor MyJobQuote puts a figure on it, so we
              have not either. Ask the installer how many litres the unit uses
              per rinse and how often it will rinse in your home.
            </dd>
          </div>
          <div className="py-4 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6">
            <dt className="text-base font-medium text-ink">Servicing</dt>
            <dd className="text-base text-body leading-relaxed mt-1 sm:mt-0">
              MyJobQuote says a professional service costs {SERVICE} a year.
              Not every softener needs a yearly service, so ask what the
              warranty requires. Source:{" "}
              <Source href={MJQ.sourceUrl}>MyJobQuote</Source>.
            </dd>
          </div>
          <div className="py-4 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6">
            <dt className="text-base font-medium text-ink">Electricity</dt>
            <dd className="text-base text-body leading-relaxed mt-1 sm:mt-0">
              Electric units have a small controller that stays plugged in.
              Non-electric units, such as Harvey&rsquo;s, use none.
            </dd>
          </div>
        </dl>
        <p className="text-base text-body leading-relaxed mt-6">
          Tablet salt is cheaper per kilo in a 25 kg sack than in a 10 kg bag.
          Block salt for twin-cylinder softeners costs more per kilo and is
          easier to carry.
        </p>
        <div className="mt-6 space-y-4">
          {rail.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              pageType="water-softener-cost-guide"
              placement="guide-salt-rail"
              highlight={
                product.id === "hydrosalt-tablets-25kg"
                  ? "The usual monthly sack"
                  : "Bulk buy for very hard water"
              }
            />
          ))}
        </div>
        <p className="text-sm text-muted mt-4">
          Which format your softener takes, and how to store it, is in{" "}
          <Link href="/guides/water-softener-salt-guide/" className="text-accent hover:underline">
            the salt guide
          </Link>
          .
        </p>

        {/* ── Outright, finance, rent ─────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Buying outright, finance or renting
        </h2>
        <p className="text-base text-body leading-relaxed">
          Paying outright is the cheapest way to buy unless the finance is
          interest free. Harvey&rsquo;s{" "}
          <Source href={HARVEY_PAYMENT_URL}>payment options page</Source> gives
          this example for a loan of {formatGbp(LOAN)}. We have added the last
          column, which is the total repayable minus {formatGbp(LOAN)}.
        </p>
        <div className="overflow-x-auto -mx-4 px-4 mt-6">
          <table className="w-full text-sm border-collapse">
            <caption className="sr-only">
              Harvey finance example on a {formatGbp(LOAN)} loan: monthly payment, total repayable
              and interest by term
            </caption>
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="py-2.5 pr-3 text-xs font-medium text-muted">Term</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted">Rate</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted">Monthly</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted">Total repayable</th>
                <th className="py-2.5 pl-3 text-xs font-medium text-muted">Interest added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {FINANCE.map((f) => (
                <tr key={f.term}>
                  <td className="py-3 pr-3 font-medium text-ink">{f.term}</td>
                  <td className="py-3 px-3 text-body whitespace-nowrap">{f.apr}</td>
                  <td className="py-3 px-3 font-data text-ink">{formatGbp(f.monthly)}</td>
                  <td className="py-3 px-3 font-data text-ink">{formatGbp(f.total)}</td>
                  <td className="py-3 pl-3 font-data text-ink">
                    {f.total === LOAN ? "£0" : interest(f.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted mt-3">
          Source: Harvey Water Softeners, payment options, read on {CHECKED_ON}. The lender is
          Novuna Consumer Finance. Harvey acts as a credit broker.
        </p>
        <p className="text-base text-body leading-relaxed mt-6">
          The five-year plan has the lowest monthly payment and the highest
          cost. It adds {interest(FINANCE[2].total)} to a {formatGbp(LOAN)}{" "}
          softener. The three-year plan adds {interest(FINANCE[1].total)}. If
          you can clear the balance in 12 months, the 0% plan costs the same as
          paying outright.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Harvey also rents softeners. The same page lists a fixed term of 24
          months and an installation fee of £199 including VAT paid up front.
          It says the hire cannot be cancelled after a 90-day money-back
          period until the fixed term ends. The page does not give the monthly
          rental price, so ask for it in writing and multiply it by 24 before
          you compare it with buying.
        </p>

        {/* ── When it is not worth it ─────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          When a softener is not worth the money
        </h2>
        <p className="text-base text-body leading-relaxed">
          A softener only earns its keep in hard water. Water companies report
          hardness in milligrams per litre (mg/L). Below about 120 mg/L the
          water is soft and you will barely see limescale. Between 120 and 200
          mg/L it is moderately hard: you will see scale in the kettle, and
          descaler usually deals with it for a few pounds a year. From about
          200 mg/L, scale builds up quickly in boilers, showers and washing
          machines, and a softener starts to make sense.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Harvey says a softener saves up to £400 a year on soap, heating and
          appliances. That is the maker&rsquo;s own figure, not an independent
          one, and it assumes hard water. Look up your own reading on our{" "}
          <Link href="/hardness/" className="text-accent hover:underline">
            water hardness checker
          </Link>{" "}
          before you book a home visit. A softener is also hard to justify if
          you rent, plan to move soon, or have nowhere to run a drain.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Not sure which band you are in?{" "}
          <Link href="/guides/do-i-need-a-water-softener/" className="text-accent hover:underline">
            Check your postcode first
          </Link>
          .
        </p>

        {/* ── Comparing quotes ────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          How to compare quotes
        </h2>
        <dl className="divide-y divide-rule border-y border-rule">
          {[
            [
              "Get two or three quotes",
              "Brands that hide their prices quote after a home visit. A second and third quote is the only way to know whether the first was fair.",
            ],
            [
              "Ask for the price in writing, including VAT",
              `Compare it with the published prices above. Harvey's packages start from ${HARVEY_FROM}, and MyJobQuote's average for a fitted softener is ${AVERAGE}.`,
            ],
            [
              "Check what the price includes",
              "Fitting, the bypass valves, the drain and overflow, a hard-water drinking tap, the first salt, and removal of an old unit. Ask for each one by name.",
            ],
            [
              "Ask for the model name and size",
              "You cannot compare two quotes without the model. A bigger household in harder water needs a bigger unit, and that changes the price.",
            ],
            [
              "Compare the total repayable",
              `On Harvey's example, five years of finance turns ${formatGbp(LOAN)} into ${formatGbp(FINANCE[2].total)}. Ask for the cash price first, then the finance terms.`,
            ],
            [
              "Ask about the warranty and servicing",
              `How long the warranty lasts, and whether it depends on a paid yearly service. MyJobQuote puts a service at ${SERVICE} a year.`,
            ],
            [
              "Do not sign on the day",
              "A discount that only lasts until the salesperson leaves is a sales method. A fair price will still be there next week.",
            ],
          ].map(([head, body]) => (
            <div key={head} className="py-4 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6">
              <dt className="text-base font-medium text-ink">{head}</dt>
              <dd className="text-base text-body leading-relaxed mt-1 sm:mt-0">{body}</dd>
            </div>
          ))}
        </dl>

        <GuideFaq faqs={FAQ_DATA} />

        <SoftenerGuidesNav current={SLUG} className="mt-14" />

        <GuideFooter reviewed="November 2026">
          Softener prices were read from each named source on {CHECKED_ON}.{" "}
        </GuideFooter>
      </div>
    </div>
  );
}
