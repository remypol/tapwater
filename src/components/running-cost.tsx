import { AffiliateLink } from "@/components/affiliate-link";
import type { FilterProduct } from "@/lib/types";

interface Props {
  products: FilterProduct[];
  years?: number;
  pageType: string;
  campaign: string;
}

/**
 * What each filter actually costs to own, once cartridges are counted.
 *
 * The sticker price is the number every reader compares on, and for this category
 * it is close to meaningless: cartridges run £30-£120 a year and dominate the total
 * within months. A £40 ZeroWater jug costs £640 over five years. A £59 under-sink
 * filter costs £209 — a third as much, for a purchase that looks twice as expensive
 * on the shelf.
 *
 * That is worth showing plainly. It is also the single most useful thing we can tell
 * someone who arrived to compare £20 jugs, and it happens to point at the products
 * that pay us properly. Both of those are true at once, which is why the framing
 * here is the arithmetic rather than a recommendation.
 */
export function RunningCostComparison({
  products,
  years = 5,
  pageType,
  campaign,
}: Props) {
  const rows = products
    .filter((p) => typeof p.annualCost === "number")
    .map((p) => ({
      product: p,
      annual: p.annualCost as number,
      total: p.priceGbp + (p.annualCost as number) * years,
    }))
    .sort((a, b) => a.total - b.total);

  // Two rows is the minimum that makes a comparison; below that, say nothing.
  if (rows.length < 2) return null;

  const cheapest = rows[0];
  const dearest = rows[rows.length - 1];
  const gap = Math.round(dearest.total - cheapest.total);

  // The point of the table is the inversion: something that looks dearer on the
  // shelf costing less to live with. Find the widest example rather than assuming
  // the top and bottom rows happen to show it.
  let inversion: { dearerUpfront: (typeof rows)[number]; cheaperUpfront: (typeof rows)[number] } | null = null;
  let widest = 0;
  for (const a of rows) {
    for (const b of rows) {
      // "Despite costing more to buy" has to mean something. Across the RO range a
      // £499 unit is not meaningfully dearer than a £495 one, and saying so reads
      // like a sales line rather than a fact.
      const upfrontGap = a.product.priceGbp - b.product.priceGbp;
      if (upfrontGap < 15 || upfrontGap / b.product.priceGbp < 0.15) continue;
      if (a.total >= b.total) continue;
      const margin = b.total - a.total;
      if (margin > widest) {
        widest = margin;
        inversion = { dearerUpfront: a, cheaperUpfront: b };
      }
    }
  }

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl italic text-ink mb-1">
        What each one costs over {years} years
      </h2>
      <p className="text-sm text-muted mb-4 max-w-2xl">
        Replacement cartridges cost more than most of these filters do. Counting
        them changes the order.
        {inversion && (
          <>
            {" "}
            The{" "}
            <span className="text-ink font-medium">
              £{inversion.dearerUpfront.product.priceGbp}{" "}
              {inversion.dearerUpfront.product.brand}
            </span>{" "}
            costs £{Math.round(widest).toLocaleString("en-GB")} less to own over{" "}
            {years} years than the £{inversion.cheaperUpfront.product.priceGbp}{" "}
            {inversion.cheaperUpfront.product.brand}, despite costing more to buy.
          </>
        )}
      </p>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="border-b border-rule">
              <th className="text-left p-3 text-faint font-medium text-xs uppercase tracking-wider">
                Filter
              </th>
              <th className="text-right p-3 text-faint font-medium text-xs uppercase tracking-wider">
                Upfront
              </th>
              <th className="text-right p-3 text-faint font-medium text-xs uppercase tracking-wider">
                Cartridges/yr
              </th>
              <th className="text-right p-3 text-faint font-medium text-xs uppercase tracking-wider whitespace-nowrap">
                {years}-year total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ product, annual, total }, i) => (
              <tr
                key={product.id}
                className={`border-b border-rule/50 ${i === 0 ? "bg-wash/60" : ""}`}
              >
                <td className="p-3">
                  <AffiliateLink
                    href={product.affiliateUrl}
                    pageType={pageType}
                    recommendationReason="running-cost"
                    productCategory={product.category}
                    productSlug={product.slug}
                    placement="running-cost-table"
                    campaign={campaign}
                    className="font-medium text-ink hover:text-accent"
                  >
                    {product.brand} {product.model}
                  </AffiliateLink>
                  <p className="text-xs text-muted mt-0.5">
                    {product.removes.length} contaminants listed
                  </p>
                </td>
                <td className="text-right p-3 font-data text-ink tabular-nums">
                  £{product.priceGbp.toLocaleString("en-GB")}
                </td>
                <td className="text-right p-3 font-data text-muted tabular-nums">
                  £{annual.toLocaleString("en-GB")}
                </td>
                <td className="text-right p-3 font-data font-bold text-ink tabular-nums whitespace-nowrap">
                  £{total.toLocaleString("en-GB")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-faint mt-3">
        Cartridge costs are the manufacturer&rsquo;s stated replacement schedule at
        typical UK household use. Yours will vary with how much water you filter and
        how hard it is. Prices are approximate — the retailer sets the final price.
        {gap > 0 && (
          <> Across this table the gap between cheapest and dearest to own is £{gap.toLocaleString("en-GB")}.</>
        )}
      </p>
    </section>
  );
}
