"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { events } from "@/lib/analytics";
import { SOFTENER_PARTNER_URL, softenerPartnerEnabled } from "@/lib/softener-partner";

interface SoftenerButtonProps {
  district: string;
  label: string;
  paint: "sun" | "ink";
  /** Where on the page the click came from, for the funnel report. */
  placement: "hero" | "action" | "chalk" | "sticky";
}

/**
 * The one softener button used everywhere on the page. With an approved partner it
 * goes straight to their quote form in a new tab; without one it scrolls to our own
 * form further down. Either way the click is logged against the district.
 */
export function SoftenerButton({ district, label, paint, placement }: SoftenerButtonProps) {
  const className = `wt-btn wt-btn--${paint}`;
  if (softenerPartnerEnabled) {
    return (
      <a
        href={SOFTENER_PARTNER_URL}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className={className}
        data-placement={placement}
        onClick={() => events.softenerPartnerClick(district, "postcode_page")}
      >
        {label}
        <ArrowUpRight aria-hidden="true" />
      </a>
    );
  }
  return (
    <a href="#softener-quotes" className={className} data-placement={placement} onClick={() => events.softenerBannerClick(district)}>
      {label}
      <ArrowRight aria-hidden="true" />
    </a>
  );
}

/**
 * Phone-only bar that carries the page's primary action once the first screen has
 * scrolled away, and steps aside again when the matching section is on screen.
 */
export function StickyAction({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("wt-tank");
    const target = document.getElementById("softener-quotes") ?? document.getElementById("wt-fix");
    if (!hero) return;
    let pastHero = false;
    let atTarget = false;
    const update = () => setShow(pastHero && !atTarget);
    const heroIo = new IntersectionObserver(([e]) => {
      pastHero = !e.isIntersecting;
      update();
    });
    heroIo.observe(hero);
    let targetIo: IntersectionObserver | null = null;
    if (target) {
      targetIo = new IntersectionObserver(([e]) => {
        atTarget = e.isIntersecting;
        update();
      });
      targetIo.observe(target);
    }
    return () => {
      heroIo.disconnect();
      targetIo?.disconnect();
    };
  }, []);

  return (
    <div className="wt-sticky" data-show={show} aria-hidden={!show}>
      <p>
        <b>{title}</b>
        {note}
      </p>
      {children}
    </div>
  );
}
