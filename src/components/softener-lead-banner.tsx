"use client";

import { useEffect, useRef } from "react";
import { Droplets } from "lucide-react";
import { events } from "@/lib/analytics";

interface SoftenerLeadBannerProps {
  postcode: string;
  hardnessValue: number;
  hardnessLabel: string;
}

export function SoftenerLeadBanner({
  postcode,
  hardnessValue,
  hardnessLabel,
}: SoftenerLeadBannerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      events.softenerBannerView(postcode);
      tracked.current = true;
    }
  }, [postcode]);

  return (
    <div className="mt-4 rounded-lg border-l-[3px] border-amber-500 bg-[var(--color-warning-light)] px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        <Droplets className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">
            Hard water is costing your home money
          </p>
          <p className="text-xs text-muted mt-0.5">
            Your water is {hardnessLabel} ({Math.round(hardnessValue)} mg/L) — find out if a softener is worth it
          </p>
        </div>
      </div>
      <a
        href="#softener-quotes"
        onClick={() => events.softenerBannerClick(postcode)}
        className="shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
      >
        Get free quotes&nbsp;&rarr;
      </a>
    </div>
  );
}
