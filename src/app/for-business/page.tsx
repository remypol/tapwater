import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BusinessEnquiryForm } from "@/components/business-enquiry-form";
import { FAQSchema } from "@/components/json-ld";
import { getTrustMetrics } from "@/lib/data";
import { OG_IMAGE } from "@/lib/og";

export const revalidate = 86400;

const TITLE = "Water Data for Business";
const DESCRIPTION =
  "Address-level UK water reports over an API: quality score, hardness, flagged readings, PFAS and live incidents for any postcode. Built for property portals, letting agents, conveyancers and home-buyer reports.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { images: OG_IMAGE, title: `${TITLE} | TapWater.uk`, description: DESCRIPTION, url: "https://www.tapwater.uk/for-business", type: "website" },
  twitter: { images: OG_IMAGE, card: "summary_large_image", title: `${TITLE} | TapWater.uk`, description: DESCRIPTION },
};

const SAMPLE = `{
  "postcode": "LU5 2AB",
  "district": "LU5",
  "areaName": "Central Bedfordshire",
  "supplier": { "name": "Thames Water", "id": "thames-water" },
  "score": 8.4,
  "grade": "good",
  "hardness": { "mgPerLitre": 289, "label": "very hard", "estimated": false },
  "contaminants": {
    "tested": 23,
    "flagged": 1,
    "flaggedReadings": [
      { "name": "Nitrite", "value": 0.67, "unit": "mg/L", "ukLimit": 0.5, "status": "fail" }
    ]
  },
  "pfas": { "inTapWaterTests": null, "nearbyMonitoring": null },
  "incidents": [],
  "provenance": {
    "dataSource": "stream",
    "sampleCount": 73,
    "lastSampleDate": "2025-12-31",
    "reportUrl": "https://www.tapwater.uk/postcode/LU5"
  }
}`;

const USE_CASES = [
  {
    who: "Property portals and letting agents",
    what: "A water line on every listing: hardness, score and supplier next to the EPC. Tenants ask about limescale and drinking water; the answer is one field.",
  },
  {
    who: "Conveyancers and home-buyer reports",
    what: "A water section in the report pack, from the same public tests the water company files, with a link the buyer can check themselves.",
  },
  {
    who: "Water treatment installers and filter brands",
    what: "Qualify a lead before the survey. Hardness and flagged readings for the customer's postcode, in your CRM, at the moment they enquire.",
  },
  {
    who: "Insurers, boiler cover and appliance brands",
    what: "Scale risk by address. Very hard water shortens boiler and appliance life measurably; price and advise accordingly.",
  },
];

const PLANS = [
  { name: "Pilot", price: "Free", period: "90 days", lookups: "1,000 lookups a month", detail: "Full report API. Attribution required. For evaluating against your own addresses.", cta: "Start with this" },
  { name: "Starter", price: "£99", period: "a month", lookups: "5,000 lookups a month", detail: "Report API and embeddable widget. Email support. Attribution optional." },
  { name: "Growth", price: "£249", period: "a month", lookups: "50,000 lookups a month", detail: "Everything in Starter, plus a monthly bulk CSV of every district for offline use." },
  { name: "Enterprise", price: "Custom", period: "", lookups: "Unlimited", detail: "Bulk delivery, custom fields, uptime commitment, invoicing. For portals and report providers at scale." },
];

const FAQS = [
  { question: "Where does the data come from?", answer: "Drinking-water test results that water companies publish through the Stream Water Data Portal, Environment Agency river and groundwater monitoring, and water company incident feeds. Every report carries its source, sample count and last sample date, and links to a public page showing the same figures." },
  { question: "How much of the UK is covered?", answer: "Scored reports exist for over 2,200 postcode districts, which is most of England, Wales and Northern Ireland. Hardness readings cover around 1,000 districts, with a postcode-area estimate for the rest and a flag telling you which is which." },
  { question: "How often is it updated?", answer: "Test results refresh as water companies publish them, typically monthly. Incidents refresh every fifteen minutes. PFAS monitoring refreshes weekly." },
  { question: "Is this address-level or postcode-level?", answer: "Reports are per postcode district, the outward half of the postcode, which is the level at which water companies report supply zones. Send a full postcode and we resolve it for you." },
  { question: "Do I have to credit TapWater.uk?", answer: "On the free pilot, yes: a 'Data: TapWater.uk' line with a link. On paid plans attribution is optional." },
];

