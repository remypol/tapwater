'use client';

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { events } from "@/lib/analytics";
import {
  buildAffiliateUrl,
  createAffiliatePayload,
  type AffiliateContext,
} from "@/lib/affiliate";
import { buildClickPayload, sendClickBeacon } from "@/lib/click-log";

/**
 * `pathname` is deliberately absent: it is read from the router, never passed in.
 *
 * It used to be a prop, and ProductCard defaulted it to "/filters" for callers
 * that forgot. Fifteen of its seventeen render sites forgot, so clicks from the
 * PFAS, contaminant, category and comparison pages all reported as "/filters" —
 * a page with no affiliate links on it at all. The page a click happened on is
 * something the router already knows for certain, so nobody should be retyping
 * it. Everything else here (pageType, placement, campaign) is an editorial
 * label that cannot be derived, so those stay explicit.
 */
interface AffiliateLinkProps
  extends Omit<AffiliateContext, "destinationUrl" | "pathname"> {
  href: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function AffiliateLink({
  href,
  children,
  className,
  ariaLabel,
  ...context
}: AffiliateLinkProps) {
  // The real URL of the page this link is rendered on, resolved at click time.
  const pathname = usePathname();

  const trackedHref = buildAffiliateUrl(href, {
    campaign: context.campaign,
    productSlug: context.productSlug,
  });

  function handleClick() {
    events.affiliateClick(createAffiliatePayload({
      ...context,
      pathname,
      destinationUrl: trackedHref,
    }));
    // First-party copy of the same click; GA4 sits on an account we cannot read.
    sendClickBeacon(buildClickPayload({
      destinationUrl: trackedHref,
      productSlug: context.productSlug,
      pathname,
      placement: context.placement,
      campaign: context.campaign,
    }));
  }

  return (
    <a
      href={trackedHref}
      target="_blank"
      rel="noopener noreferrer sponsored nofollow"
      className={className}
      aria-label={ariaLabel ? `${ariaLabel} (opens in new tab)` : undefined}
      onClick={handleClick}
    >
      {children}
      {!ariaLabel && <span className="sr-only"> (opens in new tab)</span>}
    </a>
  );
}
