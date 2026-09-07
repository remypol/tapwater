import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
import { HardnessBands } from "@/components/hardness-bands";
import { SoftenerLeadForm } from "@/components/softener-lead-form";
import { SoftenerGuidesNav } from "@/components/softener-guides-nav";
import { ArticleSchema, BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { GeoCitation } from "@/components/geo-citation";
import {
  GuideBreadcrumb,
  GuideByline,
  GuideFaq,
  GuideFooter,
} from "@/components/guide-chrome";
import { HARDNESS_BANDS } from "@/lib/softener-guides";
import { OG_IMAGE } from "@/lib/og";

export const revalidate = 86400;

const year = new Date().getFullYear();
const SLUG = "do-i-need-a-water-softener";
const URL = `https://www.tapwater.uk/guides/${SLUG}`;
const TITLE = `Do I Need a Water Softener? Check Your Postcode (${year})`;
const DESCRIPTION =
  "Whether you need a water softener depends on one number: your water hardness in mg/L. The bands explained, the symptoms to look for, when the answer is no, and a postcode check for your own reading.";

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
    question: "Do I need a water softener?",
    answer:
      "If your water is 200 mg/L calcium carbonate or above, a softener will stop limescale forming in your boiler, kettle, shower and appliances and usually pays for itself over its life. Between 120 and 200 it is a judgement call: you will see scale, but descaling may be enough. Below 120 you do not need one. Check your postcode on TapWater.uk to see the reading your water company reports for your supply zone.",
  },
  {
    question: "What hardness level needs a water softener?",
    answer:
      "Water companies class water above 200 mg/L as very hard, and that is the level at which installers and most independent advice say a softener is worth it. Much of London, the South East, East Anglia and the Midlands is above 250 mg/L, and parts of the Thames Valley and Cambridgeshire are above 300. Most of Scotland, Wales and north-west England is under 100 and does not need one.",
  },
  {
    question: "What are the signs of hard water in a house?",
    answer:
      "White crust on taps and shower screens, a scaled kettle element, cloudy glasses from the dishwasher, soap that will not lather and leaves a film, stiff towels, a shower head that needs vinegar every few months, and a boiler that gets noisier or less efficient over the years. Dry skin and dull hair are often blamed on hardness too, though chlorine plays a part.",
  },
  {
    question: "Is hard water bad for you?",
    answer:
      "No. Hard water is safe to drink and the calcium and magnesium in it are minerals your body uses. The downside of hard water is entirely about your home: scale, appliance life, energy use and cleaning. That is also why the Drinking Water Inspectorate advises keeping an unsoftened tap for drinking and cooking after a softener is fitted.",
  },
  {
    question: "Can a filter fix hard water instead?",
    answer:
      "Not a normal one. Jug, tap and under-sink filters remove chlorine and some contaminants but leave hardness minerals in the water. Reverse osmosis removes hardness, but only at one drinking tap, so it does nothing for the boiler or the shower. For whole-house scale the answer is a softener; for a single soft drinking tap, reverse osmosis.",
  },
  {
    question: "I rent. Can I do anything?",
    answer:
      "A softener needs a cut into the mains and a drain, which a landlord may not agree to and you would leave behind. Practical alternatives are a filter jug for the kettle, a shower filter for skin and hair, regular descaling, and, if you want to experiment, an electronic descaler with a refund guarantee. Read our salt-free guide for an honest view of what those do.",
  },
];

const SYMPTOMS: { sign: string; meaning: string }[] = [
  { sign: "White crust on taps, shower screens and around the sink", meaning: "Scale deposited where water evaporates. The classic sign; visible from about 150 mg/L." },
  { sign: "A furred kettle element within weeks of descaling", meaning: "Heat drives carbonate out of solution. Fast furring means very hard water, usually 250 mg/L and up." },
  { sign: "Soap that will not lather and leaves a film", meaning: "Calcium reacts with soap to form scum rather than foam. You are using more of every product." },
  { sign: "Cloudy glasses and a chalky dishwasher", meaning: "Scale on glass and on the machine's element. The rinse-aid setting is fighting your water." },
  { sign: "Shower head that needs vinegar every few months", meaning: "Scale closing the nozzles. Expect the same inside the pipes you cannot see." },
  { sign: "A boiler that has grown noisier, or a repair bill for the heat exchanger", meaning: "The expensive symptom. Scale insulates the element and the boiler works harder for the same hot water." },
  { sign: "Stiff towels and dull, tangled hair", meaning: "Minerals left in the fibres. Often blamed on the washing powder; the water is the problem." },
];

