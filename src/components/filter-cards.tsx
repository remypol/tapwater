import { FilterProduct } from "@/lib/types";
import Link from "next/link";
import { Award, Check, Star, ArrowUpRight, ShieldCheck } from "lucide-react";

const MOBILE_REMOVES_LIMIT = 3;

function RemovesList({ removes }: { removes: string[] }) {
  const overflow = removes.length - MOBILE_REMOVES_LIMIT;

  return (
    <div className="px-5">
      <p className="text-xs font-medium text-ink mb-1.5">Removes</p>
      <ul className="space-y-1">
        {/* On mobile show up to 3, on sm+ show all */}
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

interface FilterCardsProps {
  filters: FilterProduct[];
  postcode: string;
}

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
    label: "Editor's Pick",
    className: "bg-blue-50 text-blue-700",
    icon: <Award className="w-3 h-3" />,
  },
  budget: {
    label: "Best Value",
    className: "bg-emerald-50 text-emerald-700",
    icon: null,
  },
  "whole-house": {
    label: "Most Thorough",
    className: "bg-violet-50 text-violet-700",
    icon: null,
  },
};

const CATEGORY_LABELS: Record<FilterProduct["category"], string> = {
  jug: "Filter Jug",
  under_sink: "Under Sink",
  whole_house: "Whole House",
  countertop: "Countertop",
};

export function FilterCards({ filters, postcode }: FilterCardsProps) {
  return (
    <section>
      <div>
        <h2 className="font-display text-2xl text-ink italic">
          Recommended for {postcode}
        </h2>
        <p className="mt-1.5 text-sm text-muted flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          Selected based on contaminants detected in your area
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {filters.map((filter) => {
          const badge = BADGE_CONFIG[filter.badge];
          const stripColor = STRIP_COLOR[filter.badge];

          return (
            <div
              key={filter.id}
              className="card-elevated overflow-hidden flex flex-col"
            >
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

              {/* Removes */}
              {filter.removes.length > 0 && (
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
                  <span className="font-data text-xl font-bold text-ink">
                    £{filter.priceGbp.toFixed(2)}
                  </span>
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
                  Check Price
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-faint mt-4">
        We may earn a commission through affiliate links, at no extra cost to
        you. Recommendations are based on contaminant data, not sponsorship.
      </p>
    </section>
  );
}
