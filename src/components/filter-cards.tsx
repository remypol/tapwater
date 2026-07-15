import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Check, Star, ChevronDown } from "lucide-react";
import type { FilterProduct } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/filters";
import { AffiliateLink } from "@/components/affiliate-link";
import { RecommendationTracker } from "@/components/conversion-tracker";
import { getRecommendationMessage, getTransparentLimitations } from "@/lib/recommendation";
import { createAffiliatePayload } from "@/lib/affiliate";

/* ── Types ─────────────────────────────────────────────────────────────── */

type RecommendedFilter = FilterProduct & {
  matchedCount: number;
  matchedContaminants: string[];
};

/* ── Hero Recommendation — the single "our pick for you" ──────────────── */

function HeroRecommendation({
  filter,
  postcodeDistrict,
  contaminantsFlagged,
  waterScoreBand,
}: {
  filter: RecommendedFilter;
  postcodeDistrict: string;
  contaminantsFlagged: number;
  waterScoreBand: string;
}) {
  const removesFromHere = filter.matchedContaminants;
  const limitations = getTransparentLimitations(filter);
  const recommendationReason = removesFromHere.length > 0
    ? removesFromHere.join("+").toLowerCase()
    : "optional-taste-convenience";
  const message = getRecommendationMessage({
    postcodeDistrict,
    contaminantsFlagged,
    matchedContaminants: removesFromHere,
  });

  return (
    <div className="card-elevated overflow-hidden">
      {/* Top accent */}
      <div className="h-1 w-full bg-accent" />

      <div className="p-5 sm:p-6">
        <div className="sm:flex sm:gap-5 sm:items-start">
          {/* Product image */}
          {filter.imageUrl && (
            <div className="hidden sm:block shrink-0 w-28 h-28 rounded-xl bg-wash overflow-hidden">
              <Image
                src={filter.imageUrl}
                alt={`${filter.brand} ${filter.model}`}
                width={112}
                height={112}
                className="object-contain w-full h-full p-2"
              />
            </div>
          )}

          <div className="flex-1">
            {/* Label */}
            <p className="text-xs font-medium text-accent uppercase tracking-wider">
              Our pick for {postcodeDistrict}
            </p>

            {/* Product name */}
            <div className="mt-2">
              <p className="font-display text-xl sm:text-2xl text-ink italic">
                {filter.brand} {filter.model}
              </p>
              <p className="text-sm text-muted mt-0.5">
                {CATEGORY_LABELS[filter.category]}
                {filter.certifications.length > 0 && (
                  <> · {filter.certifications.join(", ")}</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Why this one */}
        <div className="mt-4 p-4 bg-wash rounded-lg">
          <p className="text-sm text-body leading-relaxed">{message}</p>
        </div>

        {/* What it removes — checklist */}
        {removesFromHere.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-faint uppercase tracking-wider mb-2">
              Removes from your water
            </p>
            <div className="flex flex-wrap gap-2">
              {removesFromHere.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 text-sm bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-0.5"
                >
                  <Check className="w-3 h-3" />
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {limitations.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-faint uppercase tracking-wider mb-2">
              Important limitations
            </p>
            <ul className="space-y-1">
              {limitations.map((limitation) => (
                <li key={limitation} className="text-sm text-muted">{limitation}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-sm text-muted mt-4">
          Affiliate link: we may earn a commission at no extra cost to you.{" "}
          <Link href="/affiliate-disclosure" className="text-accent hover:underline">
            How recommendations are funded
          </Link>
        </p>

        {/* Price + CTA row */}
        <div className="mt-3 flex items-center gap-4">
          <AffiliateLink
            href={filter.affiliateUrl}
            pageType="postcode"
            pathname={`/postcode/${postcodeDistrict}`}
            postcodeArea={postcodeDistrict}
            waterScoreBand={waterScoreBand}
            recommendationReason={recommendationReason}
            productCategory={filter.category}
            productSlug={filter.slug}
            placement="postcode-summary"
            campaign="postcode-result"
            className="flex-1 bg-btn text-white py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-btn-hover transition-colors"
          >
            Check current price
            <ExternalLink className="w-4 h-4" />
          </AffiliateLink>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted">Typical price</p>
            <p className="font-data text-xl font-bold text-ink">
              {filter.priceGbp > 0 ? `£${filter.priceGbp.toLocaleString("en-GB")}` : "Check price"}
            </p>
            <div className="flex items-center gap-1 justify-end">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs text-muted">{filter.rating}/5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Alternative cards — compact, below the hero ──────────────────────── */

function AlternativeCard({
  filter,
  postcodeDistrict,
  waterScoreBand,
}: {
  filter: RecommendedFilter;
  postcodeDistrict: string;
  waterScoreBand: string;
}) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-faint">{CATEGORY_LABELS[filter.category]}</p>
        <p className="font-semibold text-ink text-sm truncate">
          {filter.brand} {filter.model}
        </p>
        {filter.matchedContaminants.length > 0 && (
          <p className="text-xs text-muted mt-0.5 truncate">
            Removes {filter.matchedContaminants.join(", ")}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="font-data font-bold text-ink">{filter.priceGbp > 0 ? `£${filter.priceGbp.toLocaleString("en-GB")}` : "Check price"}</p>
        <div className="flex items-center gap-0.5 justify-end">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span className="text-xs text-muted">{filter.rating}</span>
        </div>
      </div>
      <AffiliateLink
        href={filter.affiliateUrl}
        pageType="postcode"
        pathname={`/postcode/${postcodeDistrict}`}
        postcodeArea={postcodeDistrict}
        waterScoreBand={waterScoreBand}
        recommendationReason={filter.matchedContaminants.join("+").toLowerCase() || "alternative"}
        productCategory={filter.category}
        productSlug={filter.slug}
        placement="postcode-alternative"
        campaign="postcode-result"
        className="shrink-0 p-3.5 rounded-lg border border-rule hover:border-accent text-accent transition-colors"
        ariaLabel={`View ${filter.brand} ${filter.model}`}
      >
        <ExternalLink className="w-4 h-4" />
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
}

export function FilterRecommendations({
  recommendations,
  postcodeDistrict,
  contaminantsFlagged,
  waterScoreBand,
}: FilterRecommendationsProps) {
  if (recommendations.length === 0) return null;

  const hero = recommendations[0];
  const alternatives = recommendations.slice(1);
  const reason = hero.matchedContaminants.join("+").toLowerCase() || "optional-taste-convenience";

  return (
    <RecommendationTracker payload={createAffiliatePayload({
      pageType: "postcode",
      pathname: `/postcode/${postcodeDistrict}`,
      postcodeArea: postcodeDistrict,
      waterScoreBand,
      recommendationReason: reason,
      productCategory: hero.category,
      productSlug: hero.slug,
      placement: "postcode-summary",
      campaign: "postcode-result",
      destinationUrl: hero.affiliateUrl,
    })}>
    <section id="filter-recommendation" className="mt-8 scroll-mt-24">
      {/* Section header */}
      <h2 className="text-xl font-semibold text-ink tracking-tight">
        {hero.matchedContaminants.length > 0
          ? "Best fit for your water"
          : contaminantsFlagged > 0
            ? `Filter options for ${postcodeDistrict}`
          : `Optional filter for ${postcodeDistrict}`}
      </h2>
      {contaminantsFlagged > 0 && (
        <p className="text-sm text-body mt-1.5 max-w-2xl mb-6">
          {contaminantsFlagged} contaminant{contaminantsFlagged !== 1 ? "s" : ""} flagged
          in {postcodeDistrict}. These filters are matched to what was found in your water.
        </p>
      )}
      {contaminantsFlagged === 0 && (
        <p className="text-sm text-muted mt-1.5 mb-6">
          General-purpose filters for common UK tap water concerns.
        </p>
      )}

      {/* Hero recommendation — THE one pick */}
      <HeroRecommendation
        filter={hero}
        postcodeDistrict={postcodeDistrict}
        contaminantsFlagged={contaminantsFlagged}
        waterScoreBand={waterScoreBand}
      />

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <details className="mt-4 group">
          <summary className="cursor-pointer text-sm text-accent font-medium flex items-center gap-1 hover:underline">
            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
            {alternatives.length} more option{alternatives.length !== 1 ? "s" : ""}
          </summary>
          <div className="mt-3 space-y-2">
            {alternatives.map((filter) => (
              <AlternativeCard
                key={filter.id}
                filter={filter}
                postcodeDistrict={postcodeDistrict}
                waterScoreBand={waterScoreBand}
              />
            ))}
          </div>
        </details>
      )}

      {/* Disclosure */}
      <p className="text-xs text-faint mt-4">
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

interface FilterCardsProps {
  filters: FilterProduct[];
  postcode: string;
}

export function FilterCards({ filters }: FilterCardsProps) {
  return (
    <section>
      <div className="space-y-3">
        {filters.map((filter) => (
          <div key={filter.id} className="card p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-faint">{CATEGORY_LABELS[filter.category]}</p>
              <p className="font-semibold text-ink text-sm">{filter.brand} {filter.model}</p>
              {filter.certifications.length > 0 && (
                <p className="text-xs text-muted mt-0.5">{filter.certifications.join(", ")}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="font-data font-bold text-ink">{filter.priceGbp > 0 ? `£${filter.priceGbp.toLocaleString("en-GB")}` : "Check price"}</p>
              <div className="flex items-center gap-0.5 justify-end">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-xs text-muted">{filter.rating}</span>
              </div>
            </div>
            <AffiliateLink
              href={filter.affiliateUrl}
              pageType="filter-list"
              pathname="/filters"
              recommendationReason="product-catalog"
              productCategory={filter.category}
              productSlug={filter.slug}
              placement="filter-grid"
              campaign="product-catalog"
              className="shrink-0 text-sm font-medium text-accent hover:underline flex items-center gap-1 p-3"
            >
              View
              <ExternalLink className="w-3.5 h-3.5" />
            </AffiliateLink>
          </div>
        ))}
      </div>
      <p className="text-xs text-faint mt-4">
        We may earn a commission through affiliate links.{" "}
        <Link href="/affiliate-disclosure" className="text-accent hover:underline">
          Affiliate disclosure
        </Link>
      </p>
    </section>
  );
}
