"use client";

import { useEffect, useRef, useState } from "react";
import { getScoreColor } from "@/lib/types";

interface StickyScoreProps {
  district: string;
  areaName: string;
  score: number;
}

function getScoreTextColor(score: number): string {
  const color = getScoreColor(score);
  if (color === "safe") return "text-[var(--color-safe)]";
  if (color === "warning") return "text-[var(--color-warning)]";
  return "text-[var(--color-danger)]";
}

/**
 * Renders a 1px invisible sentinel div that triggers the sticky bar once scrolled past.
 * Place this component immediately after the score ring.
 */
export function ScoreSentinel() {
  return <div id="score-sentinel" style={{ height: 1 }} aria-hidden="true" />;
}

/**
 * Fixed sticky header bar — only visible on mobile (below lg), appears once the
 * score ring scrolls out of view.
 */
export function StickyScore({ district, areaName, score }: StickyScoreProps) {
  const [visible, setVisible] = useState(false);
  const sentinelRef = useRef<Element | null>(null);

  useEffect(() => {
    // Locate the sentinel rendered by <ScoreSentinel /> in the page
    const sentinel = document.getElementById("score-sentinel");
    if (!sentinel) return;
    sentinelRef.current = sentinel;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when sentinel is no longer intersecting (scrolled past)
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const scoreColor = getScoreTextColor(score);

  return (
    <div
      role="banner"
      aria-label={`${district} water quality score`}
      aria-hidden={!visible}
      className={[
        "lg:hidden fixed top-0 inset-x-0 h-12 z-40",
        "bg-[var(--color-surface)]/95 backdrop-blur-sm shadow-sm",
        "flex items-center justify-between px-5",
        "transition-all duration-200 ease-in-out",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-12 pointer-events-none",
      ].join(" ")}
    >
      {/* Left: district + area name */}
      <div className="flex items-baseline gap-2 min-w-0">
        <span className="font-data font-bold text-[var(--color-ink)] shrink-0">
          {district}
        </span>
        <span className="text-sm text-[var(--color-muted)] truncate">
          {areaName}
        </span>
      </div>

      {/* Right: score */}
      <div className="flex items-baseline gap-0.5 shrink-0 ml-3">
        <span className={`font-data font-bold text-lg ${scoreColor}`}>
          {score}
        </span>
        <span className="font-data text-sm text-[var(--color-muted)]">/10</span>
      </div>
    </div>
  );
}
