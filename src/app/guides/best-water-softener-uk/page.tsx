import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search, Check, X } from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
import { ArticleSchema, BreadcrumbSchema, FAQSchema } from "@/components/json-ld";

export const revalidate = 86400;

const year = new Date().getFullYear();

const FAQ_DATA = [
  {
    question: "Do I need a water softener in the UK?",
    answer:
      "Around 60% of England has hard or very hard water — above 200 mg/L calcium carbonate. If your area exceeds that threshold you will see limescale on taps, inside your kettle, and on heating elements. A water softener removes the calcium and magnesium that cause this. The South East, London, East Anglia, and the East Midlands are the worst-affected regions. You can check your postcode on TapWater.uk to see your exact hardness level.",
  },
  {
    question: "How much does a water softener cost?",
    answer:
      "A quality salt-based water softener costs between £400 and £1,500 for the unit itself. Professional installation adds £150 to £300, depending on your plumbing. Annual running costs are roughly £50 to £100 for salt and minimal electricity. Most households see a payback within 2 to 4 years through reduced limescale damage, lower boiler maintenance, and savings on cleaning products.",
  },
  {
    question: "Salt-based vs salt-free — which is better?",
    answer:
      "Salt-based softeners use ion exchange to genuinely remove calcium and magnesium from your water. This stops limescale forming entirely. Salt-free conditioners do not remove minerals — they alter them so they are less likely to form scale, but results are inconsistent and they do nothing for existing buildup. If you want truly soft water, a salt-based system is the only proven option. Salt-free may be worth considering if you cannot have a drain connection or want to keep the minerals in your water.",
  },
  {
    question: "Is softened water safe to drink?",
    answer:
      "Softened water is safe for most adults. The ion exchange process replaces calcium and magnesium with a small amount of sodium, which is well within safe limits for most people. However, the Drinking Water Inspectorate (DWI) recommends keeping an unsoftened tap for drinking and cooking — especially for making up baby formula, as infants should not consume water with added sodium. Most installers fit a bypass on the kitchen cold tap as standard.",
  },
];

export function generateMetadata(): Metadata {
  return {
    title: `Best Water Softener UK (${year})`,
    description:
      "Compare water softeners for UK homes. Salt vs salt-free, costs, and which areas need one most.",
    alternates: {
      canonical: "https://www.tapwater.uk/guides/best-water-softener-uk",
    },
    openGraph: {
      title: `Best Water Softener UK (${year})`,
      description:
        "Compare water softeners for UK homes. Salt vs salt-free, costs, and which areas need one most.",
      url: "https://www.tapwater.uk/guides/best-water-softener-uk",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `Best Water Softener UK (${year})`,
      description:
        "Compare water softeners for UK homes. Salt vs salt-free, costs, and which areas need one most.",
    },
  };
}

/* ── Comparison data ────────────────────────────────────────────────── */

const COMPARISON = [
  {
    feature: "Removes minerals",
    saltBased: true,
    saltFree: false,
  },
  {
    feature: "Prevents new limescale",
    saltBased: true,
    saltFree: true,
  },
  {
    feature: "Removes existing limescale",
    saltBased: true,
    saltFree: false,
  },
  {
    feature: "Requires salt top-ups",
    saltBased: true,
    saltFree: false,
  },
  {
    feature: "Needs drain connection",
    saltBased: true,
    saltFree: false,
  },
  {
    feature: "Adds sodium to water",
    saltBased: true,
    saltFree: false,
  },
  {
    feature: "Typical unit cost",
    saltBased: "£400–£1,500",
    saltFree: "£300–£800",
  },
  {
    feature: "Annual running cost",
    saltBased: "£50–£100",
    saltFree: "£0–£20",
  },
];

/* ── Page ────────────────────────────────────────────────────────────── */

