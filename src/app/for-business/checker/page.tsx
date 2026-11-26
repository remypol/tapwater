import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { ChevronRight } from "lucide-react";
import { OG_IMAGE } from "@/lib/og";

export const revalidate = 86400;

const TITLE = "Hardness Checker for Your Site";
const DESCRIPTION =
  "A postcode box for your product pages: the customer sees how hard their water is, from the water company's own tests, and your product when it is hard. Free with a TapWater.uk link, or £99 a month in your own words.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://www.tapwater.uk/for-business/checker" },
  openGraph: { images: OG_IMAGE, title: `${TITLE} | TapWater.uk`, description: DESCRIPTION, url: "https://www.tapwater.uk/for-business/checker", type: "website" },
  twitter: { images: OG_IMAGE, card: "summary_large_image", title: `${TITLE} | TapWater.uk`, description: DESCRIPTION },
};

/**
 * The page every B2B email points at. Two live checkers, set up the way a shower
 * filter shop and a boiler installer would set them up, so a prospect sees their
 * own use before reading a word about plans. The snippet below them is the whole
 * integration.
 */
const DEMOS = [
  {
    who: "A shower filter shop",
    note: "Above 180 mg/L the shop's own product appears, in the shop's words.",
    attrs: {
      "data-tapwater-heading": "Is your water hard?",
      "data-tapwater-threshold": "180",
      "data-tapwater-hard-text": "At {mgl} mg/L, water in {area} is {label}. That is the scale on your shower screen and the dry feeling after a wash. Our filter head is made for water like this.",
      "data-tapwater-hard-link": "#snippet",
      "data-tapwater-hard-cta": "See the shower head",
      "data-tapwater-soft-text": "At {mgl} mg/L your water is {label}, so limescale is not your problem. Our chlorine filter still helps with dry skin.",
      "data-tapwater-accent": "#0e7490",
    },
  },
  {
    who: "A boiler installer",
    note: "Approved Document L asks for scale protection above 200 ppm. The checker says which side of the line the job is on.",
    attrs: {
      "data-tapwater-heading": "Does your new boiler need a scale reducer?",
      "data-tapwater-threshold": "200",
      "data-tapwater-hard-text": "Yes. At {mgl} mg/L, {district} is over the 200 ppm line in Approved Document L, so we fit a scale reducer with the boiler. It is already in your quote.",
      "data-tapwater-soft-text": "No. At {mgl} mg/L, {district} is under the 200 ppm line, so the regulations do not ask for one.",
      "data-tapwater-accent": "#b45309",
    },
  },
];

const SNIPPET = `<div data-tapwater-checker
     data-tapwater-threshold="180"
     data-tapwater-hard-text="At {mgl} mg/L your water is {label}. Our filter is made for it."
     data-tapwater-hard-link="https://your-shop.co.uk/shower-filter"
     data-tapwater-hard-cta="See the filter"></div>
<script src="https://www.tapwater.uk/widget.js" async></script>`;

const PLANS = [
  {
    name: "Free",
    price: "£0",
    lines: [
      "Unlimited checks on your site",
      "Your text, link and colour for hard and soft water",
      "A small “Hardness data: TapWater.uk” line under the result",
    ],
  },
  {
    name: "Checker",
    price: "£99",
    period: "a month",
    lines: [
      "Everything in Free, without the TapWater.uk line",
      "A monthly report: how many people checked, from which postcode areas, and how many were over your threshold",
      "Email support, and a hand setting your wording",
    ],
    highlight: true,
  },
  {
    name: "API",
    price: "from £199",
    period: "a month",
    lines: ["Hardness, water quality and supplier for any postcode as JSON, for your own checkout, CRM or quote tool"],
    href: "/for-business",
  },
];

