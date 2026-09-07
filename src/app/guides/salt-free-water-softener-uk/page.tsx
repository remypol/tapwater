import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, Minus } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { SoftenerLeadForm } from "@/components/softener-lead-form";
import { SoftenerGuidesNav } from "@/components/softener-guides-nav";
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

export const revalidate = 86400;

const year = new Date().getFullYear();
const SLUG = "salt-free-water-softener-uk";
const URL = `https://www.tapwater.uk/guides/${SLUG}`;
const TITLE = `Salt-Free Water Softeners UK (${year}): Conditioners and Electronic Descalers, Honestly`;
const DESCRIPTION =
  "Do salt-free water softeners work? What conditioners and electronic descalers such as the Eddy actually do, why the evidence is thin, when they are worth a try, and when only a real softener will do.";

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
    question: "Do salt-free water softeners work?",
    answer:
      "Not as softeners. Nothing sold as salt-free removes calcium or magnesium: the water tests exactly as hard after the device as before. What they claim is to change how the minerals behave so that less scale sticks to surfaces. Some households report a difference, but independent, controlled evidence is limited and results vary widely between homes. If the goal is genuinely soft water, an ion exchange softener is the only technology that reliably delivers it.",
  },
  {
    question: "What is the difference between a water softener and a water conditioner?",
    answer:
      "A softener removes the hardness minerals by ion exchange and replaces them with a little sodium; the water lathers better, scale stops forming and the reading in mg/L falls. A conditioner leaves the minerals in the water and tries to stop them crystallising into hard scale, by a catalytic surface, a magnetic or electromagnetic field, or a dosed additive. The hardness reading does not change.",
  },
  {
    question: "Does the Eddy electronic water descaler work?",
    answer:
      "The Eddy wraps two coils around the incoming pipe and applies a changing electromagnetic field, which the maker says alters how calcium carbonate forms so that it stays suspended rather than sticking. It has a large number of positive reviews on Amazon UK and a money-back guarantee, and it removes nothing from the water. There is no independent certification and the controlled evidence for electronic descalers as a class is weak. Treat it as a low-cost experiment with a refund route, not as a softener.",
  },
  {
    question: "When is a salt-free device worth trying?",
    answer:
      "When a real softener is off the table: a flat or rental where you cannot cut into the mains or there is no drain, a home where nobody will carry salt, or a strong preference for keeping minerals in the drinking water. In those cases a conditioner or descaler costs little, fits in minutes and may reduce the scale you have to clean. Go in expecting modest, uncertain results rather than soft water.",
  },
  {
    question: "Is a scale inhibitor cartridge the same thing?",
    answer:
      "Related. Inline scale inhibitors dose a tiny amount of polyphosphate, or use a similar treatment, to hold minerals in suspension and are commonly fitted to protect a combi boiler. They work reasonably for that specific job, which is why boiler installers fit them, but they do not soften water, do not stop scale in kettles and showers, and the cartridge needs replacing.",
  },
  {
    question: "Are salt-free systems safer to drink from?",
    answer:
      "They add nothing, so there is no sodium question and no need for a separate hard-water tap. That is a genuine point in their favour for households that want to keep an unsoftened drinking supply simple. It does not make the water any better than it already was; UK tap water is safe to drink hard.",
  },
];

const ROWS: { feature: string; softener: boolean | string; conditioner: boolean | string; electronic: boolean | string }[] = [
  { feature: "Removes hardness minerals", softener: true, conditioner: false, electronic: false },
  { feature: "Water tests softer afterwards", softener: true, conditioner: false, electronic: false },
  { feature: "Stops new scale forming", softener: true, conditioner: "Reduces, variably", electronic: "Claimed, unproven" },
  { feature: "Removes existing scale", softener: "Gradually", conditioner: false, electronic: "Claimed, unproven" },
  { feature: "Better lather, softer feel", softener: true, conditioner: false, electronic: false },
  { feature: "Needs salt", softener: true, conditioner: false, electronic: false },
  { feature: "Needs a drain and plumbing", softener: true, conditioner: "Cartridge in line", electronic: false },
  { feature: "Adds sodium", softener: "A little", conditioner: false, electronic: false },
  { feature: "Independent evidence", softener: "Strong", conditioner: "Limited", electronic: "Weak" },
  { feature: "Typical cost", softener: "£1,000–£2,500 installed", conditioner: "Tens to low hundreds", electronic: "Low hundreds" },
];

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === "string") return <span className="text-sm text-ink">{value}</span>;
  return value ? (
    <Check className="w-4 h-4 text-safe mx-auto" aria-label="Yes" />
  ) : (
    <X className="w-4 h-4 text-warning mx-auto" aria-label="No" />
  );
}