export default function BestWaterSoftenerGuide() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* ── Schema markup ────────────────────────────────────────────── */}
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          {
            name: "Best Water Softener UK",
            url: "https://www.tapwater.uk/guides/best-water-softener-uk",
          },
        ]}
      />
      <ArticleSchema
        headline={`Best Water Softener UK (${year})`}
        description="Compare water softeners for UK homes. Salt vs salt-free, costs, and which areas need one most."
        url="https://www.tapwater.uk/guides/best-water-softener-uk"
        datePublished="2026-04-07"
        dateModified={new Date().toISOString().split("T")[0]}
        authorName="Remy"
        authorUrl="https://www.tapwater.uk/about"
      />
      <FAQSchema faqs={FAQ_DATA} />

      <div className="max-w-3xl mx-auto">
        {/* ── Breadcrumb nav ───────────────────────────────────────── */}
        <nav className="text-sm text-muted mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-accent transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href="/guides"
                className="hover:text-accent transition-colors"
              >
                Guides
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-ink" aria-current="page">
              Best Water Softener UK
            </li>
          </ol>
        </nav>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Best Water Softener UK ({year})
        </h1>
        <div className="flex items-center gap-2 mt-3 mb-8 text-sm text-muted">
          <span>
            By <span className="text-ink font-medium">Remy</span>
          </span>
          <span>&middot;</span>
          <span>Updated April {year}</span>
        </div>

        {/* ── GEO summary callout ──────────────────────────────────── */}
        <div className="card p-6 mb-10">
          <p className="text-base text-body leading-relaxed">
            <strong className="text-ink">
              Over 60% of England has hard water above 200&nbsp;mg/L.
            </strong>{" "}
            Limescale damages boilers, blocks shower heads, and shortens the
            lifespan of every appliance that heats water. A water softener is the
            only way to genuinely remove the minerals that cause it. This guide
            covers how softeners work, what they cost, and whether your area
            actually needs one.
          </p>
        </div>

        {/* ── Do you need a water softener? ─────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          Do you need a water softener?
        </h2>
        <p className="text-base text-body leading-relaxed">
          Not everyone does. Soft water areas &mdash; most of Scotland, Wales,
          and the North West of England &mdash; have naturally low mineral
          levels and no limescale problem. But if you live in a hard water area
          (roughly 200&nbsp;mg/L or above), you will recognise the signs: white
          crusty deposits on taps and showerheads, a film on tea and coffee,
          and a boiler that gets less efficient every year.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Enter your postcode below to check your water hardness. If your area
          reports above 200&nbsp;mg/L calcium carbonate, a softener is worth
          serious consideration.
        </p>

        <div className="mt-8 card-elevated p-8 text-center rounded-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="font-display text-xl italic text-ink">
            Check your water hardness
          </h3>
          <p className="text-base text-muted mt-2 max-w-md mx-auto">
            Enter your postcode. We will show you the hardness level in your
            area and whether a water softener would make a difference.
          </p>
          <div className="mt-6 max-w-sm mx-auto">
            <PostcodeSearch />
          </div>
        </div>

        {/* ── How water softeners work ──────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          How water softeners work
        </h2>
        <p className="text-base text-body leading-relaxed">
          Most domestic water softeners use a process called{" "}
          <strong className="text-ink">ion exchange</strong>. Inside the unit
          is a cylinder filled with resin beads that carry a negative charge.
          As hard water flows through, the calcium and magnesium ions (which
          carry a positive charge) are attracted to the resin and swap places
          with sodium ions. The result is genuinely soft water with the
          hardness minerals completely removed.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Periodically the unit regenerates &mdash; it flushes the resin with
          a salt (sodium chloride) solution to recharge the beads. This
          happens automatically, usually at night, and uses a small amount of
          water and salt. Modern units are metered, so they only regenerate
          when needed based on your actual water usage.
        </p>

        {/* ── Salt-based vs salt-free ───────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Salt-based vs salt-free
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          This is the most important decision. Salt-based softeners use ion
          exchange to genuinely remove hardness minerals. Salt-free systems
          (sometimes called &ldquo;conditioners&rdquo; or &ldquo;descalers&rdquo;)
          use template-assisted crystallisation or electromagnetic fields to
          alter the minerals so they are less likely to form scale. They do
          not actually remove anything.
        </p>

        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-wash text-left">
                <th className="py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-muted">
                  Feature
                </th>
                <th className="py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-muted text-center">
                  Salt-based
                </th>
                <th className="py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-muted text-center">
                  Salt-free
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {COMPARISON.map((row) => (
                <tr key={row.feature}>
                  <td className="py-2.5 px-3 font-medium text-ink whitespace-nowrap">
                    {row.feature}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {typeof row.saltBased === "boolean" ? (
                      row.saltBased ? (
                        <Check className="w-4 h-4 text-safe mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-warning mx-auto" />
                      )
                    ) : (
                      <span className="font-data text-ink">{row.saltBased}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {typeof row.saltFree === "boolean" ? (
                      row.saltFree ? (
                        <Check className="w-4 h-4 text-safe mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-warning mx-auto" />
                      )
                    ) : (
                      <span className="font-data text-ink">{row.saltFree}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── What does a water softener cost? ──────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          What does a water softener cost?
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          The total cost of ownership depends on three things: the unit, the
          installation, and the ongoing salt supply. Here is what to budget:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5 text-center">
            <p className="text-[10px] text-faint uppercase tracking-wider">
              Unit cost
            </p>
            <p className="font-data text-2xl font-bold text-ink mt-1">
              &pound;400&ndash;&pound;1,500
            </p>
            <p className="text-sm text-muted mt-1">
              Depends on capacity and brand
            </p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-[10px] text-faint uppercase tracking-wider">
              Installation
            </p>
            <p className="font-data text-2xl font-bold text-ink mt-1">
              &pound;150&ndash;&pound;300
            </p>
            <p className="text-sm text-muted mt-1">
              Professional plumbing required
            </p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-[10px] text-faint uppercase tracking-wider">
              Annual running
            </p>
            <p className="font-data text-2xl font-bold text-ink mt-1">
              &pound;50&ndash;&pound;100
            </p>
            <p className="text-sm text-muted mt-1">
              Salt and minimal electricity
            </p>
          </div>
        </div>

        <p className="text-base text-body leading-relaxed mt-6">
          Most households recoup the investment within 2 to 4 years. Soft
          water means less limescale damage to your boiler and appliances,
          lower energy bills (even 1&nbsp;mm of limescale on a heating element
          increases energy use by around 7%), and significant savings on
          cleaning products and detergents.
        </p>

        {/* ── Get free quotes ───────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Get free quotes from vetted UK installers
        </h2>
        <p className="text-base text-body leading-relaxed">
          We work with a network of vetted water softener installers across
          England. Enter your postcode on your{" "}
          <Link href="/hardness" className="text-accent hover:underline">
            local water hardness page
          </Link>{" "}
          to check whether your area is hard enough to warrant a softener. If
          it is, you can request free, no-obligation quotes from approved
          installers in your area. We only partner with companies that are
          properly accredited, insured, and reviewed.
        </p>

        {/* ── UK areas with the hardest water ───────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          UK areas with the hardest water
        </h2>
        <p className="text-base text-body leading-relaxed">
          The hardest water in the UK is concentrated in the South East,
          London, and East of England. These regions regularly exceed
          300&nbsp;mg/L calcium carbonate &mdash; well into the &ldquo;very
          hard&rdquo; category. Towns like Ipswich, Cambridge, Canterbury,
          and much of the Thames Valley often see readings above
          350&nbsp;mg/L. By contrast, most of Scotland, Wales, and the Lake
          District enjoy naturally soft water below 100&nbsp;mg/L.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          Check the{" "}
          <Link href="/hardness" className="text-accent hover:underline">
            UK water hardness map
          </Link>{" "}
          to see exactly where your area falls, or view the{" "}
          <Link href="/rankings" className="text-accent hover:underline">
            postcode rankings
          </Link>{" "}
          to compare regions side by side.
        </p>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-6">
          Frequently asked questions
        </h2>
        <div className="space-y-6">
          {FAQ_DATA.map((faq) => (
            <div key={faq.question}>
              <h3 className="font-semibold text-ink text-base">{faq.question}</h3>
              <p className="text-sm text-body leading-relaxed mt-2">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        {/* ── Related guides ──────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Related guides
        </h2>
        <div className="space-y-2">
          <Link
            href="/guides/water-hardness-map"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            UK water hardness map
          </Link>
          <Link
            href="/guides/best-water-filters-uk"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Best water filters UK (all categories)
          </Link>
          <Link
            href="/guides/best-whole-house-water-filter-uk"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Best whole house water filter UK
          </Link>
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <footer className="mt-12 pb-4 text-sm text-faint leading-relaxed border-t border-rule pt-6">
          <p>
            Guide last reviewed April {year}. Prices are approximate and may
            vary by region and installer. Water hardness data sourced from
            the Environment Agency and water company compliance reports
            covering 2,800 UK postcode districts.{" "}
            <Link
              href="/about/methodology"
              className="underline underline-offset-2 hover:text-muted transition-colors"
            >
              Our methodology
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