export default function CheckerPage() {
  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-8 lg:py-14">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-faint">
        <Link href="/" className="hover:text-accent transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/for-business" className="hover:text-accent transition-colors">For business</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-ink font-medium">Hardness checker</span>
      </nav>

      <header className="mt-8 mb-12 max-w-3xl">
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-ink tracking-tight italic">
          A hardness checker for your product pages
        </h1>
        <p className="text-lg text-muted mt-5 leading-relaxed max-w-2xl">
          Your customer types a postcode and sees how hard their water is, from the water
          company&rsquo;s own tests. When it is hard, your product appears, in your words. Two
          lines of HTML, nothing to host.
        </p>
      </header>

      <section aria-labelledby="demo-heading" className="mb-14">
        <h2 id="demo-heading" className="font-display text-3xl text-ink italic">Try it as your customer would</h2>
        <p className="text-body mt-3 max-w-2xl leading-relaxed">
          Two live checkers, set up for two different businesses. Try RG1 (Reading, very hard), M1 (Manchester, soft) or your own postcode.
        </p>
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          {DEMOS.map((d) => (
            <div key={d.who}>
              <h3 className="font-semibold text-ink">{d.who}</h3>
              <p className="text-sm text-body leading-relaxed mt-1.5 mb-4 max-w-md">{d.note}</p>
              <div data-tapwater-checker="" {...d.attrs} />
            </div>
          ))}
        </div>
      </section>

      <section id="snippet" aria-labelledby="snippet-heading" className="mb-14 scroll-mt-24">
        <h2 id="snippet-heading" className="font-display text-3xl text-ink italic">The whole integration</h2>
        <p className="text-body mt-3 max-w-2xl leading-relaxed">
          Paste this where the checker should appear. <code className="font-data text-sm">{"{mgl}"}</code>,{" "}
          <code className="font-data text-sm">{"{label}"}</code>, <code className="font-data text-sm">{"{district}"}</code> and{" "}
          <code className="font-data text-sm">{"{area}"}</code> are filled in from the result. It takes your page&rsquo;s font, works on
          phones, and fires a <code className="font-data text-sm">tapwater:result</code> event you can send to your analytics.
        </p>
        <pre className="card mt-6 p-5 overflow-x-auto text-[13px] leading-relaxed font-data text-ink"><code>{SNIPPET}</code></pre>
      </section>

      <section aria-labelledby="data-heading" className="mb-14 max-w-3xl">
        <h2 id="data-heading" className="font-display text-3xl text-ink italic">Where the figure comes from</h2>
        <p className="text-body mt-3 leading-relaxed">
          Water companies test the water in every supply zone and publish the results. We match them to postcode districts:
          over 2,100 districts have a hardness figure, most of them the water company&rsquo;s own reading for that district. Where
          a district has no reading of its own, the checker says so and gives the figure for its postcode area. Every result
          links to a public page with the same numbers, so your customer can check it.{" "}
          <Link href="/about" className="text-ink underline underline-offset-2 decoration-rule hover:decoration-accent">How we collect the data</Link>
        </p>
      </section>

      <section aria-labelledby="plans-heading" className="mb-14">
        <h2 id="plans-heading" className="font-display text-3xl text-ink italic">What it costs</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.name} className={`card p-5 flex flex-col ${p.highlight ? "ring-1 ring-accent" : ""}`}>
              <p className="text-sm font-semibold text-ink">{p.name}</p>
              <p className="mt-2">
                <span className="font-data text-2xl font-bold text-ink">{p.price}</span>
                {p.period && <span className="text-sm text-muted ml-1.5">{p.period}</span>}
              </p>
              <ul className="mt-3 space-y-2 text-sm text-body leading-relaxed flex-1">
                {p.lines.map((l) => <li key={l}>{l}</li>)}
              </ul>
              {p.href && <Link href={p.href} className="mt-4 text-sm font-medium text-accent hover:underline underline-offset-2">About the API</Link>}
            </div>
          ))}
        </div>
        <p className="text-body mt-8 max-w-2xl leading-relaxed">
          The free version needs no sign-up: paste the snippet and it works. For the Checker plan, email{" "}
          <a href="mailto:hello@tapwater.uk?subject=Hardness%20checker" className="text-ink underline underline-offset-2 decoration-rule hover:decoration-accent">hello@tapwater.uk</a>{" "}
          with your site and we send your key the same day. The first month is free, no card.
        </p>
      </section>

      <Script src="/widget.js" strategy="afterInteractive" />
    </div>
  );
}
