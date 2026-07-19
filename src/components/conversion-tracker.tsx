'use client';

import { useEffect, useRef, type ReactNode } from "react";
import { events } from "@/lib/analytics";
import type { AffiliateEventPayload } from "@/lib/affiliate";

export function RecommendationTracker({
  payload,
  children,
}: {
  payload: AffiliateEventPayload;
  children: ReactNode;
}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const sentRef = useRef(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const send = () => {
      if (sentRef.current) return;
      sentRef.current = true;
      events.recommendationImpression(payload);
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
  }, [payload]);

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
