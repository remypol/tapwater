"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Droplets, ShieldCheck, ExternalLink } from "lucide-react";
import { events } from "@/lib/analytics";
import { SOFTENER_PARTNER_URL, SOFTENER_PARTNER_NAME } from "@/lib/softener-partner";

interface SoftenerPartnerCtaProps {
  postcode?: string;
  hardnessValue: number;
  hardnessLabel: string;
  source: "postcode_page" | "hardness_page";
}

/**
 * Routes softener quote requests to the approved lead partner. Rendered instead of the
 * on-site form whenever a partner URL is configured (see @/lib/softener-partner).
 */
export function SoftenerPartnerCta({
  postcode,
  hardnessValue,
  hardnessLabel,
  source,
}: SoftenerPartnerCtaProps) {
  const tracked = useRef(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const area = postcode || "unknown";

  useEffect(() => {
    if (tracked.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !tracked.current) {
          events.softenerPartnerView(area, source);
          tracked.current = true;
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ctaRef.current) observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, [area, source]);

  return (
    <div
      ref={ctaRef}
      id="softener-quotes"
      className="card p-6 lg:p-8 border-l-[3px] border-amber-500 scroll-mt-24"
    >
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-warning-light)] flex items-center justify-center shrink-0">
          <Droplets className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-ink">
            Hard water is costing your home money
          </h2>
          <p className="text-sm text-body mt-1 leading-relaxed">
            Limescale reduces boiler efficiency and shortens appliance life. Based
            on your water hardness{" "}
            <strong className="text-ink">
              ({Math.round(hardnessValue)} mg/L — {hardnessLabel})
            </strong>
            , a softener could save you £200+/year.
          </p>
          <p className="text-xs text-muted mt-1">
            Compare free, no-obligation quotes from vetted installers covering{" "}
            {postcode ? (
              <span className="font-medium text-ink">{postcode}</span>
            ) : (
              "your area"
            )}
            .
          </p>
        </div>
      </div>

      <a
        href={SOFTENER_PARTNER_URL}
        target="_blank"
        rel="sponsored noopener noreferrer"
        onClick={() => events.softenerPartnerClick(area, source)}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
      >
        Get free quotes
        <ExternalLink className="w-4 h-4" aria-hidden="true" />
      </a>

      <p className="mt-3 text-xs text-muted leading-relaxed">
        Quotes are handled by{" "}
        {SOFTENER_PARTNER_NAME ? (
          <span className="font-medium text-ink">{SOFTENER_PARTNER_NAME}</span>
        ) : (
          "our quote partner"
        )}
        , who match you with local installers. We may earn a commission if you
        request quotes, at no extra cost to you.{" "}
        <Link
          href="/affiliate-disclosure"
          className="underline underline-offset-2 hover:text-ink"
        >
          How we make money
        </Link>
        .
      </p>

      <div className="mt-5 flex gap-6 justify-center pt-4 border-t border-rule">
        <div className="text-center">
          <p className="text-base font-bold text-ink">100%</p>
          <p className="text-xs text-muted">free, no obligation</p>
        </div>
        <div className="text-center">
          <ShieldCheck className="w-4 h-4 text-muted mx-auto mb-0.5" />
          <p className="text-xs text-muted">vetted installers</p>
        </div>
      </div>
    </div>
  );
}
