import { Star, Check, X } from "lucide-react";
import type { FilterProduct } from "@/lib/types";

interface ComparisonTableProps {
  products: FilterProduct[];
  contaminants?: string[];
}

export function ProductComparisonTable({ products, contaminants }: ComparisonTableProps) {
  const showContaminants = contaminants ?? [
    ...new Set(products.flatMap((p) => p.removes)),
  ].slice(0, 8);

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-rule">
            <th className="text-left p-3 text-faint font-medium text-xs uppercase tracking-wider">Filter</th>
            <th className="text-center p-3 text-faint font-medium text-xs uppercase tracking-wider">Price</th>
            <th className="text-center p-3 text-faint font-medium text-xs uppercase tracking-wider">Rating</th>
            {showContaminants.map((c) => (
              <th key={c} className="text-center p-3 text-faint font-medium text-xs uppercase tracking-wider whitespace-nowrap">{c}</th>
            ))}
            <th className="text-center p-3 text-faint font-medium text-xs uppercase tracking-wider">Annual Cost</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-rule/50 hover:bg-wash/50">
              <td className="p-3">
                <a href={product.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored" className="font-medium text-ink hover:text-accent">
                  {product.brand} {product.model}
                </a>
                {product.bestFor && <p className="text-xs text-muted mt-0.5">{product.bestFor}</p>}
              </td>
              <td className="text-center p-3 font-data font-bold text-ink">
                {product.priceGbp > 0 ? `£${product.priceGbp}` : "\u2014"}
              </td>
              <td className="text-center p-3">
                <span className="inline-flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-data text-ink">{product.rating}</span>
                </span>
              </td>
              {showContaminants.map((c) => {
                const removes = product.removes.some((r) => r.toLowerCase() === c.toLowerCase());
                return (
                  <td key={c} className="text-center p-3">
                    {removes ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />}
                  </td>
                );
              })}
              <td className="text-center p-3 font-data text-muted">
                {product.annualCost ? `£${product.annualCost}/yr` : "\u2014"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
