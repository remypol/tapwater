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
  Search,
  ChevronRight,
  Droplets,
  Sparkles,
  Home,
  FlaskConical,
  ShieldAlert,
  GlassWater,
  X,
  Minus,
} from "lucide-react";

const year = new Date().getFullYear();

export function generateMetadata(): Metadata {
  return {
    title: `Best Water Filters UK: Which Type Do You Actually Need? (${year})`,
    description:
      "An honest overview of every water filter type available in the UK. Find out which filter removes what, then read our specific buying guides.",
    openGraph: {
      title: `Best Water Filters for UK Tap Water (${year})`,
      description:
        "Which water filter type do you actually need? Compare jug, countertop, under-sink, reverse osmosis, and whole-house systems.",
      url: "https://www.tapwater.uk/guides/best-water-filters-uk",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `Best Water Filters for UK Tap Water (${year})`,
      description:
        "Compare every water filter type and find the right one for your home.",
    },
  };
}

/* ── Guide link data ────────────────────────────────────────────────── */

const BUYING_GUIDES = [
  {
    slug: "best-water-filter-jug-uk",
    title: "Best Water Filter Jug UK",
    description:
      "BRITA vs ZeroWater vs the rest. We test jugs against real contaminant data and tell you which ones are worth the money.",
    icon: GlassWater,
    iconColor: "text-sky-600",
    iconBg: "bg-sky-50",
  },
  {
    slug: "best-reverse-osmosis-system-uk",
    title: "Best Reverse Osmosis System UK",
    description:
      "The most thorough filtration you can get at home. Removes PFAS, fluoride, heavy metals, and virtually everything else.",
    icon: Droplets,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
  },
  {
    slug: "best-water-filter-pfas",
    title: "Best Filter for PFAS Removal",
    description:
      "Not all filters remove forever chemicals. These are the ones with independent certification to actually do it.",
    icon: ShieldAlert,
    iconColor: "text-red-600",
    iconBg: "bg-red-50",
  },
  {
    slug: "best-shower-filter-uk",
    title: "Best Shower Filter UK",
    description:
      "Chlorine in shower water can dry out skin and hair. These filters reduce it at the source.",
    icon: Sparkles,
    iconColor: "text-cyan-600",
    iconBg: "bg-cyan-50",
  },
  {
    slug: "best-whole-house-water-filter-uk",
    title: "Best Whole House Filter UK",
    description:
      "Filter every tap, shower, and appliance in your home with a single system installed at your water main.",
    icon: Home,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  {
    slug: "best-water-testing-kit-uk",
    title: "Best Water Testing Kit UK",
    description:
      "Not sure what is in your water? Test it yourself before spending money on a filter you might not need.",
    icon: FlaskConical,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
  },
];

/* ── Comparison table data ──────────────────────────────────────────── */

type Effectiveness = "yes" | "partial" | "no";

interface FilterTypeRow {
  type: string;
  chlorine: Effectiveness;
  lead: Effectiveness;
  pfas: Effectiveness;
  fluoride: Effectiveness;
  bacteria: Effectiveness;
  hardness: Effectiveness;
}

const FILTER_TYPES: FilterTypeRow[] = [
  {
    type: "Jug (carbon)",
    chlorine: "yes",
    lead: "partial",
    pfas: "no",
    fluoride: "no",
    bacteria: "no",
    hardness: "no",
  },
  {
    type: "Jug (ion exchange)",
    chlorine: "yes",
    lead: "yes",
    pfas: "yes",
    fluoride: "yes",
    bacteria: "no",
    hardness: "partial",
  },
  {
    type: "Countertop",
    chlorine: "yes",
    lead: "yes",
    pfas: "partial",
    fluoride: "no",
    bacteria: "partial",
    hardness: "no",
  },
  {
    type: "Under-sink",
    chlorine: "yes",
    lead: "yes",
    pfas: "partial",
    fluoride: "no",
    bacteria: "no",
    hardness: "no",
  },
  {
    type: "Reverse osmosis",
    chlorine: "yes",
    lead: "yes",
    pfas: "yes",
    fluoride: "yes",
    bacteria: "yes",
    hardness: "yes",
  },
  {
    type: "Whole house",
    chlorine: "yes",
    lead: "yes",
    pfas: "partial",
    fluoride: "no",
    bacteria: "no",
    hardness: "partial",
  },
];

function EffectivenessCell({ value }: { value: Effectiveness }) {
  if (value === "yes") {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50">
        <Check className="w-3 h-3 text-safe" />
      </span>
    );
  }
  if (value === "partial") {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-50">
        <Minus className="w-3 h-3 text-amber-600" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-50">
      <X className="w-3 h-3 text-faint" />
    </span>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function BestWaterFiltersGuide() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Guides", url: "https://www.tapwater.uk/guides" },
          {
            name: "Best Water Filters UK",
            url: "https://www.tapwater.uk/guides/best-water-filters-uk",
          },
        ]}
      />
      <ArticleSchema
        headline={`Best Water Filters for UK Tap Water (${year})`}
        description="An honest overview of every water filter type available in the UK, with links to specific buying guides for each category."
        url="https://www.tapwater.uk/guides/best-water-filters-uk"
        datePublished="2026-04-02"
        dateModified={new Date().toISOString().split("T")[0]}
        authorName="Remy"
        authorUrl="https://www.tapwater.uk/about"
      />
      <FAQSchema
        faqs={[
          {
            question: "What is the best water filter for UK tap water?",
            answer:
              "It depends on what you want to remove. For basic chlorine and taste improvement, a jug filter like BRITA is fine. For PFAS, fluoride, and heavy metals, you need a reverse osmosis system. Our buying guides cover each category in detail.",
          },
          {
            question: "Do I need a water filter in the UK?",
            answer:
              "UK tap water is legally safe to drink and meets strict standards set by the Drinking Water Inspectorate. However, trace levels of contaminants like chlorine, lead from old pipes, and PFAS can be present below legal limits. A filter can reduce these if you want extra peace of mind, but it is not strictly necessary for safety.",
          },
          {
            question: "Do water filters remove PFAS?",
            answer:
              "Only certain types. Reverse osmosis systems (certified to NSF/ANSI 58) remove 90-99% of PFAS compounds. Some activated carbon filters certified to NSF/ANSI 53 offer partial reduction. Basic jug filters and countertop filters typically do not remove PFAS.",
          },
          {
            question: "How much does a water filter cost in the UK?",
            answer:
              "Jug filters cost between \u00a320-\u00a345 upfront with replacement cartridges around \u00a35-8 each. Countertop systems range from \u00a3100-\u00a3200. Under-sink reverse osmosis systems cost \u00a3200-\u00a3500. Whole-house systems start at \u00a3500 and can exceed \u00a31,000 for premium models.",
          },
          {
            question: "Which type of water filter removes the most contaminants?",
            answer:
              "Reverse osmosis removes the widest range of contaminants including PFAS, fluoride, lead, bacteria, and hardness minerals. It is the most thorough filtration technology available for home use, but it also removes beneficial minerals and wastes some water in the process.",
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
            nitrates from farming can all be present within legal limits. The
            right filter depends on what is in your water and what you want to
            remove. This page helps you work out which type you need, then links
            to our detailed buying guides for each category.
          </p>
        </div>

        {/* Affiliate notice */}
        <div className="bg-wash border border-rule rounded-xl p-4 mt-6 mb-8 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <p className="text-sm text-body">
            Our buying guides contain affiliate links. If you buy through these
            links, we earn a small commission at no extra cost to you. This funds
            our independent water quality research. Our recommendations are based
            on certifications and contaminant data, not sponsorship.{" "}
            <Link
              href="/affiliate-disclosure"
              className="text-accent hover:underline"
            >
              Full disclosure
            </Link>
          </p>
        </div>

        {/* ── What each filter type removes ────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-3">
          What each filter type removes
        </h2>
        <p className="text-base text-body leading-relaxed mb-5">
          Different filter technologies remove different things. This table shows
          what you can realistically expect from each type, based on independent
          certifications rather than manufacturer claims.
        </p>

        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-wash text-left">
                <th className="py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-muted">
                  Filter type
                </th>
                <th className="py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-muted text-center">
                  Chlorine
                </th>
                <th className="py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-muted text-center">
                  Lead
                </th>
                <th className="py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-muted text-center">
                  PFAS
                </th>
                <th className="py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-muted text-center">
                  Fluoride
                </th>
                <th className="py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-muted text-center">
                  Bacteria
                </th>
                <th className="py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-muted text-center">
                  Hardness
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {FILTER_TYPES.map((row) => (
                <tr key={row.type}>
                  <td className="py-2.5 px-3 font-medium text-ink whitespace-nowrap">
                    {row.type}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <EffectivenessCell value={row.chlorine} />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <EffectivenessCell value={row.lead} />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <EffectivenessCell value={row.pfas} />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <EffectivenessCell value={row.fluoride} />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <EffectivenessCell value={row.bacteria} />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <EffectivenessCell value={row.hardness} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-muted">
          <span className="flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-50">
              <Check className="w-2.5 h-2.5 text-safe" />
            </span>
            Removes
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-50">
              <Minus className="w-2.5 h-2.5 text-amber-600" />
            </span>
            Partial
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-50">
              <X className="w-2.5 h-2.5 text-faint" />
            </span>
            No effect
          </span>
        </div>

        {/* ── Choose your filter type ──────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-3">
          Choose your filter type
        </h2>
        <p className="text-base text-body leading-relaxed mb-6">
          We have written a detailed buying guide for each filter category,
          with specific product recommendations tested against real UK water
          quality data.
        </p>

        <div className="space-y-3">
          {BUYING_GUIDES.map((guide) => {
            const Icon = guide.icon;
            return (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="card p-5 flex items-start gap-4 group block"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${guide.iconBg} flex items-center justify-center shrink-0 mt-0.5`}
                >
                  <Icon className={`w-5 h-5 ${guide.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink group-hover:text-accent transition-colors">
                    {guide.title}
                  </p>
                  <p className="text-sm text-muted mt-0.5 leading-relaxed">
                    {guide.description}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-faint group-hover:text-accent transition-colors shrink-0 mt-1" />
              </Link>
            );
          })}
        </div>

        {/* ── NSF certifications ───────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          What NSF certifications mean
        </h2>
        <p className="text-base text-body leading-relaxed">
          The single most important thing when choosing a filter is independent
          certification. Marketing claims mean nothing without third-party
          verification. Here are the certifications that matter:
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

        {/* ── Check your postcode CTA ──────────────────────────────── */}
        <div className="mt-14 card-elevated p-8 text-center rounded-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h2 className="font-display text-2xl italic text-ink">
            Check your postcode first
          </h2>
          <p className="text-base text-muted mt-2 max-w-md mx-auto">
            See which contaminants are flagged in your area. We will recommend
            the right filter type for your water.
          </p>
          <div className="mt-6 max-w-sm mx-auto">
            <PostcodeSearch />
          </div>
        </div>

        {/* Methodology footer */}
        <footer className="mt-12 pb-4 text-sm text-faint leading-relaxed border-t border-rule pt-6">
          <p>
            Last reviewed April {year}. Contaminant removal claims are based on
            independent certifications (NSF, WQA, TUV SUD) and manufacturer
            specifications. We earn a commission from purchases made through
            affiliate links in our buying guides at no extra cost to you.{" "}
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
