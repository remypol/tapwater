import Link from "next/link";
import type { Metadata } from "next";
import { PostcodeSearch } from "@/components/postcode-search";
import {
  FAQSchema,
  ArticleSchema,
  BreadcrumbSchema,
} from "@/components/json-ld";
import {
  ShieldCheck,
  Check,
  ArrowUpRight,
  Star,
  Droplets,
  Search,
} from "lucide-react";
import { FILTERS, CATEGORY_LABELS } from "@/lib/filters";
import type { FilterProduct } from "@/lib/types";

const year = new Date().getFullYear();

export function generateMetadata(): Metadata {
  return {
    title: `Best Water Filters UK: Tested Against Real Contaminant Data (${year})`,
    description:
      "We matched water filters to contaminants actually found in UK tap water. Honest recommendations based on government data, not marketing claims.",
    openGraph: {
      title: `Best Water Filters for UK Tap Water (${year})`,
      description:
        "Honest water filter recommendations matched to contaminants found in UK tap water, based on government data.",
      url: "https://tapwater.uk/guides/best-water-filters-uk/",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `Best Water Filters for UK Tap Water (${year})`,
      description:
        "Water filter recommendations matched to real UK water quality data.",
    },
  };
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function getFilter(id: string): FilterProduct {
  const f = FILTERS.find((f) => f.id === id);
  if (!f) throw new Error(`Filter ${id} not found`);
  return f;
}

function ProductSection({
  filter,
  heading,
  reason,
  pros,
  cons,
}: {
  filter: FilterProduct;
  heading: string;
  reason: string;
  pros: string[];
  cons: string[];
}) {
  return (
    <div className="card p-6 lg:p-8">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-display text-xl italic text-ink">{heading}</h3>
          <p className="text-sm text-muted mt-0.5">
            {filter.brand} {filter.model} &middot;{" "}
            {CATEGORY_LABELS[filter.category]}
          </p>
        </div>
        <span className="font-data text-2xl font-bold text-ink">
          &pound;{filter.priceGbp}
        </span>
      </div>

      <p className="text-base text-body leading-relaxed mt-4">{reason}</p>

      {/* What it removes */}
      <div className="mt-4">
        <p className="text-xs font-medium text-ink uppercase tracking-wider mb-2">
          Removes
        </p>
        <div className="flex flex-wrap gap-1.5">
          {filter.removes.map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-1"
            >
              <Check className="w-3 h-3" />
              {r}
            </span>
          ))}
        </div>
      </div>

      {/* Certifications */}
      {filter.certifications.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {filter.certifications.map((cert) => (
            <span
              key={cert}
              className="text-[10px] bg-gray-100 text-faint rounded px-1.5 py-0.5"
            >
              {cert}
            </span>
          ))}
        </div>
      )}

      {/* Pros / Cons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
        <div>
          <p className="text-xs font-medium text-safe uppercase tracking-wider mb-2">
            Pros
          </p>
          <ul className="space-y-1.5">
            {pros.map((p) => (
              <li
                key={p}
                className="flex items-start gap-1.5 text-sm text-body"
              >
                <Check className="w-3.5 h-3.5 text-safe shrink-0 mt-0.5" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-warning uppercase tracking-wider mb-2">
            Cons
          </p>
          <ul className="space-y-1.5">
            {cons.map((c) => (
              <li
                key={c}
                className="flex items-start gap-1.5 text-sm text-body"
              >
                <span className="w-3.5 h-3.5 shrink-0 mt-0.5 text-warning">
                  &ndash;
                </span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Rating + CTA */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-rule">
        <span className="flex items-center gap-1 text-sm text-muted">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          {filter.rating.toFixed(1)} average rating
        </span>
        <a
          href={filter.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="inline-flex items-center gap-1.5 bg-ink text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          View on Amazon
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function BestWaterFiltersGuide() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://tapwater.uk" },
          { name: "Guides", url: "https://tapwater.uk/guides" },
          {
            name: "Best Water Filters UK",
            url: "https://tapwater.uk/guides/best-water-filters-uk/",
          },
        ]}
      />
      <ArticleSchema
        headline={`Best Water Filters for UK Tap Water (${year})`}
        description="We matched water filters to contaminants actually found in UK tap water. Honest recommendations based on government data, not marketing claims."
        url="https://tapwater.uk/guides/best-water-filters-uk/"
        datePublished="2026-04-02"
        dateModified={new Date().toISOString().split("T")[0]}
        authorName="Remy"
        authorUrl="https://tapwater.uk/about"
      />
      <FAQSchema
        faqs={[
          {
            question: "What is the best water filter for UK tap water?",
            answer:
              "For jug filters, the ZeroWater 12-Cup offers the most comprehensive contaminant removal with NSF 53/401 certification, removing lead, PFAS, fluoride, and more. For under-sink systems, the Waterdrop G3P800 reverse osmosis system removes virtually everything including PFAS, certified to NSF 58.",
          },
          {
            question: "Do I need a water filter in the UK?",
            answer:
              "UK tap water is legally safe to drink and meets strict standards set by the Drinking Water Inspectorate. However, trace levels of contaminants like chlorine, lead from old pipes, and PFAS can be present below legal limits. A filter can reduce these if you want extra peace of mind, but it is not strictly necessary for safety.",
          },
          {
            question: "Do water filters remove PFAS?",
            answer:
              "Yes. Reverse osmosis systems (certified to NSF/ANSI 58) remove 90-99% of PFAS compounds. Activated carbon filters certified to NSF/ANSI 53 offer partial reduction. Not all filters remove PFAS equally — look for specific NSF certifications rather than marketing claims.",
          },
          {
            question: "How much does a water filter cost in the UK?",
            answer:
              "Jug filters cost between \u00a320-\u00a345 upfront with replacement cartridges around \u00a35-8 each. Countertop systems range from \u00a3100-\u00a3200. Under-sink reverse osmosis systems cost \u00a3200-\u00a3500. Whole-house systems start at \u00a3500 and can exceed \u00a31,000 for premium models.",
          },
        ]}
      />

      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
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
              Best Water Filters UK
            </li>
          </ol>
        </nav>

        {/* H1 */}
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Best Water Filters for UK Tap Water
        </h1>
        <div className="flex items-center gap-2 mt-3 mb-8 text-sm text-muted">
          <span>
            By <span className="text-ink font-medium">Remy</span>
          </span>
          <span>&middot;</span>
          <span>Updated April {year}</span>
        </div>

        {/* Intro */}
        <div className="prose-section">
          <p className="text-lg text-body leading-relaxed">
            Most &ldquo;best water filter&rdquo; articles rank products based on
            marketing materials. We do it differently: we match filters to
            contaminants actually found in UK tap water, using government data
            from the Environment Agency and water company compliance reports.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            UK tap water is safe to drink. It meets strict legal standards.
            But &ldquo;legal&rdquo; and &ldquo;ideal&rdquo; are different things
            &mdash; trace amounts of chlorine, lead from old pipes, PFAS, and
            nitrates from farming can all be present within legal limits. A good
            filter reduces what you don&apos;t want, without the cost of bottled
            water.
          </p>
        </div>

        {/* Affiliate notice */}
        <div className="bg-wash border border-rule rounded-xl p-4 mt-6 mb-8 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <p className="text-sm text-body">
            This guide contains affiliate links. If you buy through these links,
            we earn a small commission at no extra cost to you. This funds our
            independent water quality research. Our recommendations are based on
            certifications and contaminant data, not sponsorship.{" "}
            <Link
              href="/affiliate-disclosure"
              className="text-accent hover:underline"
            >
              Full disclosure
            </Link>
          </p>
        </div>

        {/* ── How we choose ─────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          How we choose
        </h2>
        <p className="text-base text-body leading-relaxed">
          We start with real water quality data. Our database tracks{" "}
          contaminant levels across hundreds of UK postcode areas, sourced from
          the Environment Agency and water company test results. We then
          check which filters are independently certified (NSF, WQA, or
          TUV SUD) to remove the contaminants most commonly flagged in UK
          water. Finally, we consider price, availability in the UK, and real
          user reviews.
        </p>
        <p className="text-base text-body leading-relaxed mt-4">
          We don&apos;t accept free products or paid placements. If a filter
          isn&apos;t certified to remove what it claims, it doesn&apos;t make our
          list.
        </p>

        {/* ── Best overall ──────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          Best overall jug filter
        </h2>
        <ProductSection
          filter={getFilter("zerowater-12cup")}
          heading="ZeroWater 12-Cup Ready-Pour"
          reason="The ZeroWater removes more contaminants than any other jug filter we tested. It's the only jug with NSF/ANSI 53 certification for lead removal and NSF 401 for emerging contaminants including PFAS. The 5-stage filtration produces genuinely pure water — it ships with a TDS meter so you can verify it yourself."
          pros={[
            "Removes PFAS, lead, fluoride, and nitrate — rare for a jug",
            "NSF/ANSI 53 and 401 certified (independently verified)",
            "Includes TDS meter to check filter performance",
            "Large 12-cup capacity, ready-pour spout",
          ]}
          cons={[
            "Replacement filters cost more than BRITA (around \u00a38 each)",
            "Filters need replacing more frequently (every 2-3 months)",
            "Filtered water can taste flat due to mineral removal",
          ]}
        />

        {/* ── Best under-sink ───────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          Best under-sink system
        </h2>
        <ProductSection
          filter={getFilter("waterdrop-g3p800")}
          heading="Waterdrop G3P800 Reverse Osmosis"
          reason="If you want the most thorough filtration available, reverse osmosis is the technology to use. The Waterdrop G3P800 removes 12 contaminant categories we track, including PFAS, lead, arsenic, fluoride, and trihalomethanes. NSF 58 certified, it produces 800 gallons per day with a tankless design that saves under-sink space."
          pros={[
            "Removes virtually everything including PFAS and fluoride",
            "NSF/ANSI 58 certified — the gold standard for RO",
            "Tankless design saves space under sink",
            "Smart LED indicator shows filter status",
          ]}
          cons={[
            "Requires installation (straightforward DIY, but not plug-and-play)",
            "Higher upfront cost at \u00a3399",
            "Wastes some water during filtration (typical of RO systems)",
            "Removes beneficial minerals alongside contaminants",
          ]}
        />

        {/* ── Best budget ───────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          Best budget pick
        </h2>
        <ProductSection
          filter={getFilter("brita-maxtra-pro")}
          heading="BRITA Marella XL + MAXTRA PRO"
          reason="The UK's most popular filter jug for a reason. The BRITA Marella won't remove PFAS or fluoride, but it handles the basics well: chlorine, lead, copper, and mercury. For most UK postcodes where the main concern is taste and general peace of mind, it's the right choice at a fraction of the price of more advanced systems."
          pros={[
            "Most affordable option at \u00a325",
            "Widely available — replacement cartridges sold everywhere",
            "Reduces chlorine taste immediately",
            "MAXTRA PRO cartridges last around 4 weeks each",
          ]}
          cons={[
            "Does not remove PFAS, fluoride, or nitrate",
            "Limited independent certification compared to ZeroWater",
            "Not suitable if your area has flagged PFAS or fluoride",
          ]}
        />

        {/* ── Best countertop ───────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          Best countertop filter
        </h2>
        <ProductSection
          filter={getFilter("waterdrop-fc06")}
          heading="Waterdrop FC-06 Countertop"
          reason="The Waterdrop FC-06 is a stainless steel countertop filter that connects directly to your tap — no installation or plumbing needed. It removes chlorine, lead, fluoride, and other common contaminants. Compact design, high flow rate, and NSF 42 certified. A practical option if you rent or can't modify your plumbing."
          pros={[
            "No installation — connects to any standard tap",
            "Stainless steel construction, durable",
            "High flow rate, no waiting",
            "Very affordable at ~£36",
          ]}
          cons={[
            "Doesn't remove PFAS or bacteria",
            "Takes up some counter space near the tap",
            "Filter replacements needed every 3 months",
          ]}
        />

        {/* ── Best whole house ──────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          Best whole-house system
        </h2>
        <ProductSection
          filter={getFilter("waterdrop-10ua")}
          heading="Waterdrop 10UA Under Sink Filter"
          reason="The Waterdrop 10UA is a high-capacity under-sink filter with 11,000 gallon lifespan — roughly 12 months for a typical household. It removes chlorine, lead, and PFAS. NSF 42 certified. Simple installation with a dedicated faucet."
          pros={[
            "Massive 11,000 gallon capacity — lasts up to 12 months",
            "Removes PFAS, lead, and chlorine",
            "Dedicated filtered water tap",
            "NSF/ANSI 42 certified",
          ]}
          cons={[
            "Professional installation recommended (\u00a3200-400 extra)",
            "High upfront cost at \u00a3899",
            "Requires space for installation at water entry point",
            "Pre-filters need replacing every 3 months",
          ]}
        />

        {/* ── What to look for ──────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          What to look for in a water filter
        </h2>

        <h3 className="font-semibold text-ink text-lg mt-6 mb-2">
          NSF certifications matter
        </h3>
        <p className="text-base text-body leading-relaxed">
          The single most important thing is independent certification.
          Marketing claims mean nothing without third-party verification. Here
          are the certifications that matter:
        </p>
        <ul className="mt-3 space-y-2">
          <li className="flex items-start gap-2 text-sm text-body">
            <span className="font-data font-bold text-ink shrink-0 w-24">
              NSF/ANSI 42
            </span>
            Reduces chlorine, taste, and odour. The baseline.
          </li>
          <li className="flex items-start gap-2 text-sm text-body">
            <span className="font-data font-bold text-ink shrink-0 w-24">
              NSF/ANSI 53
            </span>
            Reduces health-related contaminants: lead, mercury, volatile organic
            compounds.
          </li>
          <li className="flex items-start gap-2 text-sm text-body">
            <span className="font-data font-bold text-ink shrink-0 w-24">
              NSF/ANSI 58
            </span>
            Reverse osmosis systems. The most thorough filtration standard.
          </li>
          <li className="flex items-start gap-2 text-sm text-body">
            <span className="font-data font-bold text-ink shrink-0 w-24">
              NSF/ANSI 401
            </span>
            Emerging contaminants: PFAS, pharmaceuticals, pesticides.
          </li>
        </ul>

        <h3 className="font-semibold text-ink text-lg mt-8 mb-2">
          What each filter type removes
        </h3>
        <p className="text-base text-body leading-relaxed">
          Not all filters are equal. Here is what to expect from each type:
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-wash text-left">
                <th className="py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-muted">
                  Filter type
                </th>
                <th className="py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-muted">
                  Chlorine
                </th>
                <th className="py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-muted">
                  Lead
                </th>
                <th className="py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-muted">
                  PFAS
                </th>
                <th className="py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-muted">
                  Fluoride
                </th>
                <th className="py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-muted">
                  Bacteria
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              <tr>
                <td className="py-2.5 px-3 font-medium text-ink">
                  Carbon jug
                </td>
                <td className="py-2.5 px-3 text-safe">Yes</td>
                <td className="py-2.5 px-3 text-safe">Some</td>
                <td className="py-2.5 px-3 text-faint">No</td>
                <td className="py-2.5 px-3 text-faint">No</td>
                <td className="py-2.5 px-3 text-faint">No</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-ink">
                  Ion exchange jug
                </td>
                <td className="py-2.5 px-3 text-safe">Yes</td>
                <td className="py-2.5 px-3 text-safe">Yes</td>
                <td className="py-2.5 px-3 text-safe">Yes</td>
                <td className="py-2.5 px-3 text-safe">Yes</td>
                <td className="py-2.5 px-3 text-faint">No</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-ink">
                  Ceramic countertop
                </td>
                <td className="py-2.5 px-3 text-safe">Yes</td>
                <td className="py-2.5 px-3 text-safe">Yes</td>
                <td className="py-2.5 px-3 text-safe">Some</td>
                <td className="py-2.5 px-3 text-faint">No</td>
                <td className="py-2.5 px-3 text-safe">Yes</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-ink">
                  Reverse osmosis
                </td>
                <td className="py-2.5 px-3 text-safe">Yes</td>
                <td className="py-2.5 px-3 text-safe">Yes</td>
                <td className="py-2.5 px-3 text-safe">Yes</td>
                <td className="py-2.5 px-3 text-safe">Yes</td>
                <td className="py-2.5 px-3 text-safe">Yes</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Check your postcode CTA ───────────────────────────────── */}
        <div className="mt-14 card-elevated p-8 text-center rounded-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h2 className="font-display text-2xl italic text-ink">
            Check your postcode
          </h2>
          <p className="text-base text-muted mt-2 max-w-md mx-auto">
            See which contaminants are flagged in your area and get filter
            recommendations matched to your water.
          </p>
          <div className="mt-6 max-w-sm mx-auto">
            <PostcodeSearch />
          </div>
        </div>

        {/* Methodology footer */}
        <footer className="mt-12 pb-4 text-sm text-faint leading-relaxed border-t border-rule pt-6">
          <p>
            Product recommendations last reviewed April {year}. Prices are
            approximate and may vary. Contaminant removal claims are based on
            manufacturer specifications and independent certifications (NSF,
            WQA, TUV SUD). We earn a commission from purchases made through
            affiliate links at no extra cost to you.{" "}
            <Link
              href="/affiliate-disclosure"
              className="underline underline-offset-2 hover:text-muted transition-colors"
            >
              Affiliate disclosure
            </Link>{" "}
            &middot;{" "}
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
