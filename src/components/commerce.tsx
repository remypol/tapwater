import Link from "next/link";
import type { FilterProduct } from "@/lib/types";
import { getTransparentLimitations } from "@/lib/recommendation";

/* ── Kicker — the mono data label; the lab-report voice ───────────────── */

export function Kicker({
  as: Tag = "p",
  accent = false,
  className = "",
  children,
}: {
  as?: "p" | "span" | "dt";
  accent?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag
      className={`font-mono text-[11px] uppercase tracking-[0.14em] ${accent ? "text-accent" : "text-muted"} ${className}`}
    >
      {children}
    </Tag>
  );
}

/* ── TypicalPrice — every static price, always labelled typical/approx ── */

export function TypicalPrice({
  priceGbp,
  size,
}: {
  priceGbp: number;
  size: "lg" | "md" | "sm";
}) {
  const isPriced = priceGbp > 0;
  const amount = isPriced ? `£${priceGbp.toLocaleString("en-GB")}` : "Check price";

  if (size === "sm") {
    return (
      <div className="text-right shrink-0">
        <p className="font-data text-sm text-ink">{amount}</p>
        {isPriced && <span className="text-[11px] text-muted">typical</span>}
      </div>
    );
  }

  if (size === "md") {
    return (
      <div>
        <Kicker>Typical price</Kicker>
        <p className="mt-1 font-data text-lg text-ink">
          {amount}
          {isPriced && <span className="ml-1.5 text-[11px] font-normal text-muted">approx.</span>}
        </p>
      </div>
    );
  }

  return (
    <div>
      <Kicker>Typical price</Kicker>
      <p className="mt-1 font-data text-2xl text-ink">{amount}</p>
      {isPriced && (
        <p className="mt-0.5 text-[11px] text-muted">approx. · retailer sets the final price</p>
      )}
    </div>
  );
}

/* ── AffiliateNote — the disclosure line adjacent to every commercial rail ── */

export function AffiliateNote({
  withFundingLink = false,
  className = "",
}: {
  withFundingLink?: boolean;
  className?: string;
}) {
  return (
    <p className={`text-xs text-muted ${className}`}>
      Affiliate link: we may earn a commission at no extra cost to you.
      {withFundingLink && (
        <>
          {" "}
          <Link href="/affiliate-disclosure" className="text-accent hover:underline">
            How recommendations are funded
          </Link>
        </>
      )}
    </p>
  );
}

/* ── getCandourRows — single source of the "what it won't do" logic ───── */

export function getCandourRows(
  product: FilterProduct,
): { label: string; lines: string[] } | null {
  const explicit = getTransparentLimitations(product);
  if (explicit.length > 0) return { label: "What it won't do", lines: explicit };
  if (product.cons.length > 0) return { label: "Trade-offs", lines: product.cons.slice(0, 2) };
  return null;
}
