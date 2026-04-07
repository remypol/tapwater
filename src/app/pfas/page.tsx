import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MapPin, FlaskConical, Activity } from "lucide-react";
import { BreadcrumbSchema, ArticleSchema, FAQSchema } from "@/components/json-ld";
import { ScrollReveal } from "@/components/scroll-reveal";
import { PostcodeSearch } from "@/components/postcode-search";
import { ProductCard } from "@/components/product-card";
import { PfasMapWrapper as PfasMap } from "@/components/pfas-map-wrapper";
import { ScrollToTop } from "@/components/scroll-to-top";
import { getPfasNationalSummary } from "@/lib/pfas-data";
import { getProductIncludingUnavailable } from "@/lib/products";

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  const year = new Date().getFullYear();
  return {
    title: `PFAS in UK Water: Live Tracker (${year})`,
    description: `Track PFAS forever chemicals in UK water. ${year} data on detection levels, affected cities, and interactive map from Environment Agency monitoring.`,
    openGraph: {
      title: `PFAS in UK Water: Live Tracker (${year})`,
      description:
        "Track PFAS forever chemicals across UK cities with interactive maps and Environment Agency data.",
      url: "https://www.tapwater.uk/pfas",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `PFAS in UK Water: Live Tracker ${year}`,
      description:
        "Track PFAS forever chemicals across UK cities with interactive maps and data.",
    },
  };
}

