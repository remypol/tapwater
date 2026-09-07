import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { AffiliateNote } from "@/components/commerce";
import { getProductBySlug } from "@/lib/products";

/**
 * The three fixes people actually buy from this site, in the order they buy them.
 *
 * The purpose lead on each card answers "which of these is for me?" before the
 * reader has to parse a brand name. The slugs are deliberately fixed rather than
 * derived from click data at render time: the rail has to be honest about what it
 * is (our three most-clicked fixes) without the copy changing under an editor's feet.
 */
const PICKS: { slug: string; highlight: string }[] = [
  {
    slug: "zerowater-12-cup",
    highlight: "The jug for cleaner drinking water",
  },
  {
    slug: "jolie-filtered-showerhead",
    highlight: "For dry skin and hair after a shower",
  },
  {
    slug: "osmio-zero",
    highlight: "Reverse osmosis without a plumber",
  },
];

interface FixPicksProps {
  pageType: string;
  placement: string;
  title: string;
  intro: React.ReactNode;
  className?: string;
}

export function FixPicks({ pageType, placement, title, intro, className = "" }: FixPicksProps) {
  const picks = PICKS.flatMap(({ slug, highlight }) => {
    const product = getProductBySlug(slug);
    return product ? [{ product, highlight }] : [];
  });

  if (picks.length === 0) return null;

  return (
    <section className={className} aria-labelledby="fix-picks-heading">
      <h2 id="fix-picks-heading" className="font-display text-2xl text-ink italic">
        {title}
      </h2>
      <p className="text-base text-body leading-relaxed mt-2 max-w-2xl">{intro}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {picks.map(({ product, highlight }) => (
          <ProductCard
            key={product.id}
            product={product}
            highlight={highlight}
            pageType={pageType}
            placement={placement}
            recommendationReason="most-clicked"
          />
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link
            href="/hardness#softener-quotes"
            className="inline-flex items-center gap-1 font-medium text-ink hover:text-accent transition-colors"
          >
            Hard water? Get softener quotes
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
          <Link
            href="/filters"
            className="inline-flex items-center gap-1 font-medium text-ink hover:text-accent transition-colors"
          >
            All filters
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
        <AffiliateNote withFundingLink />
      </div>
    </section>
  );
}