export default function DoINeedASoftenerGuide() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          { name: "Do I Need a Water Softener?", url: URL },
        ]}
      />
      <ArticleSchema
        headline={TITLE}
        description={DESCRIPTION}
        url={URL}
        datePublished="2026-09-07"
        dateModified={new Date().toISOString().split("T")[0]}
        authorName="TapWater.uk Research"
        authorUrl="https://www.tapwater.uk/about"
      />
      <FAQSchema faqs={FAQ_DATA} />

      <div className="max-w-3xl mx-auto">
        <GuideBreadcrumb title="Do I Need a Water Softener?" />
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Do I need a water softener?
        </h1>
        <GuideByline updated={`September ${year}`} />

        <p className="text-lg text-body leading-relaxed">
          It comes down to one number that your water company already
          publishes: the hardness of the water at your address, in milligrams
          of calcium carbonate per litre. Above 200, a softener is a sound
          purchase for almost any home that owns its plumbing. Below 120, it is
          money spent on a problem you do not have. In between, your kettle and
          your patience decide. Here is how to read the number, and how to get
          yours.
        </p>

        <GeoCitation
          headline={`According to TapWater.uk's analysis of 2,800 UK postcode districts, more than half of England has water above 200 mg/L, the level at which a water softener is worth installing; most of Scotland, Wales and north-west England is under 100 mg/L and needs none.`}
          detail="Hardness is reported by water companies per supply zone and varies street by street where zones meet."
        />

        {/* ── Postcode check ─────────────────────────────────────── */}
        <div className="card-elevated p-8 text-center rounded-2xl mt-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center">
              <Search className="w-6 h-6 text-accent" aria-hidden="true" />
            </div>
          </div>
          <h2 className="font-display text-xl italic text-ink">
            Get the number for your postcode
          </h2>
          <p className="text-base text-muted mt-2 max-w-md mx-auto">
            We show the hardness your water company reports for your supply
            zone, and whether it crosses the softener line.
          </p>
          <div className="mt-6 max-w-sm mx-auto">
            <PostcodeSearch />
          </div>
        </div>

        {/* ── Bands ──────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Reading the number
        </h2>
        <HardnessBands />
        <dl className="divide-y divide-rule border-y border-rule">
          {HARDNESS_BANDS.map((band) => {
            const advice: Record<string, string> = {
              Soft: "No softener. Scale is not a feature of your life. Enjoy the lather.",
              "Moderately soft": "No softener. You may see a faint ring in the kettle after a year.",
              "Slightly hard": "Probably not. Descale the kettle and shower head twice a year and you are done.",
              Hard: "A judgement call. Scale is visible and a softener will help, but the payback is slow. Consider one if the boiler is new and you plan to stay.",
              "Very hard": "Yes, if you own the house and have a drain. This is where scale costs real money in boiler efficiency, appliance life and cleaning, and a softener pays for itself.",
            };
            return (
              <div key={band.label} className="py-4 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6">
                <dt>
                  <span className="block text-base font-medium text-ink">{band.label}</span>
                  <span className="block font-mono text-xs text-muted mt-0.5">
                    {band.from}–{band.to === 400 ? "400+" : band.to} mg/L
                  </span>
                </dt>
                <dd className="text-base text-body leading-relaxed mt-1 sm:mt-0">{advice[band.label]}</dd>
              </div>
            );
          })}
        </dl>
        <p className="text-sm text-muted mt-4">
          Some water companies report in Clark degrees or French degrees
          instead. One Clark degree is about 14.3 mg/L, one French degree is
          10 mg/L; 200 mg/L is roughly 14 Clark or 20 French.
        </p>

        {/* ── Symptoms ───────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          What hard water looks like in a house
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          If you have not looked up the number, the house has probably already
          told you. Count how many of these you recognise.
        </p>
        <ul className="border-t border-rule">
          {SYMPTOMS.map((s) => (
            <li key={s.sign} className="border-b border-rule py-4">
              <p className="text-base font-medium text-ink">{s.sign}</p>
              <p className="text-sm text-body leading-relaxed mt-1">{s.meaning}</p>
            </li>
          ))}
        </ul>
        <p className="text-base text-body leading-relaxed mt-6">
          Three or more, and you are almost certainly above 200 mg/L. One or
          two could be moderate water, an old kettle, or the chlorine that
          every UK supply carries. For skin and hair specifically, a{" "}
          <Link href="/guides/best-shower-filter-uk/" className="text-accent hover:underline">
            shower filter
          </Link>{" "}
          addresses the chlorine half of the problem without touching the
          plumbing.
        </p>

        {/* ── When no ────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          When the answer is no
        </h2>
        <ul className="space-y-3 text-base text-body">
          <li className="pl-5 border-l-2 border-rule">
            <strong className="text-ink">Your water is under 120 mg/L.</strong>{" "}
            There is no scale to prevent. Most of Scotland, Wales, Cornwall,
            the Lake District and the Pennines live here.
          </li>
          <li className="pl-5 border-l-2 border-rule">
            <strong className="text-ink">You rent, or cannot get to the mains and a drain.</strong>{" "}
            A softener is a permanent installation. See the{" "}
            <Link href="/guides/salt-free-water-softener-uk/" className="text-accent hover:underline">
              salt-free guide
            </Link>{" "}
            for what is realistic instead.
          </li>
          <li className="pl-5 border-l-2 border-rule">
            <strong className="text-ink">Your only complaint is the taste of the drinking water.</strong>{" "}
            Hardness is not a taste problem; chlorine usually is. A{" "}
            <Link href="/guides/best-water-filter-jug-uk/" className="text-accent hover:underline">
              filter jug
            </Link>{" "}
            is the answer, not a softener.
          </li>
          <li className="pl-5 border-l-2 border-rule">
            <strong className="text-ink">You are moving within a year or two.</strong>{" "}
            The payback runs over several years. Descale and leave the decision
            to the next owner.
          </li>
        </ul>

        {/* ── When yes ───────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          When the answer is yes
        </h2>
        <p className="text-base text-body leading-relaxed">
          You own the house, the water is 200 mg/L or more, there is a drain
          within reach of the stop tap, and you are staying. That describes a
          great many homes across the South East, East Anglia and the
          Midlands, and for them the question is not whether but which. The
          next steps are{" "}
          <Link href="/guides/best-water-softener-uk/" className="text-accent hover:underline">
            which softener
          </Link>
          ,{" "}
          <Link href="/guides/water-softener-cost-uk/" className="text-accent hover:underline">
            what it costs
          </Link>{" "}
          and{" "}
          <Link href="/guides/water-softener-installation-uk/" className="text-accent hover:underline">
            how it is fitted
          </Link>
          . Or skip the reading and ask installers to come and size one.
        </p>

        <div className="mt-8">
          <SoftenerLeadForm
            hardnessValue={220}
            hardnessLabel="hard"
            source="softener_guide"
            heading="Above 200 mg/L? Get quotes"
            intro="Softeners are priced by survey. Request free quotes from installers covering your postcode, and compare two before you commit."
          />
        </div>

        <GuideFaq faqs={FAQ_DATA} />

        <SoftenerGuidesNav current={SLUG} className="mt-14" />

        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">Related</h2>
        <ul className="space-y-2">
          {[
            ["/hardness/", "Water hardness checker by postcode"],
            ["/guides/water-hardness-map/", "UK water hardness map by region"],
            ["/guides/water-and-eczema/", "Water and eczema"],
          ].map(([href, label]) => (
            <li key={href}>
              <Link href={href} className="text-sm text-accent hover:underline">
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <GuideFooter reviewed={`September ${year}`} />
      </div>
    </div>
  );
}
