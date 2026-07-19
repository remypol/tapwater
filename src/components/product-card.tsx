import Image from "next/image";
import { ExternalLink } from "lucide-react";
import type { FilterProduct } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/filters";
import { AffiliateLink } from "@/components/affiliate-link";
import { TypicalPrice, AffiliateNote, getCandourRows } from "@/components/commerce";

interface ProductCardProps {
  product: FilterProduct;
  highlight?: string;
  pageType?: string;
  pathname?: string;
  placement?: string;
  postcodeArea?: string;
  recommendationReason?: string;
}

export function ProductCard({
  product,
  highlight,
  pageType = "filter-category",
  pathname = "/filters",
  placement = "product-card",
  postcodeArea,
  recommendationReason = "product-comparison",
}: ProductCardProps) {
  const ctaText = product.affiliateProgram === "amazon"
    ? "Check current price on Amazon"
    : `Check current price at ${product.brand}`;
  const candour = getCandourRows(product);

  return (
    <article className="card overflow-hidden h-full flex flex-col">
      <div className="p-5 flex-1 flex flex-col">
        {/* Purpose lead */}
        {highlight && (
          <p className="font-display italic text-lg leading-snug text-ink">{highlight}</p>
        )}

        {/* Identity row */}
        <div className={`flex items-center gap-3 ${highlight ? "mt-3" : "mt-0"}`}>
          {product.imageUrl && (
            <div className="shrink-0 w-16 h-16 bg-white ring-1 ring-rule rounded-lg overflow-hidden">
              <Image
                src={product.imageUrl}
                alt={`${product.brand} ${product.model}`}
                width={64}
                height={64}
                className="object-contain w-full h-full p-1.5"
              />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">
              {product.brand} {product.model}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {CATEGORY_LABELS[product.category]}
              {product.certifications.length > 0 && (
                <> · {product.certifications.join(", ")}</>
              )}
            </p>
          </div>
        </div>

        {/* Ledger */}
        <dl className="mt-4 border-t border-rule divide-y divide-rule">
          {product.pros.length > 0 && (
            <div className="py-3 sm:grid sm:grid-cols-[148px_1fr] sm:gap-x-4">
              <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted sm:pt-0.5">
                Why it fits
              </dt>
              <dd className="mt-1.5 sm:mt-0">
                <ul className="space-y-1">
                  {product.pros.slice(0, 3).map((pro) => (
                    <li key={pro} className="text-sm text-body leading-relaxed">
                      {pro}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
          {candour && (
            <div className="py-3 sm:grid sm:grid-cols-[148px_1fr] sm:gap-x-4">
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

        {/* Rail */}
        <div className="mt-auto pt-4 border-t border-rule flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TypicalPrice priceGbp={product.priceGbp} size="md" />
          <AffiliateLink
            href={product.affiliateUrl}
            pageType={pageType}
            pathname={pathname}
            postcodeArea={postcodeArea}
            recommendationReason={recommendationReason}
            productCategory={product.category}
            productSlug={product.slug}
            placement={placement}
            campaign={pageType}
            className="inline-flex items-center justify-center gap-1.5 min-h-11 px-4 rounded-lg border border-rule-strong text-sm font-medium text-ink hover:border-accent hover:text-accent transition-colors w-full sm:w-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {ctaText}
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </AffiliateLink>
        </div>

        <AffiliateNote className="mt-3" />
      </div>
    </article>
  );
}
