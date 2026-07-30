'use client';

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { events } from "@/lib/analytics";
import { createAffiliatePayload, type AffiliateContext } from "@/lib/affiliate";

/**
 * Takes the context rather than a finished payload, so that `pathname` can be
 * filled in from the router here instead of being typed out by the caller. Same
 * reason as in AffiliateLink: a hand-written page path is a value that silently
 * goes stale or gets copy-pasted wrong, and the router always knows the truth.
 */
export function RecommendationTracker({
  context,
  children,
}: {
  context: Omit<AffiliateContext, "pathname">;
  children: ReactNode;
}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const sentRef = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const send = () => {
      if (sentRef.current) return;
      sentRef.current = true;
      events.recommendationImpression(
        createAffiliatePayload({ ...context, pathname }),
      );
    };

    if (!("IntersectionObserver" in window)) {
      send();
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        send();
        observer.disconnect();
      }
    }, { threshold: 0.1 });

    observer.observe(target);
    return () => observer.disconnect();
  }, [context, pathname]);

  return <div ref={targetRef}>{children}</div>;
}

export function WaterReportTracker({
  postcodeArea,
  waterScoreBand,
}: {
  postcodeArea: string;
  waterScoreBand: string;
}) {
  useEffect(() => {
    events.waterReportViewed(postcodeArea, waterScoreBand);
  }, [postcodeArea, waterScoreBand]);

  return null;
}
