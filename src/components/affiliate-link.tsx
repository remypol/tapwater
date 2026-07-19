'use client';

import type { ReactNode } from "react";
import { events } from "@/lib/analytics";
import {
  buildAffiliateUrl,
  createAffiliatePayload,
  type AffiliateContext,
} from "@/lib/affiliate";

interface AffiliateLinkProps extends Omit<AffiliateContext, "destinationUrl"> {
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
  const trackedHref = buildAffiliateUrl(href, {
    campaign: context.campaign,
    productSlug: context.productSlug,
  });

  function handleClick() {
    events.affiliateClick(createAffiliatePayload({
      ...context,
      destinationUrl: trackedHref,
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
