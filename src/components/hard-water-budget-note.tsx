import { ExternalLink } from "lucide-react";
import { PRODUCTS } from "@/lib/products";
import { AffiliateLink } from "@/components/affiliate-link";
import { TypicalPrice } from "@/components/commerce";

/**
 * Shown directly under the scale-treating systems on hard-water pages. Those
 * start around £495, which is not everyone's next step, and a visitor who
 * closes the tab here leaves without any affordable option at all. The jug is
 * labelled as doing nothing about limescale, so the trade-off stays explicit.
 */
export function HardWaterBudgetNote({
  postcodeDistrict,
  waterScoreBand,
}: {
  postcodeDistrict: string;
  waterScoreBand: string;
}) {
  const jug = PRODUCTS.find((p) => p.id === "brita-maxtra-pro");
  if (!jug) return null;

  return (
    <aside className="mt-4 card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">
            Not ready for a system? {jug.brand} {jug.model}
          </p>
          <p className="text-sm text-muted mt-0.5">
            Improves taste and chlorine. It does nothing about limescale.
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <TypicalPrice priceGbp={jug.priceGbp} size="sm" />
          <AffiliateLink
            href={jug.affiliateUrl}
            pageType="postcode"
            postcodeArea={postcodeDistrict}
            waterScoreBand={waterScoreBand}
            recommendationReason="hard-water-budget-alternative"
            productCategory={jug.category}
            productSlug={jug.slug}
            placement="postcode-hardwater-budget"
            campaign="postcode-result"
            className="btn-ink h-10 px-4 text-sm"
            ariaLabel={`View ${jug.brand} ${jug.model} on Amazon`}
          >
            View on Amazon
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </AffiliateLink>
        </div>
      </div>
    </aside>
  );
}
