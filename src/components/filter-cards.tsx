import Link from "next/link";
import { ExternalLink, ShieldCheck, Check, Star, Award, ArrowUpRight } from "lucide-react";
import type { FilterProduct } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/filters";
import { ScrollReveal } from "@/components/scroll-reveal";

/* ── Helpers ────────────────────────────────────────────────────────────── */

const MOBILE_REMOVES_LIMIT = 3;

const STRIP_COLOR: Record<FilterProduct["badge"], string> = {
  "best-match": "bg-blue-600",
  budget: "bg-emerald-600",
  "whole-house": "bg-violet-600",
};

const BADGE_CONFIG: Record<
  FilterProduct["badge"],
  { label: string; className: string; icon: React.ReactNode }
> = {
  "best-match": {
    label: "Best Match",
    className: "bg-blue-50 text-blue-700",
    icon: <Award className="w-3 h-3" />,
  },
  budget: {
    label: "Budget Pick",
    className: "bg-emerald-50 text-emerald-700",
    icon: null,
  },
  "whole-house": {
    label: "Whole House",
    className: "bg-violet-50 text-violet-700",
    icon: null,
  },
};

/* ── Sub-components ─────────────────────────────────────────────────────── */

function RemovesList({ removes }: { removes: string[] }) {
  const overflow = removes.length - MOBILE_REMOVES_LIMIT;

  return (
    <div className="px-5">
      <p className="text-xs font-medium text-ink mb-1.5">Removes</p>
      <ul className="space-y-1">
        {removes.map((contaminant, i) => (
          <li
            key={contaminant}
            className={[
              "flex items-center gap-1.5 text-sm text-body",
              i >= MOBILE_REMOVES_LIMIT ? "hidden sm:flex" : "",
            ].join(" ")}
          >
            <Check className="w-3.5 h-3.5 text-safe shrink-0" />
            {contaminant.charAt(0).toUpperCase() + contaminant.slice(1)}
          </li>
        ))}
      </ul>
      {overflow > 0 && (
        <p className="text-xs text-muted mt-1 sm:hidden">+{overflow} more</p>
      )}
    </div>
  );
}

/* ── FilterCard — used in postcode pages (contaminant-matched) ──────── */

interface FilterCardProps {
  filter: FilterProduct & {
    matchedCount: number;
    matchedContaminants: string[];
  };
  postcodeDistrict: string;
  index: number;
}

