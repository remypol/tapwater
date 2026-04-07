import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MapPin, ShieldCheck } from "lucide-react";
import { BreadcrumbSchema, ArticleSchema, FAQSchema } from "@/components/json-ld";
import { ScrollReveal } from "@/components/scroll-reveal";
import { PostcodeSearch } from "@/components/postcode-search";
import { ProductCard } from "@/components/product-card";
import { PfasCompoundChart } from "@/components/pfas-compound-chart";
import { PfasMapWrapper as PfasMap } from "@/components/pfas-map-wrapper";
import { ScrollToTop } from "@/components/scroll-to-top";
import { PfasTrendChartWrapper as PfasTrendChart } from "@/components/pfas-trend-chart-wrapper";
import { getPfasCityData, getPfasCitySlugs } from "@/lib/pfas-data";
import { getProductIncludingUnavailable } from "@/lib/products";
import { CITIES } from "@/lib/cities";

export const revalidate = 86400;

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateStaticParams() {
  return getPfasCitySlugs().map((city) => ({ city }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug } = await params;
  const cityDef = CITIES.find((c) => c.slug === citySlug);
  const cityName = cityDef?.name ?? citySlug;
  const year = new Date().getFullYear();

  // Keep title under 45 chars (before template suffix)
  const title = `PFAS in ${cityName} Water (${year})`;

  const description = `PFAS forever chemical levels in ${cityName} water. ${year} detection data, sampling points, and compound breakdown from Environment Agency monitoring.`;

  return {
    title: title.length <= 45 ? title : `PFAS in ${cityName} Water`,
    description:
      description.length <= 155
        ? description
        : `PFAS forever chemical levels in ${cityName} water. Detection data and compound breakdown from Environment Agency monitoring.`,
    openGraph: {
      title: `PFAS in ${cityName} Water (${year})`,
      description: `Track PFAS levels in ${cityName} with Environment Agency monitoring data.`,
      url: `https://www.tapwater.uk/pfas/${citySlug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `PFAS in ${cityName} Water (${year})`,
      description: `Track PFAS levels in ${cityName} from Environment Agency data.`,
    },
  };
}

function getNearbyCities(currentSlug: string): { slug: string; name: string }[] {
  const currentCity = CITIES.find((c) => c.slug === currentSlug);
  if (!currentCity) return [];

  // Prefer same-region cities, then others
  const sameRegion = CITIES.filter(
    (c) => c.slug !== currentSlug && c.region === currentCity.region
  );
  const otherRegion = CITIES.filter(
    (c) => c.slug !== currentSlug && c.region !== currentCity.region
  );

  const candidates = [...sameRegion, ...otherRegion];
  return candidates.slice(0, 6).map((c) => ({ slug: c.slug, name: c.name }));
}

export default async function PfasCityPage({ params }: Props) {
  const { city: citySlug } = await params;
  const data = await getPfasCityData(citySlug);
  const year = new Date().getFullYear();
  const roProduct = getProductIncludingUnavailable("waterdrop-g3p600");
  const nearbyCities = getNearbyCities(citySlug);

  const formattedDate = data.latestDate
    ? new Date(data.latestDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : `${year}`;

  // Compute map center from detection points
  const mapCenter: [number, number] | undefined =
    data.detectionPoints.length > 0
      ? [
          data.detectionPoints.reduce((s, p) => s + p.lng, 0) /
            data.detectionPoints.length,
          data.detectionPoints.reduce((s, p) => s + p.lat, 0) /
            data.detectionPoints.length,
        ]
      : undefined;

  // FAQs (city-specific)
  const faqs = data.pfasDetected
    ? [
        {
          question: `Has PFAS been found in ${data.city} water?`,
          answer: `Yes. Environment Agency monitoring has detected ${data.compoundsDetected.length} PFAS compounds across ${data.samplingPointCount} sampling points in water sources near ${data.city}. The highest recorded level is ${data.highestLevel.toFixed(3)} \u00b5g/L (${data.highestCompound}). Note that this is environmental monitoring of rivers and groundwater, not treated tap water.`,
        },
        {
          question: `What PFAS compounds were found in ${data.city}?`,
          answer: `The following PFAS compounds have been detected near ${data.city}: ${data.compoundsDetected.join(", ")}. ${data.highestCompound} was recorded at the highest level of ${data.highestLevel.toFixed(3)} \u00b5g/L.`,
        },
        {
          question: `Is ${data.city} tap water safe to drink despite PFAS?`,
          answer: `${data.city} tap water meets all current UK legal standards. However, the UK has no legal limit for PFAS in drinking water. The Environment Agency data shows PFAS in source water (rivers and groundwater), not in treated tap water. Water treatment may reduce PFAS levels, but the extent of removal is not publicly reported.`,
        },
        {
          question: `How can I remove PFAS from my water in ${data.city}?`,
          answer: `The most effective method is a reverse osmosis (RO) filtration system, which removes over 95% of PFAS compounds. Standard carbon filters and jug filters like BRITA do not effectively remove PFAS. An under-sink RO system is recommended for ${data.city} households concerned about PFAS exposure.`,
        },
      ]
    : [
        {
          question: `Has PFAS been found in ${data.city} water?`,
          answer: `No. Environment Agency monitoring has not detected PFAS compounds in water sources near ${data.city} as of the latest available data. This is a positive result, though monitoring coverage varies by area.`,
        },
        {
          question: `Is ${data.city} tap water safe from PFAS?`,
          answer: `Based on available Environment Agency data, no PFAS has been detected in water sources near ${data.city}. However, monitoring coverage is not comprehensive, and some PFAS sources may not yet be tested.`,
        },
        {
          question: `Should I worry about PFAS in ${data.city}?`,
          answer: `Current monitoring shows no PFAS detections near ${data.city}, which is reassuring. However, PFAS can come from many sources and monitoring coverage is limited. If you want extra protection, a reverse osmosis filter removes over 95% of PFAS compounds.`,
        },
        {
          question: `Does ${data.city} water company test for PFAS?`,
          answer: `UK water companies are not legally required to test for PFAS in drinking water. The data shown here comes from Environment Agency environmental monitoring of rivers and groundwater, not from water company testing of treated tap water.`,
        },
      ];

  // ── PFAS detected ──
  if (data.pfasDetected) {
    return (
      <div className="bg-hero min-h-screen">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-8 lg:py-14">
          <BreadcrumbSchema
            items={[
              { name: "Home", url: "https://www.tapwater.uk" },
              { name: "PFAS Tracker", url: "https://www.tapwater.uk/pfas" },
              {
                name: data.city,
                url: `https://www.tapwater.uk/pfas/${citySlug}`,
              },
            ]}
          />
          <ArticleSchema
            headline={`PFAS in ${data.city} Water (${year})`}
            description={`PFAS forever chemical detections in ${data.city} water sources from Environment Agency monitoring.`}
            url={`https://www.tapwater.uk/pfas/${citySlug}`}
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
            <Link href="/pfas" className="hover:text-accent transition-colors">
              PFAS Tracker
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-ink font-medium">{data.city}</span>
          </nav>

          {/* Header */}
          <header className="mt-6 mb-10">
            <p className="text-xs uppercase tracking-[0.15em] text-[#a855f7] font-semibold flex items-center gap-1.5 animate-fade-up delay-1">
              <MapPin className="w-3 h-3" />
              {data.region}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-ink tracking-tight mt-2 animate-fade-up delay-2">
              PFAS in {data.city} Water
            </h1>
            <p className="text-muted mt-2 max-w-2xl animate-fade-up delay-3">
              Based on Environment Agency monitoring data. Last updated{" "}
              <span className="font-medium text-ink">{formattedDate}</span>.
            </p>
          </header>

          {/* GEO summary */}
          <div className="card p-5 border-l-4 border-l-[#a855f7] mb-8">
            <p className="text-base text-body leading-relaxed">
              <strong className="text-ink">
                According to TapWater.uk&apos;s analysis,{" "}
                {data.compoundsDetected.length} PFAS compound
                {data.compoundsDetected.length !== 1 ? "s have" : " has"} been
                detected across {data.samplingPointCount} sampling point
                {data.samplingPointCount !== 1 ? "s" : ""} in {data.city}.
              </strong>{" "}
              The highest recorded level is {data.highestLevel.toFixed(3)}{" "}
              &micro;g/L ({data.highestCompound}).
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-up delay-4">
            <div className="card p-4 text-center">
              <p className="text-xs text-muted uppercase tracking-wider">
                Compounds detected
              </p>
              <p className="font-data text-3xl font-bold text-[#a855f7] mt-1">
                {data.compoundsDetected.length}
              </p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-muted uppercase tracking-wider">
                Sampling points
              </p>
              <p className="font-data text-3xl font-bold text-ink mt-1">
                {data.samplingPointCount}
              </p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-muted uppercase tracking-wider">
                Highest level
              </p>
              <p className="font-data text-3xl font-bold text-ink mt-1">
                {data.highestLevel.toFixed(3)}
                <span className="text-sm text-faint font-normal">
                  {" "}
                  &micro;g/L
                </span>
              </p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-muted uppercase tracking-wider">
                Latest date
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
              <PfasMap
                points={data.detectionPoints}
                center={mapCenter}
                zoom={11}
              />

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
              </div>
            </section>
          </ScrollReveal>

          {/* Trend chart */}
          {data.trendData.length >= 2 && (
            <>
              <hr className="border-rule mt-10" />
              <ScrollReveal delay={0}>
                <section className="mt-8">
                  <h2 className="font-display text-3xl text-ink italic mb-4">
                    PFAS levels over time
                  </h2>
                  <div className="card p-5 overflow-x-auto">
                    <PfasTrendChart data={data.trendData} />
                  </div>
                  <p className="mt-2 text-xs text-faint">
                    Monthly aggregate PFAS levels. Dashed line shows WHO
                    guideline (0.1 &micro;g/L).
                  </p>
                </section>
              </ScrollReveal>
            </>
          )}

          {/* Compound breakdown */}
          {data.compoundBreakdown.length > 0 && (
            <>
              <hr className="border-rule mt-10" />
              <ScrollReveal delay={0}>
                <section className="mt-8">
                  <h2 className="font-display text-3xl text-ink italic mb-4">
                    Compounds detected
                  </h2>
                  <div className="card p-5">
                    <PfasCompoundChart compounds={data.compoundBreakdown} />
                  </div>
                </section>
              </ScrollReveal>
            </>
          )}

          {/* Sampling points */}
          <hr className="border-rule mt-10" />
          <ScrollReveal delay={0}>
            <section className="mt-8">
              <h2 className="font-display text-3xl text-ink italic mb-2">
                Sampling points
              </h2>
              <p className="text-sm text-muted mb-6">
                Environment Agency monitoring locations near {data.city}.
              </p>

              <div className="card overflow-hidden">
                <div className="hidden sm:grid sm:grid-cols-[1fr_100px_100px_120px] gap-3 px-5 py-3 bg-[var(--color-wash)] border-b border-[var(--color-rule)] text-xs text-faint uppercase tracking-wider font-semibold">
                  <span>Location</span>
                  <span className="text-right">Max level</span>
                  <span>Compound</span>
                  <span>Coordinates</span>
                </div>

                {data.detectionPoints.map((point, i) => (
                  <div
                    key={`${point.label}-${i}`}
                    className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_100px_100px_120px] gap-x-3 gap-y-0.5 items-center px-5 py-3.5 border-b border-[var(--color-rule)] last:border-b-0"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#a855f7] shrink-0" />
                      <span className="text-sm text-ink truncate">
                        {point.label}
                      </span>
                    </div>

                    <span className="font-data text-sm font-bold text-right tabular-nums text-[#a855f7]">
                      {point.maxLevel.toFixed(3)}
                      <span className="text-xs text-faint font-normal">
                        {" "}
                        &micro;g/L
                      </span>
                    </span>

                    <span className="text-xs text-muted hidden sm:block truncate">
                      {point.compound}
                    </span>

                    <span className="text-xs text-faint font-data hidden sm:block tabular-nums">
                      {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </ScrollReveal>

          <hr className="border-rule mt-10" />

          {/* What this means */}
          <ScrollReveal delay={0}>
            <section className="mt-8">
              <h2 className="font-display text-3xl text-ink italic mb-4">
                What this means for your tap water
              </h2>
              <div className="max-w-3xl space-y-4">
                <p className="text-base text-body leading-relaxed">
                  <strong className="text-ink">Important context:</strong> the
                  Environment Agency data shown here is from environmental
                  monitoring of rivers and groundwater &mdash; not treated tap
                  water. PFAS detected in source water does not necessarily mean
                  the same levels are present in the water that comes out of
                  your tap.
                </p>
                <p className="text-base text-body leading-relaxed">
                  Water treatment processes can reduce PFAS concentrations,
                  though the effectiveness varies by treatment method and PFAS
                  compound. UK water companies are not required to publish PFAS
                  removal rates. If you are concerned, a reverse osmosis filter
                  offers the most reliable protection at home.
                </p>
              </div>
            </section>
          </ScrollReveal>

          <hr className="border-rule mt-10" />

          {/* Product recommendation */}
          <ScrollReveal delay={0}>
            <section className="mt-8">
              <h2 className="font-display text-3xl text-ink italic mb-4">
                How to reduce PFAS exposure
              </h2>
              <div className="max-w-3xl">
                <p className="text-base text-body leading-relaxed mb-6">
                  A reverse osmosis system is the most effective way to remove
                  PFAS from your drinking water at home, eliminating over 95% of
                  forever chemicals.
                </p>
              </div>

              {roProduct && (
                <div className="max-w-xl">
                  <ProductCard
                    product={roProduct}
                    highlight="Removes >95% of PFAS compounds"
                    pageType="pfas-city"
                  />
                </div>
              )}
            </section>
          </ScrollReveal>

          <hr className="border-rule mt-10" />

          {/* Nearby cities */}
          {nearbyCities.length > 0 && (
            <ScrollReveal delay={0}>
              <section className="mt-8">
                <h2 className="font-display text-2xl text-ink italic mb-4">
                  PFAS data for nearby cities
                </h2>
                <div className="flex flex-wrap gap-2">
                  {nearbyCities.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/pfas/${c.slug}`}
                      className="pill"
                    >
                      <MapPin className="w-3 h-3 text-[#a855f7] mr-1" />
                      {c.name}
                    </Link>
                  ))}
                </div>
              </section>
            </ScrollReveal>
          )}

          <hr className="border-rule mt-10" />

          {/* PostcodeSearch CTA */}
          <ScrollReveal delay={0}>
            <section className="mt-8">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-[#a855f7] shrink-0" />
                <h2 className="font-display text-2xl text-ink italic">
                  Check your postcode
                </h2>
              </div>
              <p className="text-sm text-muted mt-1 mb-5">
                Get a detailed water quality report for your exact area in{" "}
                {data.city}.
              </p>
              <div className="max-w-xl">
                <PostcodeSearch size="sm" />
              </div>
            </section>
          </ScrollReveal>

          <hr className="border-rule mt-10" />

          {/* FAQ */}
          <ScrollReveal delay={0}>
            <section className="mt-8">
              <h2 className="font-display text-3xl text-ink italic mb-6">
                Frequently asked questions
              </h2>
              <div className="max-w-3xl space-y-6">
                {faqs.map((faq) => (
                  <details key={faq.question} className="card p-5 group">
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

          {/* Footer */}
          <footer className="mt-10 pb-4 text-sm text-faint leading-relaxed border-t border-[var(--color-rule)] pt-6">
            PFAS data from the Environment Agency Water Quality Archive.
            Environmental monitoring of rivers and groundwater near {data.city}{" "}
            &mdash; not treated tap water. Last updated {formattedDate}. See
            our{" "}
            <Link
              href="/about/methodology"
              className="underline underline-offset-2 hover:text-muted transition-colors"
            >
              methodology
            </Link>
            .
          </footer>
        </div>
        <ScrollToTop />
      </div>
    );
  }

  // ── PFAS not detected ──
  return (
    <div className="bg-hero min-h-screen">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-8 lg:py-14">
        <BreadcrumbSchema
          items={[
            { name: "Home", url: "https://www.tapwater.uk" },
            { name: "PFAS Tracker", url: "https://www.tapwater.uk/pfas" },
            {
              name: data.city,
              url: `https://www.tapwater.uk/pfas/${citySlug}`,
            },
          ]}
        />
        <ArticleSchema
          headline={`PFAS in ${data.city} Water (${year})`}
          description={`No PFAS detections found in ${data.city} water sources from Environment Agency monitoring.`}
          url={`https://www.tapwater.uk/pfas/${citySlug}`}
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
          <Link href="/pfas" className="hover:text-accent transition-colors">
            PFAS Tracker
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink font-medium">{data.city}</span>
        </nav>

        {/* Header */}
        <header className="mt-6 mb-10">
          <p className="text-xs uppercase tracking-[0.15em] text-[#a855f7] font-semibold flex items-center gap-1.5 animate-fade-up delay-1">
            <MapPin className="w-3 h-3" />
            {data.region}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-ink tracking-tight mt-2 animate-fade-up delay-2">
            PFAS in {data.city} Water
          </h1>
        </header>

        {/* GEO summary — no detections */}
        <div className="card p-5 border-l-4 border-l-[#22c55e] mb-8">
          <p className="text-base text-body leading-relaxed">
            <strong className="text-ink">
              Good news: Environment Agency monitoring has not detected PFAS
              compounds in water sources near {data.city} as of the latest
              available data.
            </strong>
          </p>
        </div>

        {/* Single stat */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md animate-fade-up delay-4">
          <div className="card p-4 text-center">
            <p className="text-xs text-muted uppercase tracking-wider">
              PFAS detections
            </p>
            <p className="font-data text-3xl font-bold text-[var(--color-safe)] mt-1">
              0
            </p>
          </div>
        </div>

        <hr className="border-rule mt-10" />

        {/* What this means */}
        <ScrollReveal delay={0}>
          <section className="mt-8">
            <h2 className="font-display text-3xl text-ink italic mb-4">
              What this means for your tap water
            </h2>
            <div className="max-w-3xl space-y-4">
              <p className="text-base text-body leading-relaxed">
                No PFAS compounds have been detected in Environment Agency
                monitoring of water sources near {data.city}. This is a positive
                result that suggests local rivers and groundwater used for
                drinking water supply are not contaminated with forever
                chemicals at detectable levels.
              </p>
              <p className="text-base text-body leading-relaxed">
                However, it is important to note that monitoring coverage varies
                across the UK. Not all water sources are tested for PFAS, and
                the absence of detection does not guarantee the absence of PFAS
                at very low concentrations. The Environment Agency continues to
                expand its monitoring programme.
              </p>
            </div>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-10" />

        {/* How to protect yourself */}
        <ScrollReveal delay={0}>
          <section className="mt-8">
            <h2 className="font-display text-3xl text-ink italic mb-4">
              How to protect yourself
            </h2>
            <div className="max-w-3xl space-y-4">
              <p className="text-base text-body leading-relaxed">
                Even though no PFAS has been detected near {data.city}, these
                chemicals can enter water supplies from sources not yet
                monitored, such as private land, old landfill sites, or
                industrial facilities. A reverse osmosis filter provides peace
                of mind by removing over 95% of PFAS compounds along with many
                other contaminants.
              </p>
            </div>

            {roProduct && (
              <div className="mt-6 max-w-xl">
                <ProductCard
                  product={roProduct}
                  highlight="Removes >95% of PFAS compounds"
                  pageType="pfas-city"
                />
              </div>
            )}
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-10" />

        {/* Nearby cities */}
        {nearbyCities.length > 0 && (
          <ScrollReveal delay={0}>
            <section className="mt-8">
              <h2 className="font-display text-2xl text-ink italic mb-4">
                PFAS data for nearby cities
              </h2>
              <div className="flex flex-wrap gap-2">
                {nearbyCities.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/pfas/${c.slug}`}
                    className="pill"
                  >
                    <MapPin className="w-3 h-3 text-[#a855f7] mr-1" />
                    {c.name}
                  </Link>
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}

        <hr className="border-rule mt-10" />

        {/* PostcodeSearch CTA */}
        <ScrollReveal delay={0}>
          <section className="mt-8">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-[var(--color-safe)] shrink-0" />
              <h2 className="font-display text-2xl text-ink italic">
                Check your postcode
              </h2>
            </div>
            <p className="text-sm text-muted mt-1 mb-5">
              Get a full water quality report for your area in {data.city}.
            </p>
            <div className="max-w-xl">
              <PostcodeSearch size="sm" />
            </div>
          </section>
        </ScrollReveal>

        <hr className="border-rule mt-10" />

        {/* FAQ */}
        <ScrollReveal delay={0}>
          <section className="mt-8">
            <h2 className="font-display text-3xl text-ink italic mb-6">
              Frequently asked questions
            </h2>
            <div className="max-w-3xl space-y-6">
              {faqs.map((faq) => (
                <details key={faq.question} className="card p-5 group">
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

        {/* Footer */}
        <footer className="mt-10 pb-4 text-sm text-faint leading-relaxed border-t border-[var(--color-rule)] pt-6">
          PFAS data from the Environment Agency Water Quality Archive.
          Environmental monitoring of rivers and groundwater near {data.city}.
          See our{" "}
          <Link
            href="/about/methodology"
            className="underline underline-offset-2 hover:text-muted transition-colors"
          >
            methodology
          </Link>
          .
        </footer>
      </div>
      <ScrollToTop />
    </div>
  );
}
