import Link from "next/link";
import { ExternalLink, Check, Star, ArrowRight, ChevronDown } from "lucide-react";
import type { FilterProduct } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/filters";

/* ── Types ─────────────────────────────────────────────────────────────── */

type RecommendedFilter = FilterProduct & {
  matchedCount: number;
  matchedContaminants: string[];
};

/* ── Hero Recommendation — the single "our pick for you" ──────────────── */

function HeroRecommendation({
  filter,
  postcodeDistrict,
  flaggedNames,
}: {
  filter: RecommendedFilter;
  postcodeDistrict: string;
  flaggedNames: string[];
}) {
  // Build the narrative
  const removesFromHere = filter.matchedContaminants;
  const removesCount = removesFromHere.length;

  return (
    <div className="card-elevated overflow-hidden">
      {/* Top accent */}
      <div className="h-1 w-full bg-accent" />

      <div className="p-5 sm:p-6">
        {/* Label */}
        <p className="text-xs font-medium text-accent uppercase tracking-wider">
          Our pick for {postcodeDistrict}
        </p>

        {/* Product name */}
        <div className="mt-3">
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

        {/* Why this one — the narrative */}
        <div className="mt-4 p-4 bg-wash rounded-lg">
          <p className="text-sm text-body leading-relaxed">
            {removesCount > 0 ? (
              <>
                {removesCount === 1 ? (
                  <>
                    The {filter.brand} {filter.model} is certified to remove{" "}
                    <strong className="text-ink">{removesFromHere[0]}</strong>,
                    which was flagged in {postcodeDistrict}.
                  </>
                ) : removesCount === 2 ? (
                  <>
                    Removes both{" "}
                    <strong className="text-ink">{removesFromHere[0]}</strong> and{" "}
                    <strong className="text-ink">{removesFromHere[1]}</strong> —
                    the two contaminants flagged in {postcodeDistrict}.
                  </>
                ) : (
                  <>
                    Removes{" "}
                    <strong className="text-ink">
                      {removesFromHere.slice(0, -1).join(", ")}
                    </strong>{" "}
                    and{" "}
                    <strong className="text-ink">
                      {removesFromHere[removesFromHere.length - 1]}
                    </strong>{" "}
                    — all {removesCount} contaminants flagged in {postcodeDistrict}.
                  </>
                )}
                {" "}
                {filter.category === "jug"
                  ? "No installation needed — just fill and pour."
                  : filter.category === "countertop"
                    ? "Sits on your worktop — no plumber needed."
                    : filter.category === "under_sink"
                      ? "Fits under your kitchen sink for filtered water on tap."
                      : "Protects every tap in your home."}
              </>
            ) : (
              <>
                A solid all-round filter for {postcodeDistrict}. Removes{" "}
                {filter.removes.slice(0, 3).join(", ")} and more.{" "}
                {filter.category === "jug"
                  ? "No installation needed."
                  : "Professional-grade filtration."}
              </>
            )}
          </p>
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

        {/* Price + CTA row */}
        <div className="mt-5 flex items-center gap-4">
          <a
            href={filter.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex-1 bg-ink text-white py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
          >
            Check price & reviews
            <ArrowRight className="w-4 h-4" />
          </a>
          <div className="text-right shrink-0">
            <p className="font-data text-xl font-bold text-ink">
              £{filter.priceGbp}
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

function AlternativeCard({ filter }: { filter: RecommendedFilter }) {
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
        <p className="font-data font-bold text-ink">£{filter.priceGbp}</p>
        <div className="flex items-center gap-0.5 justify-end">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span className="text-[11px] text-muted">{filter.rating}</span>
        </div>
      </div>
      <a
        href={filter.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="shrink-0 p-2 rounded-lg border border-rule hover:border-accent hover:text-accent transition-colors"
        aria-label={`View ${filter.brand} ${filter.model}`}
      >
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}

/* ── FilterRecommendations — the full section ─────────────────────────── */

interface FilterRecommendationsProps {
  recommendations: RecommendedFilter[];
  postcodeDistrict: string;
  contaminantsFlagged: number;
}

export function FilterRecommendations({
  recommendations,
  postcodeDistrict,
  contaminantsFlagged,
}: FilterRecommendationsProps) {
  if (recommendations.length === 0) return null;

  const hero = recommendations[0];
  const alternatives = recommendations.slice(1);
  const flaggedNames = hero.matchedContaminants;

  return (
    <section className="mt-10">
      {/* Section header */}
      <h2 className="text-xl font-semibold text-ink tracking-tight">
        {contaminantsFlagged > 0
          ? "What removes these from your water"
          : `Filters for ${postcodeDistrict}`}
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
        flaggedNames={flaggedNames}
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
              <AlternativeCard key={filter.id} filter={filter} />
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
  );
}

/* ── FilterCards — standalone (used in guide pages) ───────────────────── */

interface FilterCardsProps {
  filters: FilterProduct[];
  postcode: string;
}

export function FilterCards({ filters, postcode }: FilterCardsProps) {
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
              <p className="font-data font-bold text-ink">£{filter.priceGbp}</p>
              <div className="flex items-center gap-0.5 justify-end">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-[11px] text-muted">{filter.rating}</span>
              </div>
            </div>
            <a
              href={filter.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="shrink-0 text-sm font-medium text-accent hover:underline flex items-center gap-1"
            >
              View
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
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