export default async function ForBusinessPage() {
  const metrics = await getTrustMetrics();
  const districts = metrics.find((m) => m.label === "Areas covered")?.value ?? "2,200+";

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-8 lg:py-14">
      <FAQSchema faqs={FAQS} />

      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-faint">
        <Link href="/" className="hover:text-accent transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-ink font-medium">For business</span>
      </nav>

      <header className="mt-8 mb-14 max-w-3xl">
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-ink tracking-tight italic">
          Water data for every UK address
        </h1>
        <p className="text-lg text-muted mt-5 leading-relaxed max-w-2xl">
          The report behind {districts} postcode pages on this site, as JSON. Quality score,
          hardness, flagged readings, PFAS and live incidents for any postcode, from the same
          published tests the water companies file. One call per address.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="#pilot" className="inline-flex items-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover transition-colors">
            Request a pilot key
          </a>
          <a href="#report" className="inline-flex items-center rounded-lg border border-rule px-5 py-2.5 text-sm font-medium text-ink hover:border-accent transition-colors">
            See a report
          </a>
        </div>
      </header>

      <section className="mb-14" aria-labelledby="who-heading">
        <h2 id="who-heading" className="font-display text-3xl text-ink italic">Who it is for</h2>
        <div className="mt-6 grid gap-x-10 gap-y-7 sm:grid-cols-2">
          {USE_CASES.map((u) => (
            <div key={u.who} className="border-t border-rule-strong pt-4">
              <h3 className="font-semibold text-ink">{u.who}</h3>
              <p className="text-sm text-body leading-relaxed mt-2 max-w-md">{u.what}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="report" className="mb-14 scroll-mt-24" aria-labelledby="report-heading">
        <h2 id="report-heading" className="font-display text-3xl text-ink italic">What a report looks like</h2>
        <p className="text-body mt-3 max-w-2xl leading-relaxed">
          A real response for a Bedfordshire postcode. Every number on it also appears on the
          public page at{" "}
          <Link href="/postcode/LU5" className="text-ink underline underline-offset-2 decoration-rule hover:decoration-accent">tapwater.uk/postcode/LU5</Link>,
          so your users, and you, can check it.
        </p>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <pre className="card p-5 overflow-x-auto text-[13px] leading-relaxed font-data text-ink"><code>{SAMPLE}</code></pre>
          <div className="text-sm text-body leading-relaxed space-y-4">
            <div>
              <p className="font-semibold text-ink">The call</p>
              <pre className="mt-1.5 overflow-x-auto rounded-lg bg-accent-light px-3 py-2 font-data text-xs text-ink">{`GET /api/v1/report?postcode=LU5 2AB
x-api-key: tw_live_…`}</pre>
            </div>
            <div>
              <p className="font-semibold text-ink">Also in the response</p>
              <p className="mt-1.5">PFAS found in tap-water tests and in river and groundwater monitoring within 10 km. Any live supply incident affecting the district. Sample count, date range and source, so you can show provenance.</p>
            </div>
            <div>
              <p className="font-semibold text-ink">Quota headers</p>
              <p className="mt-1.5">Every response carries your monthly limit and what is left. No surprise invoices.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-14" aria-labelledby="pricing-heading">
        <h2 id="pricing-heading" className="font-display text-3xl text-ink italic">Pricing</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => (
            <div key={p.name} className={`card p-5 flex flex-col ${p.cta ? "ring-1 ring-accent" : ""}`}>
              <p className="text-sm font-semibold text-ink">{p.name}</p>
              <p className="mt-2">
                <span className="font-data text-2xl font-bold text-ink">{p.price}</span>
                {p.period && <span className="text-sm text-muted ml-1.5">{p.period}</span>}
              </p>
              <p className="text-sm text-ink mt-3">{p.lookups}</p>
              <p className="text-sm text-body leading-relaxed mt-2 flex-1">{p.detail}</p>
              {p.cta && <a href="#pilot" className="mt-4 text-sm font-medium text-accent hover:underline underline-offset-2">{p.cta}</a>}
            </div>
          ))}
        </div>
        <p className="text-sm text-muted mt-4 max-w-2xl">
          A lookup is one successful report. Errors and repeated lookups of the same postcode within a day are not counted. The{" "}
          <Link href="/widget" className="text-ink underline underline-offset-2 decoration-rule hover:decoration-accent">embeddable widget</Link>{" "}
          stays free for any site that keeps the attribution link.
        </p>
      </section>

      <section className="mb-14" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="font-display text-3xl text-ink italic">Questions</h2>
        <dl className="mt-6 grid gap-6 sm:grid-cols-2">
          {FAQS.map((f) => (
            <div key={f.question}>
              <dt className="font-semibold text-ink">{f.question}</dt>
              <dd className="text-sm text-body leading-relaxed mt-1.5">{f.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="pilot" className="mb-10 scroll-mt-24 max-w-2xl" aria-labelledby="pilot-heading">
        <h2 id="pilot-heading" className="font-display text-3xl text-ink italic">Request a pilot key</h2>
        <p className="text-body mt-3 leading-relaxed">
          Ninety days, a thousand lookups a month, no card. Tell us what you are building and we
          send a key within one working day. Or email{" "}
          <a href="mailto:hello@tapwater.uk" className="text-ink underline underline-offset-2 decoration-rule hover:decoration-accent">hello@tapwater.uk</a>.
        </p>
        <div className="mt-6">
          <BusinessEnquiryForm />
        </div>
      </section>
    </div>
  );
}
