import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { AffiliateNote } from "@/components/commerce";
import { getProductBySlug } from "@/lib/products";
import { formatPriceRange, installedPriceRange } from "@/lib/softener-prices";

/** "£1,195 to £2,900", with a source for each brand in the cost guide. */
const SOFTENER_PRICE = formatPriceRange(installedPriceRange());

/**
 * What a hard-water household can buy today, in place of the softener quote form.
 *
 * Until 26 November 2026 every hard-water page led with "Get softener quotes". No
 * installer, lead network or quote site would buy the requests (14 installers
 * emailed, Softwater Solutions and Bark declined), so 50 people asked for quotes
 * and nobody called them. The slot now says plainly that only a softener removes
 * hardness, where its price comes from, and offers the three things that deal with
 * scale where people notice it, each through a programme that pays us.
 */
const PICKS: { slug: string; highlight: string }[] = [
  { slug: "russell-hobbs-brita-purity-glass-kettle", highlight: "Keeps scale out of the kettle" },
  { slug: "helloklean-shower-head-plus", highlight: "For dry skin and hair in a hard-water shower" },
  { slug: "brita-marella-xl", highlight: "Less scale in tea, coffee and the kettle" },
];

interface HardWaterFixesProps {
  /** Mg/L CaCO3, shown in the heading when known. */
  hardness?: number | null;
  /** "RG40", "Reading": who the heading is about. */
  place?: string;
  /** For the click log. */
  pageType: string;
  placement: string;
  postcodeArea?: string;
  className?: string;
}

export function HardWaterFixes({ hardness, place, pageType, placement, postcodeArea, className = "" }: HardWaterFixesProps) {
  const picks = PICKS.flatMap(({ slug, highlight }) => {
    const product = getProductBySlug(slug);
    return product ? [{ product, highlight }] : [];
  });
  const rounded = hardness != null ? Math.round(hardness) : null;

  return (
    <section id="softener-quotes" className={`scroll-mt-24 ${className}`} aria-labelledby={`hard-water-fixes-${placement}`}>
      <h2 id={`hard-water-fixes-${placement}`} className="font-display text-2xl text-ink italic">
        {rounded != null ? `${rounded} mg/L${place ? ` in ${place}` : ""}: what helps with the limescale` : "What helps with hard water"}
      </h2>
      <p className="text-base text-body leading-relaxed mt-2 max-w-2xl">
        Only a water softener takes the hardness out. Fitted, one costs {SOFTENER_PRICE}, and you get quotes from installers directly; the{" "}
        <Link href="/guides/water-softener-cost-uk" className="text-accent underline underline-offset-2">cost guide</Link> has the price of each brand
        and what to ask. These cost far less and deal with the scale where you notice it most. None of them softens the water.
      </p>

      <div className="mt-6 grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
        {picks.map(({ product, highlight }) => (
          <ProductCard
            key={product.id}
            product={product}
            highlight={highlight}
            pageType={pageType}
            placement={placement}
            postcodeArea={postcodeArea}
            recommendationReason="hard-water"
          />
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link href="/guides/do-i-need-a-water-softener" className="inline-flex items-center gap-1 font-medium text-ink hover:text-accent transition-colors">
            Do I need a softener?
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
          <Link href="/guides/best-kettle-for-hard-water-uk" className="inline-flex items-center gap-1 font-medium text-ink hover:text-accent transition-colors">
            Kettles for hard water
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
          <Link href="/guides/best-shower-filter-uk" className="inline-flex items-center gap-1 font-medium text-ink hover:text-accent transition-colors">
            Shower filters
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
        <AffiliateNote withFundingLink />
      </div>
    </section>
  );
}
