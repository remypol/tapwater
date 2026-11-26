"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { events } from "@/lib/analytics";

interface SoftenerButtonProps {
  district: string;
  label: string;
  paint: "sun" | "ink";
  /** Where on the page the click came from, for the funnel report. */
  placement: "hero" | "action" | "chalk" | "sticky";
}

/**
 * The hard-water button used everywhere on the page: it scrolls to the hard-water
 * products (HardWaterFixes, id "softener-quotes") and logs the click.
 */
export function SoftenerButton({ district, label, paint, placement }: SoftenerButtonProps) {
  return (
    <a href="#softener-quotes" className={`wt-btn wt-btn--${paint}`} data-placement={placement} onClick={() => events.softenerBannerClick(district)}>
      {label}
      <ArrowRight aria-hidden="true" />
    </a>
  );
}

/**
 * Phone-only bar that carries the page's primary action once the first screen has
 * scrolled away, and steps aside again when the matching section is on screen.
 */
export function StickyAction({ title, note, children, heroId = "wt-tank" }: { title: string; note: string; children: React.ReactNode; heroId?: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById(heroId);
    // Step aside wherever the same button is already on screen.
    const targets = [document.getElementById("wt-fix"), document.getElementById("softener-quotes")].filter(
      (el): el is HTMLElement => el !== null,
    );
    if (!hero) return;
    let pastHero = false;
    const onScreen = new Set<Element>();
    const update = () => setShow(pastHero && onScreen.size === 0);
    const heroIo = new IntersectionObserver(([e]) => {
      pastHero = !e.isIntersecting;
      update();
    });
    heroIo.observe(hero);
    const targetIo = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) onScreen.add(e.target);
        else onScreen.delete(e.target);
      }
      update();
    });
    targets.forEach((t) => targetIo.observe(t));
    return () => {
      heroIo.disconnect();
      targetIo.disconnect();
    };
  }, [heroId]);

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
