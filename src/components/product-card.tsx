import Image from "next/image";
import { Star, ArrowRight, Check } from "lucide-react";
import type { FilterProduct } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/filters";

function appendUtm(baseUrl: string, productSlug: string, pageType?: string): string {
  const sep = baseUrl.includes("?") ? "&" : "?";
  const campaign = pageType || "unknown";
  return `${baseUrl}${sep}utm_source=tapwater&utm_medium=affiliate&utm_campaign=${campaign}&utm_content=${productSlug}`;
}

interface ProductCardProps {
  product: FilterProduct;
  highlight?: string;
  pageType?: string;
}

export function ProductCard({ product, highlight, pageType }: ProductCardProps) {
  const affiliateHref = appendUtm(product.affiliateUrl, product.slug, pageType);
  const ctaText = product.affiliateProgram === "amazon"
    ? "Check price on Amazon"
    : `Buy from ${product.brand}`;
  return (
    <div className="card overflow-hidden">
      <div className="p-5">
        <div className="flex gap-4 items-start">
          {product.imageUrl && (
            <div className="shrink-0 w-20 h-20 rounded-lg bg-wash overflow-hidden">
              <Image
                src={product.imageUrl}
                alt={`${product.brand} ${product.model}`}
                width={80}
                height={80}
                className="object-contain w-full h-full p-1.5"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-faint uppercase tracking-wider">
              {CATEGORY_LABELS[product.category]}
            </p>
            <p className="font-display text-lg text-ink italic mt-0.5">
              {product.brand} {product.model}
            </p>
            {highlight && (
              <p className="text-xs font-medium text-accent mt-1">{highlight}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="font-data text-lg font-bold text-ink">
              {product.priceGbp > 0 ? `£${product.priceGbp.toLocaleString("en-GB")}` : "Check price"}
            </p>
            <div className="flex items-center gap-1 justify-end">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs text-muted">{product.rating}/5</span>
            </div>
          </div>
        </div>

        {product.pros.length > 0 && (
          <ul className="mt-3 space-y-1">
            {product.pros.slice(0, 3).map((pro) => (
              <li key={pro} className="flex items-start gap-1.5 text-sm text-body">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                {pro}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5 flex-wrap">
            {product.certifications.map((cert) => (
              <span key={cert} className="text-xs text-muted bg-wash rounded px-2 py-0.5">
                {cert}
              </span>
            ))}
          </div>
          <a
            href={affiliateHref}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="text-sm font-medium text-accent hover:underline flex items-center gap-1 py-2 px-3 -mr-3"
          >
            {ctaText}
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