export default async function PfasNationalPage() {
  const year = new Date().getFullYear();
  const data = await getPfasNationalSummary();

  const roProduct = getProductIncludingUnavailable("waterdrop-g3p600");

  const faqs = [
    {
      question: "What is PFAS?",
      answer:
        "PFAS (per- and polyfluoroalkyl substances) are a group of over 10,000 synthetic chemicals known as 'forever chemicals' because they do not break down in the environment. They are used in non-stick coatings, waterproof clothing, food packaging, and firefighting foam. PFAS have been linked to health risks including cancer, thyroid disease, and immune system suppression.",
    },
    {
      question: "Is UK tap water safe from PFAS?",
      answer:
        "The UK currently has no legal limit for PFAS in drinking water. While water companies are not required to test for or remove PFAS, Environment Agency monitoring has detected PFAS in water sources near several major cities. The EU set a binding limit of 0.1 \u00b5g/L for total PFAS from January 2026, but the UK has not adopted this standard.",
    },
    {
      question: "Which UK cities have PFAS in their water?",
      answer: data
        ? `Environment Agency monitoring has detected PFAS compounds in water sources near ${data.citiesWithDetections} UK cities. The cities with the highest recorded levels include ${data.detectionsByCity.slice(0, 5).map((c) => c.city).join(", ")}. Detection does not necessarily mean PFAS is present in treated tap water.`
        : "PFAS monitoring data is currently being collected. Check back soon for city-level results.",
    },
    {
      question: "What is the UK legal limit for PFAS in water?",
      answer:
        "As of 2026, the UK has no legal limit for PFAS in drinking water. The Drinking Water Inspectorate (DWI) has issued guidance values but these are not legally binding. By contrast, the EU set a binding limit of 0.1 \u00b5g/L for total PFAS in January 2026, and the WHO recommends the same threshold.",
    },
    {
      question: "How do I remove PFAS from my water?",
      answer:
        "Reverse osmosis (RO) filtration is the most effective method for removing PFAS from drinking water, removing over 95% of PFAS compounds. Activated carbon filters can reduce some PFAS but are less effective. Standard jug filters like BRITA do not remove PFAS. For home use, an under-sink RO system is the most reliable option.",
    },
    {
      question: "Should I be worried about PFAS in UK water?",
      answer:
        "While PFAS detection in water sources is a concern, it does not necessarily mean your tap water contains PFAS at harmful levels. Water treatment can reduce PFAS concentrations. However, the lack of UK regulation means there is no legal requirement to test for or remove PFAS. If you are concerned, a reverse osmosis filter is the most effective home solution.",
    },
  ];

  if (!data) {
    return (
      <div className="bg-hero min-h-screen">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-8 lg:py-14">
          <BreadcrumbSchema
            items={[
              { name: "Home", url: "https://www.tapwater.uk" },
              { name: "PFAS Tracker", url: "https://www.tapwater.uk/pfas" },
            ]}
          />
          <FAQSchema faqs={faqs} />

          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-sm text-faint"
          >
            <Link href="/" className="hover:text-accent transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-ink font-medium">PFAS Tracker</span>
          </nav>

          <header className="mt-6 mb-10">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-ink tracking-tight mt-2">
              PFAS in UK Water:{" "}
              <span className="italic">Live Tracker</span>
            </h1>
          </header>

          <div className="card-elevated rounded-2xl p-8 max-w-2xl">
            <p className="font-display text-2xl text-ink italic">
              Data coming soon
            </p>
            <p className="text-base text-body leading-relaxed mt-3">
              PFAS monitoring data is being collected. Check back soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(data.latestDetectionDate).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <div className="bg-hero min-h-screen">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-8 lg:py-14">
        <BreadcrumbSchema
          items={[
            { name: "Home", url: "https://www.tapwater.uk" },
            { name: "PFAS Tracker", url: "https://www.tapwater.uk/pfas" },
          ]}
        />
        <ArticleSchema
          headline={`PFAS in UK Water: Live Tracker (${year})`}
          description="Interactive tracker showing PFAS forever chemical detections across UK cities, based on Environment Agency monitoring data."
          url="https://www.tapwater.uk/pfas"
          datePublished="2025-01-15"
          dateModified={new Date().toISOString().split("T")[0]}
          authorName="TapWater.uk Research"
          authorUrl="https://www.tapwater.uk/about"
        />
        <FAQSchema faqs={faqs} />

        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm text-faint"
        >
          <Link href="/" className="hover:text-accent transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink font-medium">PFAS Tracker</span>
        </nav>

        {/* Hero */}
        <header className="mt-6 mb-10">
          <p className="text-xs uppercase tracking-[0.15em] text-[#a855f7] font-semibold animate-fade-up delay-1">
            {year} Live Data
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-ink tracking-tight mt-2 animate-fade-up delay-2">
            PFAS in UK Water:{" "}
            <span className="italic">Live Tracker</span>
          </h1>
          <p className="text-muted mt-3 max-w-2xl text-lg animate-fade-up delay-3">
            By{" "}
            <Link
              href="/about"
              className="text-accent hover:underline underline-offset-2"
            >
              TapWater.uk Research
            </Link>{" "}
            &middot; Updated{" "}
            <span className="font-medium text-ink">{formattedDate}</span>
          </p>
        </header>

        {/* GEO summary callout */}
        <div className="card p-5 border-l-4 border-l-[#a855f7] mb-8">
          <p className="text-base text-body leading-relaxed">
            <strong className="text-ink">
              According to TapWater.uk&apos;s analysis of Environment Agency
              monitoring data, PFAS compounds have been detected at{" "}
              {data.totalSamplingPoints.toLocaleString()} sampling points
              across {data.citiesWithDetections} UK cities.
            </strong>{" "}
            The UK has no legal limit for PFAS in drinking water as of {year}.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-up delay-4">
          <div className="card p-4 text-center">
            <p className="text-xs text-muted uppercase tracking-wider">
              Total detections
            </p>
            <p className="font-data text-3xl font-bold text-[#a855f7] mt-1">
              {data.totalDetections.toLocaleString()}
            </p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-muted uppercase tracking-wider">
              Cities affected
            </p>
            <p className="font-data text-3xl font-bold text-ink mt-1">
              {data.citiesWithDetections}
              <span className="text-sm text-faint font-normal">
                /{data.citiesMonitored}
              </span>
            </p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-muted uppercase tracking-wider">
              Highest level
            </p>
            <p className="font-data text-3xl font-bold text-ink mt-1">
              {data.highestLevel.toFixed(3)}
              <span className="text-sm text-faint font-normal"> &micro;g/L</span>
            </p>
            <p className="text-xs text-faint mt-1">{data.highestLevelCity}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-muted uppercase tracking-wider">
              Latest detection
            </p>
            <p className="font-data text-lg font-bold text-ink mt-1">
              {formattedDate}
            </p>
          </div>
        </div>

        <hr className="border-rule mt-10" />

        {/* Map */}
        <ScrollReveal delay={0}>
          <section className="mt-8">
            <PfasMap points={data.allDetectionPoints} />

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-muted">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#22c55e]" />
                <span>&lt;0.01 &micro;g/L</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                <span>0.01&ndash;0.075 &micro;g/L</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ef4444]" />
                <span>&gt;0.075 &micro;g/L</span>
              </div>
              <span className="text-faint">
                &middot; Based on Environment Agency monitoring data
              </span>
            </div>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-10" />

        {/* City ranking table */}
        <ScrollReveal delay={0}>
          <section className="mt-8">
            <h2 className="font-display text-3xl text-ink italic mb-2">
              PFAS levels by city
            </h2>
            <p className="text-sm text-muted mb-6">
              {data.detectionsByCity.length} cities with PFAS detections, ranked
              by highest recorded level. Click any city for a full breakdown.
            </p>

            <div className="card overflow-hidden">
              <div className="hidden sm:grid sm:grid-cols-[1fr_120px_100px_110px_100px] gap-3 px-5 py-3 bg-[var(--color-wash)] border-b border-[var(--color-rule)] text-xs text-faint uppercase tracking-wider font-semibold">
                <span>City</span>
                <span>Region</span>
                <span className="text-right">Detections</span>
                <span className="text-right">Compounds</span>
                <span className="text-right">Highest</span>
              </div>

              {data.detectionsByCity.map((city) => (
                <Link
                  key={city.slug}
                  href={`/pfas/${city.slug}`}
                  className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_100px_110px_100px] gap-x-3 gap-y-0.5 items-center px-5 py-3.5 border-b border-[var(--color-rule)] last:border-b-0 hover:bg-[var(--color-wash)] transition-colors group"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#a855f7] shrink-0" />
                    <span className="font-medium text-sm text-ink group-hover:text-accent transition-colors">
                      {city.city}
                    </span>
                  </div>

                  <span className="text-xs text-muted hidden sm:block">
                    {city.region}
                  </span>

                  <span className="font-data text-sm text-right text-muted hidden sm:block tabular-nums">
                    {city.detectionCount}
                  </span>

                  <span className="font-data text-sm text-right text-muted hidden sm:block tabular-nums">
                    {city.compoundsFound}
                  </span>

                  <span className="font-data text-sm font-bold text-right tabular-nums text-[#a855f7]">
                    {city.highestLevel.toFixed(3)}
                    <span className="text-xs text-faint font-normal">
                      {" "}
                      &micro;g/L
                    </span>
                  </span>
                </Link>
              ))}
            </div>

            <p className="mt-3 text-xs text-faint">
              Data from the Environment Agency Water Quality Archive.
              &quot;Highest&quot; shows the single highest PFAS reading recorded
              at any monitoring point near the city.
            </p>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-12" />

        {/* What is PFAS? */}
        <ScrollReveal delay={0}>
          <section className="mt-10">
            <h2 className="font-display text-3xl text-ink italic mb-4">
              What is PFAS?
            </h2>
            <div className="max-w-3xl space-y-4">
              <p className="text-base text-body leading-relaxed">
                PFAS (per- and polyfluoroalkyl substances) are a group of over
                10,000 synthetic chemicals used since the 1950s in products
                ranging from non-stick pans and waterproof clothing to food
                packaging and firefighting foam. They are known as
                &quot;forever chemicals&quot; because their carbon-fluorine bonds
                are among the strongest in chemistry, meaning they do not break
                down naturally in the environment or the human body.
              </p>
              <p className="text-base text-body leading-relaxed">
                PFAS contamination of water sources is a growing concern
                worldwide. These chemicals enter waterways through industrial
                discharge, landfill leachate, and the use of PFAS-containing
                firefighting foam at military bases and airports. Health studies
                have linked long-term PFAS exposure to increased risks of
                certain cancers, thyroid disease, liver damage, immune system
                suppression, and developmental effects in children.
              </p>
            </div>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-12" />

        {/* UK vs EU regulation */}
        <ScrollReveal delay={0}>
          <section className="mt-10">
            <h2 className="font-display text-3xl text-ink italic mb-4">
              UK vs EU regulation
            </h2>
            <div className="max-w-3xl space-y-4">
              <p className="text-base text-body leading-relaxed">
                The UK currently has <strong className="text-ink">no legal limit</strong> for
                PFAS in drinking water. The Drinking Water Inspectorate (DWI)
                has issued non-binding guidance but there is no enforceable
                standard, and water companies are not legally required to test
                for or remove PFAS from tap water.
              </p>
              <p className="text-base text-body leading-relaxed">
                By contrast, the EU introduced a binding limit of{" "}
                <strong className="text-ink">0.1 &micro;g/L for total PFAS</strong> in
                drinking water from January 2026 under the revised Drinking
                Water Directive. The World Health Organization (WHO) also
                recommends a guideline value of 0.1 &micro;g/L. Post-Brexit, the
                UK is not obliged to follow EU standards, and as of {year} has
                not announced plans to adopt an equivalent limit.
              </p>
            </div>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-12" />

        {/* How to remove PFAS */}
        <ScrollReveal delay={0}>
          <section className="mt-10">
            <h2 className="font-display text-3xl text-ink italic mb-4">
              How to remove PFAS from your water
            </h2>
            <div className="max-w-3xl space-y-4">
              <p className="text-base text-body leading-relaxed">
                Reverse osmosis (RO) filtration is the most effective home
                method for removing PFAS, eliminating over 95% of PFAS
                compounds from drinking water. Activated carbon filters can
                reduce some PFAS but are inconsistent. Standard jug filters
                such as BRITA do not remove PFAS. If you are concerned about
                PFAS exposure, an under-sink reverse osmosis system offers the
                best protection.
              </p>
            </div>

            {roProduct && (
              <div className="mt-6 max-w-xl">
                <ProductCard
                  product={roProduct}
                  highlight="Removes >95% of PFAS compounds"
                  pageType="pfas-tracker"
                />
              </div>
            )}
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-12" />

        {/* PostcodeSearch CTA */}
        <ScrollReveal delay={0}>
          <section className="mt-10">
            <h2 className="font-display text-2xl text-ink italic mb-2">
              Check your postcode
            </h2>
            <p className="text-sm text-muted mb-5">
              Get a detailed water quality report including PFAS data for your
              exact area.
            </p>
            <div className="max-w-xl">
              <PostcodeSearch size="sm" />
            </div>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-12" />

        {/* FAQ */}
        <ScrollReveal delay={0}>
          <section className="mt-10">
            <h2 className="font-display text-3xl text-ink italic mb-6">
              Frequently asked questions
            </h2>
            <div className="max-w-3xl space-y-6">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="card p-5 group"
                >
                  <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                    <span className="font-medium text-ink text-base">
                      {faq.question}
                    </span>
                    <ChevronRight className="w-4 h-4 text-faint shrink-0 mt-1 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="text-sm text-body leading-relaxed mt-3">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-12" />

        {/* Related links */}
        <ScrollReveal delay={0}>
          <section className="mt-10 mb-8">
            <h2 className="font-display text-2xl text-ink italic mb-4">
              Related resources
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Link
                href="/contaminant/pfas"
                className="card p-4 group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <FlaskConical className="w-4 h-4 text-[#a855f7]" />
                  <span className="text-sm font-medium text-ink group-hover:text-accent transition-colors">
                    PFAS contaminant profile
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-faint group-hover:text-accent transition-colors" />
              </Link>
              <Link
                href="/guides/pfas-uk-explained"
                className="card p-4 group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-[#a855f7]" />
                  <span className="text-sm font-medium text-ink group-hover:text-accent transition-colors">
                    PFAS in UK water explained
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-faint group-hover:text-accent transition-colors" />
              </Link>
              <Link
                href="/guides/best-water-filter-pfas"
                className="card p-4 group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-[#a855f7]" />
                  <span className="text-sm font-medium text-ink group-hover:text-accent transition-colors">
                    Best water filters for PFAS
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-faint group-hover:text-accent transition-colors" />
              </Link>
              <Link
                href="/filters/reverse-osmosis-systems"
                className="card p-4 group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-[#a855f7]" />
                  <span className="text-sm font-medium text-ink group-hover:text-accent transition-colors">
                    Reverse osmosis systems
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-faint group-hover:text-accent transition-colors" />
              </Link>
            </div>
          </section>
        </ScrollReveal>

        {/* Footer */}
        <footer className="mt-4 pb-6 text-sm text-faint leading-relaxed border-t border-[var(--color-rule)] pt-6">
          Data from the Environment Agency Water Quality Archive. Last updated{" "}
          {formattedDate}. This page tracks PFAS detections in environmental
          water sources — not treated tap water. See our{" "}
          <Link
            href="/about/methodology"
            className="underline underline-offset-2 hover:text-muted transition-colors"
          >
            methodology
          </Link>{" "}
          for more information.
        </footer>
      </div>
      <ScrollToTop />
    </div>
  );
}