export default function SaltFreeSoftenerGuide() {
  const eddy = getProductsByCategory("softener_salt").find((p) => p.id === "eddy-electronic-descaler");
  const test = getProductsByCategory("softener_salt").find((p) => p.id === "simplexhealth-hardness-tablets");

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          { name: "Salt-Free Water Softeners UK", url: URL },
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
        <GuideBreadcrumb title="Salt-Free Water Softeners UK" />
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Salt-free water softeners UK ({year})
        </h1>
        <GuideByline updated={`September ${year}`} />

        <p className="text-lg text-body leading-relaxed">
          &ldquo;Salt-free water softener&rdquo; is a contradiction the
          industry has learned to live with. The salt is not an inconvenience
          bolted onto softening; it is how softening works. Every device sold
          without it is doing something else, usually trying to stop the
          minerals it leaves in your water from turning into hard scale. Some of
          that is plausible, some of it is unproven, and it is worth knowing
          which before you spend money on a product you cannot test with a
          hardness kit.
        </p>

        <GeoCitation
          headline="According to TapWater.uk, no salt-free water softener sold in the UK removes hardness: conditioners and electronic descalers leave calcium and magnesium in the water and aim only to reduce how much scale sticks, with limited independent evidence."
          detail="An ion exchange softener remains the only home technology that measurably lowers hardness in mg/L."
        />

        <GuideDisclosure quotes />

        {/* ── Three things ───────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          Three things sold under one name
        </h2>
        <div className="space-y-6">
          <div className="border-l-2 border-rule pl-5">
            <h3 className="font-semibold text-ink text-lg">Ion exchange softener</h3>
            <p className="text-base text-body leading-relaxed mt-1">
              The real thing. Resin swaps calcium and magnesium for sodium,
              the hardness reading falls, scale stops forming, soap lathers. It
              needs salt, a drain and a hard-water tap for drinking. Covered in{" "}
              <Link href="/guides/best-water-softener-uk/" className="text-accent hover:underline">
                best water softener UK
              </Link>
              .
            </p>
          </div>
          <div className="border-l-2 border-rule pl-5">
            <h3 className="font-semibold text-ink text-lg">Conditioner or scale inhibitor</h3>
            <p className="text-base text-body leading-relaxed mt-1">
              An inline cartridge or catalytic unit that leaves the minerals in
              the water and encourages them to form soft crystals that wash
              through rather than hard scale that sticks. Polyphosphate
              inhibitors are routinely fitted to protect combi boilers and do
              a reasonable job of that one task. Whole-house claims are
              stronger than the independent evidence behind them.
            </p>
          </div>
          <div className="border-l-2 border-rule pl-5">
            <h3 className="font-semibold text-ink text-lg">Electronic or magnetic descaler</h3>
            <p className="text-base text-body leading-relaxed mt-1">
              Coils or magnets on the outside of the pipe, applying a field
              that is said to alter how calcium carbonate crystallises. Nothing
              touches the water. Cheap, fitted in minutes, and the category
              with the weakest controlled evidence. Plenty of satisfied
              reviewers; very little that would satisfy a lab.
            </p>
          </div>
        </div>

        {/* ── Table ───────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          What each one does and does not do
        </h2>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm border-collapse">
            <caption className="sr-only">Softener, conditioner and electronic descaler compared</caption>
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="py-2.5 pr-3 text-xs font-medium text-muted"> </th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted text-center">Softener</th>
                <th className="py-2.5 px-3 text-xs font-medium text-muted text-center">Conditioner</th>
                <th className="py-2.5 pl-3 text-xs font-medium text-muted text-center">Electronic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {ROWS.map((r) => (
                <tr key={r.feature}>
                  <td className="py-3 pr-3 font-medium text-ink align-top">{r.feature}</td>
                  <td className="py-3 px-3 text-center align-top"><Cell value={r.softener} /></td>
                  <td className="py-3 px-3 text-center align-top"><Cell value={r.conditioner} /></td>
                  <td className="py-3 pl-3 text-center align-top"><Cell value={r.electronic} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Evidence ───────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          About the evidence
        </h2>
        <p className="text-base text-body leading-relaxed">
          We would like to tell you that electronic descalers work, because
          they would solve the flat-with-no-drain problem neatly. We cannot.
          The mechanism proposed, that a field changes the crystal form of
          calcium carbonate so it stays suspended, has some laboratory support
          under specific conditions and very little reproducible evidence in
          real plumbing, where flow rates, temperatures and pipe materials vary
          hour by hour. Manufacturer trials tend to be small and uncontrolled;
          customer reviews are real but cannot separate the device from a
          change in habits, weather or water supply. No UK body certifies
          descalers for performance.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Conditioners sit a rung higher. Polyphosphate dosing has a known
          chemistry and is accepted by boiler manufacturers for protecting a
          heat exchanger. The leap from &ldquo;protects the boiler&rdquo; to
          &ldquo;whole-house scale control&rdquo; is where the marketing
          outruns the data.
        </p>

        {/* ── Eddy ───────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-2">
          The Eddy, as a low-cost experiment
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          The Eddy is the electronic descaler UK buyers most often ask about:
          two coils on the incoming pipe, a plug, no plumbing, and a large
          number of positive reviews on Amazon UK alongside a money-back
          guarantee. It does not soften water, and we are not going to tell
          you it does. If a softener is impossible in your home and you want
          to try the category, this is the sensible way to do it, with a
          refund route if nothing changes. Run a hardness test before and
          after so you know what did and did not happen.
        </p>
        <div className="space-y-4">
          {eddy && (
            <ProductCard
              product={eddy}
              pageType="salt-free-softener-guide"
              placement="guide-rail"
              highlight="Where a softener cannot be fitted"
            />
          )}
          {test && (
            <ProductCard
              product={test}
              pageType="salt-free-softener-guide"
              placement="guide-rail"
              highlight="Test before and after"
            />
          )}
        </div>

        {/* ── When to try, when not ───────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Try it, or skip straight to a softener
        </h2>
        <dl className="divide-y divide-rule border-y border-rule">
          {[
            [
              "Flat, rental, no drain, no cut into the mains",
              "Try a descaler or conditioner. Expectations low, refund route open, and a filter jug for the kettle.",
            ],
            [
              "You want soft water: lather, no scale, softer skin",
              "Only a softener does this. Salt-free will disappoint you.",
            ],
            [
              "Protecting a new combi boiler",
              "An inline scale inhibitor is standard practice and often required by the boiler warranty. Softener optional on top.",
            ],
            [
              "Hard water, own the house, have a drain",
              "Get softener quotes. The salt-free route costs less and may deliver nothing measurable.",
            ],
          ].map(([who, pick]) => (
            <div key={who} className="py-4 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6">
              <dt className="text-base font-medium text-ink">{who}</dt>
              <dd className="text-base text-body leading-relaxed mt-1 sm:mt-0">{pick}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10">
          <SoftenerLeadForm
            hardnessValue={220}
            hardnessLabel="hard"
            source="softener_guide"
            heading="If a real softener is possible, price one"
            intro="Installed softeners typically run £1,000 to £2,500 and are the only proven fix. Request free quotes from installers covering your postcode before settling for a device that may not work."
          />
        </div>

        <p className="text-base text-body leading-relaxed mt-8">
          Not sure your water is hard enough to justify any of this?{" "}
          <Link href="/guides/do-i-need-a-water-softener/" className="text-accent hover:underline">
            Check the bands and your postcode first
          </Link>
          .
        </p>

        <GuideFaq faqs={FAQ_DATA} />

        <SoftenerGuidesNav current={SLUG} className="mt-14" />

        <GuideFooter reviewed={`September ${year}`}>
          We describe the Eddy as an experiment because no independent body certifies
          electronic descalers and controlled evidence for the category is weak.{" "}
        </GuideFooter>
      </div>
    </div>
  );
}
