import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SOFTENER_GUIDES } from "@/lib/softener-guides";

interface SoftenerGuidesNavProps {
  /** Slug of the page rendering the nav, so it does not link to itself. */
  current?: string;
  /** Compact: a tight two-column link list for the hardness tool and postcode pages. */
  variant?: "compact" | "full";
  heading?: string;
  className?: string;
}

/**
 * The cluster's internal-link spine. Every softener guide, the hardness tool and
 * the postcode page's hard-water section render this same list, so a visitor
 * who lands on any one question can reach the others in one click.
 */
export function SoftenerGuidesNav({
  current,
  variant = "full",
  heading = "Softener guides",
  className = "",
}: SoftenerGuidesNavProps) {
  const guides = SOFTENER_GUIDES.filter((g) => g.slug !== current);

  if (variant === "compact") {
    return (
      <nav aria-label={heading} className={`${className}`}>
        <p className="text-xs font-semibold text-muted mb-2">{heading}</p>
        <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {guides.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/guides/${g.slug}/`}
                className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline underline-offset-2"
              >
                <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                {g.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label={heading} className={className}>
      <h2 className="font-display text-2xl italic text-ink mb-4">{heading}</h2>
      <ol className="border-t border-rule">
        {guides.map((g) => (
          <li key={g.slug} className="border-b border-rule">
            <Link
              href={`/guides/${g.slug}/`}
              className="group flex items-baseline justify-between gap-4 py-3.5"
            >
              <span className="min-w-0">
                <span className="block text-base font-medium text-ink group-hover:text-accent transition-colors">
                  {g.label}
                </span>
                <span className="block text-sm text-muted mt-0.5">{g.blurb}</span>
              </span>
              <ArrowRight
                className="w-4 h-4 shrink-0 text-faint group-hover:text-accent transition-colors self-center"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
