'use client';

import type { ReactNode } from "react";
import { events } from "@/lib/analytics";
import {
  buildAffiliateUrl,
  createAffiliatePayload,
  type AffiliateContext,
} from "@/lib/affiliate";
import { buildClickPayload, sendClickBeacon } from "@/lib/click-log";

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
    // First-party copy of the same click; GA4 sits on an account we cannot read.
    sendClickBeacon(buildClickPayload({
      destinationUrl: trackedHref,
      productSlug: context.productSlug,
      pathname: context.pathname,
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
