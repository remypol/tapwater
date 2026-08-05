import Image from "next/image";
import Link from "next/link";
import { ExternalLink, ChevronDown } from "lucide-react";
import type { FilterProduct } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/filters";
import { AffiliateLink } from "@/components/affiliate-link";
import { RecommendationTracker } from "@/components/conversion-tracker";
import { getRecommendationMessage } from "@/lib/recommendation";
import { Kicker, TypicalPrice, AffiliateNote, getCandourRows } from "@/components/commerce";

/* ── Types ─────────────────────────────────────────────────────────────── */

type RecommendedFilter = FilterProduct & {
  matchedCount: number;
  matchedContaminants: string[];
};

/* ── Recommendation record — the single "our pick for you" ────────────── */

function RecommendationRecord({
  filter,
  postcodeDistrict,
  waterScoreBand,
  recommendationReason,
}: {
  filter: RecommendedFilter;
  postcodeDistrict: string;
  waterScoreBand: string;
  recommendationReason?: string;
}) {
  const matched = filter.matchedContaminants;
  const alsoListed = filter.removes.filter(
    (r) => !matched.some((m) => m.toLowerCase() === r.toLowerCase()),
  );
  const candour = getCandourRows(filter);
  const reason =
    recommendationReason ?? (matched.join("+").toLowerCase() || "optional-taste-convenience");
  const retailer = filter.affiliateProgram === "amazon" ? "on Amazon" : `at ${filter.brand}`;

  return (
    <article className="card-elevated overflow-hidden">
      <div className="h-0.5 bg-accent" aria-hidden="true" />

      <div className="p-5 sm:p-7">
        {/* Identity band */}
        <div className="flex items-start gap-4 sm:gap-5">
          {filter.imageUrl && (
            <div className="shrink-0 w-16 h-16 sm:w-24 sm:h-24 bg-white ring-1 ring-rule rounded-lg overflow-hidden">
              <Image
                src={filter.imageUrl}
                alt={`${filter.brand} ${filter.model}`}
                width={96}
                height={96}
                className="object-contain w-full h-full p-1.5"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Kicker accent>Our pick for {postcodeDistrict}</Kicker>
            <h3 className="mt-1.5 font-display italic text-xl sm:text-2xl text-ink leading-snug">
              {filter.brand} {filter.model}
            </h3>
            <p className="mt-1 text-sm text-muted">
              {CATEGORY_LABELS[filter.category]}
              {filter.certifications.length > 0 && (
                <> · {filter.certifications.join(", ")}</>
              )}
            </p>
          </div>
        </div>

        {/* Ledger */}
        <dl className="mt-6 border-t border-rule divide-y divide-rule">
          {matched.length > 0 && (
            <div className="py-3.5 sm:grid sm:grid-cols-[172px_1fr] sm:gap-x-4">
              <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted sm:pt-0.5">
                Matched to your report
              </dt>
              <dd className="mt-1.5 sm:mt-0 flex flex-wrap gap-x-4 gap-y-1.5">
                {matched.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
                    {c}
                  </span>
                ))}
              </dd>
            </div>
          )}
          {alsoListed.length > 0 && (
            <div className="py-3.5 sm:grid sm:grid-cols-[172px_1fr] sm:gap-x-4">
              <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted sm:pt-0.5">
                {matched.length === 0 ? "Listed to reduce" : "Also listed to reduce"}
              </dt>
              <dd className="mt-1.5 sm:mt-0 text-sm text-body leading-relaxed">
                {alsoListed.join(", ")}
              </dd>
            </div>
          )}
          {candour && (
            <div className="py-3.5 sm:grid sm:grid-cols-[172px_1fr] sm:gap-x-4">
              <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted sm:pt-0.5">
                {candour.label}
              </dt>
              <dd className="mt-1.5 sm:mt-0">
                <ul className="space-y-1">
                  {candour.lines.map((line) => (
                    <li key={line} className="text-sm font-medium text-ink leading-relaxed">
                      {line}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>

        {/* Price rail */}
        <div className="pt-5 border-t border-rule flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TypicalPrice priceGbp={filter.priceGbp} size="lg" />
          <AffiliateLink
            href={filter.affiliateUrl}
            pageType="postcode"
            postcodeArea={postcodeDistrict}
            waterScoreBand={waterScoreBand}
            recommendationReason={reason}
            productCategory={filter.category}
            productSlug={filter.slug}
            placement="postcode-summary"
            campaign="postcode-result"
            className="btn-ink h-12 px-6 w-full sm:w-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Check current price {retailer}
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </AffiliateLink>
        </div>

        <AffiliateNote withFundingLink className="mt-3" />
      </div>
    </article>
  );
}

/* ── Alternative rows — a subordinate numbered index ───────────────────── */

function AlternativeRow({
  filter,
  index,
  postcodeDistrict,
  waterScoreBand,
}: {
  filter: RecommendedFilter;
  index: number;
  postcodeDistrict: string;
  waterScoreBand: string;
}) {
  return (
    <div className="flex items-center gap-3 sm:gap-4 py-2.5 min-h-11">
      <span className="font-mono text-xs text-muted w-6 shrink-0" aria-hidden="true">
        {String(index + 2).padStart(2, "0")}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">
          {filter.brand} {filter.model}
        </p>
        <p className="text-xs text-muted truncate">
          {CATEGORY_LABELS[filter.category]}
          {filter.matchedContaminants.length > 0 ? (
            <> · matched to {filter.matchedContaminants.join(", ")}</>
          ) : (
            <> · {filter.bestFor}</>
          )}
        </p>
      </div>
      <TypicalPrice priceGbp={filter.priceGbp} size="sm" />
      <AffiliateLink
        href={filter.affiliateUrl}
        pageType="postcode"
        postcodeArea={postcodeDistrict}
        waterScoreBand={waterScoreBand}
        recommendationReason={filter.matchedContaminants.join("+").toLowerCase() || "alternative"}
        productCategory={filter.category}
        productSlug={filter.slug}
        placement="postcode-alternative"
        campaign="postcode-result"
        className="shrink-0 p-3.5 -mr-1.5 rounded-lg text-accent hover:bg-accent-light transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        ariaLabel={`View ${filter.brand} ${filter.model}`}
      >
        <span className="inline-flex items-center gap-1.5 text-sm font-medium">
          View
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
        </span>
      </AffiliateLink>
    </div>
  );
}

/* ── FilterRecommendations — the full section ─────────────────────────── */

interface FilterRecommendationsProps {
  recommendations: RecommendedFilter[];
  postcodeDistrict: string;
  contaminantsFlagged: number;
  waterScoreBand: string;
  /**
   * Water is hard (>= 180 mg/L CaCO3) with nothing flagged. The recommender then
   * returns scale-treating systems, and the generic "a filter is optional" framing
   * would misdescribe why they are here.
   */
  hardWater?: boolean;
}

export function FilterRecommendations({
  recommendations,
  postcodeDistrict,
  contaminantsFlagged,
  waterScoreBand,
  hardWater = false,
}: FilterRecommendationsProps) {
  if (recommendations.length === 0) return null;

  const hero = recommendations[0];
  const alternatives = recommendations.slice(1);
  const matchedLen = hero.matchedContaminants.length;
  const hardWaterOnly = hardWater && contaminantsFlagged === 0;
  const reason =
    hero.matchedContaminants.join("+").toLowerCase() ||
    (hardWaterOnly ? "hard-water-scale" : "optional-taste-convenience");

  const kicker = contaminantsFlagged > 0
    ? `Filter match · ${contaminantsFlagged} flagged in ${postcodeDistrict}`
    : hardWaterOnly
      ? `Hard water · ${postcodeDistrict}`
      : `Filter guidance · ${postcodeDistrict}`;

  const verdict =
    matchedLen > 0 && matchedLen >= contaminantsFlagged
      ? `Matched to what was flagged in ${postcodeDistrict}`
      : matchedLen > 0 && matchedLen < contaminantsFlagged
        ? `Matched to ${matchedLen} of ${contaminantsFlagged} concerns flagged in ${postcodeDistrict}`
        : matchedLen === 0 && contaminantsFlagged > 0
          ? `No direct match for the concerns flagged in ${postcodeDistrict}`
          : hardWaterOnly
            ? `Hard water in ${postcodeDistrict}: these treat scale`
            : `A filter is optional in ${postcodeDistrict}`;

  const message = hardWaterOnly
    ? `Nothing was flagged in ${postcodeDistrict}, but at this hardness limescale builds up in kettles, boilers and pipework. A jug or carbon filter will not change that. The systems below genuinely treat scale; for whole-house protection, a softener quote is further down the page.`
    : getRecommendationMessage({
        postcodeDistrict,
        contaminantsFlagged,
        matchedContaminants: hero.matchedContaminants,
      });

  return (
    <RecommendationTracker context={{
      pageType: "postcode",
      postcodeArea: postcodeDistrict,
      waterScoreBand,
      recommendationReason: reason,
      productCategory: hero.category,
      productSlug: hero.slug,
      placement: "postcode-summary",
      campaign: "postcode-result",
      destinationUrl: hero.affiliateUrl,
    }}>
    <section id="filter-recommendation" className="mt-8 scroll-mt-24">
      {/* Section header — the answer, before any product */}
      <header className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">{kicker}</p>
        <h2 className="mt-2 font-display italic text-2xl sm:text-3xl text-ink tracking-tight text-balance">
          {verdict}
        </h2>
        <p className="mt-3 text-sm sm:text-base text-body leading-relaxed">{message}</p>
      </header>

      {/* Recommendation record — THE one pick */}
      <div className="mt-6">
        <RecommendationRecord
          filter={hero}
          postcodeDistrict={postcodeDistrict}
          waterScoreBand={waterScoreBand}
          recommendationReason={reason}
        />
      </div>

      {/* Alternatives — subordinate to the pick, but not hidden behind a click.
          Collapsed by default they were invisible in practice, and on a clean-water
          report the top pick is the cheapest jug while the alternatives include the
          under-sink system that actually suits a household that filters daily. The
          order is unchanged: this only stops the other two being a secret. */}
      {alternatives.length > 0 && (
        <details open className="mt-4 group">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent hover:underline rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
            Compare {alternatives.length} alternative{alternatives.length !== 1 ? "s" : ""}
          </summary>
          <ul className="mt-1 border-t border-rule divide-y divide-rule">
            {alternatives.map((filter, index) => (
              <li key={filter.id}>
                <AlternativeRow
                  filter={filter}
                  index={index}
                  postcodeDistrict={postcodeDistrict}
                  waterScoreBand={waterScoreBand}
                />
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Disclosure */}
      <p className="text-xs text-muted mt-4">
        Recommendations matched to your area&apos;s water data, not sponsorship.
        We may earn a commission at no extra cost to you.{" "}
        <Link href="/affiliate-disclosure" className="text-accent hover:underline">
          Affiliate disclosure
        </Link>
        {" · "}
        <Link href="/guides/best-water-filters-uk" className="text-accent hover:underline">
          Full filter guide
        </Link>
      </p>
    </section>
    </RecommendationTracker>
  );
}