function FilterCard({ filter, postcodeDistrict, index }: FilterCardProps) {
  const badge = BADGE_CONFIG[filter.badge];
  const stripColor = STRIP_COLOR[filter.badge];

  return (
    <ScrollReveal delay={index * 100}>
      <div className="card-elevated overflow-hidden flex flex-col w-[280px] shrink-0 snap-start md:w-auto md:shrink h-full">
        {/* Colored top strip */}
        <div className={`h-[3px] w-full ${stripColor}`} />

        {/* Badge */}
        <div className="mt-4 mx-5">
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 ${badge.className}`}
          >
            {badge.icon}
            {badge.label}
          </span>
        </div>

        {/* Product info */}
        <div className="mt-3 px-5">
          <p className="text-sm text-muted">{filter.brand}</p>
          <p className="font-semibold text-ink text-sm sm:text-base leading-snug">
            {filter.model}
          </p>
          <p className="text-xs text-muted mt-0.5">
            {CATEGORY_LABELS[filter.category]}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-rule mx-5 my-3" />

        {/* Matched contaminants for this postcode */}
        {filter.matchedContaminants.length > 0 ? (
          <div className="px-5">
            <p className="text-xs font-medium text-ink mb-1.5">
              Removes from {postcodeDistrict}
            </p>
            <ul className="space-y-1">
              {filter.matchedContaminants
                .slice(0, MOBILE_REMOVES_LIMIT)
                .map((c) => (
                  <li
                    key={c}
                    className="flex items-center gap-1.5 text-sm text-body"
                  >
                    <Check className="w-3.5 h-3.5 text-safe shrink-0" />
                    {c}
                  </li>
                ))}
              {filter.matchedContaminants.length > MOBILE_REMOVES_LIMIT && (
                <>
                  {filter.matchedContaminants
                    .slice(MOBILE_REMOVES_LIMIT)
                    .map((c) => (
                      <li
                        key={c}
                        className="hidden sm:flex items-center gap-1.5 text-sm text-body"
                      >
                        <Check className="w-3.5 h-3.5 text-safe shrink-0" />
                        {c}
                      </li>
                    ))}
                  <li className="text-xs text-muted mt-1 sm:hidden">
                    +{filter.matchedContaminants.length - MOBILE_REMOVES_LIMIT}{" "}
                    more
                  </li>
                </>
              )}
            </ul>
          </div>
        ) : (
          <RemovesList removes={filter.removes} />
        )}

        {/* Certifications */}
        {filter.certifications.length > 0 && (
          <div className="px-5 mt-3 flex flex-wrap gap-1">
            {filter.certifications.map((cert) => (
              <span
                key={cert}
                className="bg-gray-100 text-faint text-[10px] rounded px-1.5 py-0.5"
              >
                {cert}
              </span>
            ))}
          </div>
        )}

        {/* Bottom area */}
        <div className="px-5 pb-5 mt-auto pt-3">
          {/* Price + rating */}
          <div className="flex justify-between items-baseline">
            <div className="flex items-baseline gap-1">
              <span className="font-data text-xl font-bold text-ink">
                &pound;{filter.priceGbp}
              </span>
              <span className="text-xs text-faint">approx.</span>
            </div>
            <span className="flex items-center gap-1 text-sm text-muted">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {filter.rating.toFixed(1)}
            </span>
          </div>

          {/* CTA */}
          <a
            href={filter.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="mt-3 w-full bg-ink text-white py-2 sm:py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-gray-800 transition-colors"
          >
            View on Amazon
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </ScrollReveal>
  );
}

/* ── FilterRecommendations — postcode-matched section ───────────────── */

interface FilterRecommendationsProps {
  recommendations: (FilterProduct & {
    matchedCount: number;
    matchedContaminants: string[];
  })[];
  postcodeDistrict: string;
  contaminantsFlagged: number;
}

export function FilterRecommendations({
  recommendations,
  postcodeDistrict,
  contaminantsFlagged,
}: FilterRecommendationsProps) {
  if (recommendations.length === 0) return null;

  return (
    <section className="mt-8">
      <div>
        <h2 className="font-display text-2xl text-ink italic">
          Filters for {postcodeDistrict}
        </h2>
        <p className="mt-1.5 text-sm text-muted flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          {contaminantsFlagged > 0
            ? `Matched to ${contaminantsFlagged} contaminant${contaminantsFlagged !== 1 ? "s" : ""} flagged in your area`
            : "General recommendations for your area"}
        </p>
      </div>

      <div className="flex overflow-x-auto gap-3 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 mt-6">
        {recommendations.map((filter, i) => (
          <FilterCard
            key={filter.id}
            filter={filter}
            postcodeDistrict={postcodeDistrict}
            index={i}
          />
        ))}
      </div>

      <p className="text-xs text-faint mt-4">
        We may earn a commission through affiliate links, at no extra cost to
        you. Recommendations are based on contaminant data, not sponsorship.{" "}
        <Link
          href="/affiliate-disclosure"
          className="text-accent hover:underline"
        >
          Affiliate disclosure
        </Link>{" "}
        &middot;{" "}
        <Link
          href="/guides/best-water-filters-uk"
          className="text-accent hover:underline"
        >
          Full filter guide
        </Link>
      </p>
    </section>
  );
}

/* ── FilterCards — standalone (used in guide pages) ─────────────────── */

interface FilterCardsProps {
  filters: FilterProduct[];
  postcode: string;
}

export function FilterCards({ filters, postcode }: FilterCardsProps) {
  return (
    <section>
      <div>
        <h2 className="font-display text-2xl text-ink italic">
          Filters for your area
        </h2>
        <p className="mt-1.5 text-sm text-muted flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          Picked to match what we found in your water
        </p>
      </div>

      <div className="flex overflow-x-auto gap-3 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 mt-6">
        {filters.map((filter, i) => {
          const badge = BADGE_CONFIG[filter.badge];
          const stripColor = STRIP_COLOR[filter.badge];

          return (
            <ScrollReveal key={filter.id} delay={i * 100}>
              <div className="card-elevated overflow-hidden flex flex-col w-[280px] shrink-0 snap-start md:w-auto md:shrink">
                <div className={`h-[3px] w-full ${stripColor}`} />
                <div className="mt-4 mx-5">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 ${badge.className}`}
                  >
                    {badge.icon}
                    {badge.label}
                  </span>
                </div>
                <div className="mt-3 px-5">
                  <p className="text-sm text-muted">{filter.brand}</p>
                  <p className="font-semibold text-ink text-sm sm:text-base leading-snug">
                    {filter.model}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {CATEGORY_LABELS[filter.category]}
                  </p>
                </div>
                <div className="border-t border-rule mx-5 my-3" />
                {filter.removes.length > 0 && (
                  <RemovesList removes={filter.removes} />
                )}
                {filter.certifications.length > 0 && (
                  <div className="px-5 mt-3 flex flex-wrap gap-1">
                    {filter.certifications.map((cert) => (
                      <span
                        key={cert}
                        className="bg-gray-100 text-faint text-[10px] rounded px-1.5 py-0.5"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                )}
                <div className="px-5 pb-5 mt-auto pt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="font-data text-xl font-bold text-ink">
                      &pound;{filter.priceGbp}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-muted">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {filter.rating.toFixed(1)}
                    </span>
                  </div>
                  <a
                    href={filter.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="mt-3 w-full bg-ink text-white py-2 sm:py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-gray-800 transition-colors"
                  >
                    Check Price
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>

      <p className="text-xs text-faint mt-4">
        We may earn a commission through affiliate links, at no extra cost to
        you. Recommendations are based on contaminant data, not sponsorship.{" "}
        <Link
          href="/affiliate-disclosure"
          className="text-accent hover:underline"
        >
          Affiliate disclosure
        </Link>
      </p>
    </section>
  );
}
