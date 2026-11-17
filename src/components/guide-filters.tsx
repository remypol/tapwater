import { ProductCard } from "@/components/product-card";
import { AffiliateNote } from "@/components/commerce";
import { getProductBySlug } from "@/lib/products";

interface GuideFiltersProps {
  /** Product slugs with the one line that says why each is here. */
  picks: { slug: string; highlight: string }[];
  /** Recorded with each click, e.g. "lead" or "microplastics". */
  reason: string;
  children: React.ReactNode;
}

/**
 * Named filters inside an explanatory guide.
 *
 * The lead pipes and microplastics guides told readers which kind of filter
 * works and then named none: 176 search visits in 90 days and no shop click
 * between them (link report, 17 Nov 2026). The picks are fixed per guide so
 * each one matches what the paragraph above it has just said.
 */
export function GuideFilters({ picks, reason, children }: GuideFiltersProps) {
  const products = picks.flatMap(({ slug, highlight }) => {
    const product = getProductBySlug(slug);
    return product ? [{ product, highlight }] : [];
  });
  if (products.length === 0) return null;

  return (
    <div className="mt-6 mb-2">
      <p className="text-base text-body leading-relaxed mb-4">{children}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {products.map(({ product, highlight }) => (
          <ProductCard
            key={product.id}
            product={product}
            highlight={highlight}
            pageType="guide"
            placement="guide-filters"
            recommendationReason={reason}
          />
        ))}
      </div>
      <div className="mt-3">
        <AffiliateNote withFundingLink />
      </div>
    </div>
  );
}
