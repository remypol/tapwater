"use client";

import { useEffect, useRef, useState } from "react";
import { getScoreColor } from "@/lib/types";

interface StickyScoreProps {
  district: string;
  areaName: string;
  score: number;
}

function getScoreLabel(score: number): { text: string; className: string } {
  if (score >= 7) return { text: "Safe ✓", className: "text-[var(--color-safe)]" };
  if (score >= 5) return { text: "Watch", className: "text-amber-500" };
  return { text: "Issues", className: "text-[var(--color-danger)]" };
}

function WaterDropIndicator({ score }: { score: number }) {
  const color = getScoreColor(score);
  const fillColor =
    color === "safe" ? "var(--color-safe)" :
    color === "warning" ? "#f59e0b" :
    "var(--color-danger)";

  // Fill level: score/10, clamped 0–1
  const fillFraction = Math.min(1, Math.max(0, score / 10));
  // SVG teardrop path: 16x20px viewBox
  // The filled portion is clipped from the bottom
  const clipY = 20 * (1 - fillFraction);

  return (
    <svg
      width="16"
      height="20"
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Teardrop outline */}
      <path
        d="M8 1 C8 1, 1 8, 1 13 A7 7 0 0 0 15 13 C15 8, 8 1, 8 1Z"
        stroke={fillColor}
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
      {/* Filled portion via clipPath */}
      <clipPath id={`drop-fill-${Math.round(score * 10)}`}>
        <rect x="0" y={clipY} width="16" height="20" />
      </clipPath>
      <path
        d="M8 1 C8 1, 1 8, 1 13 A7 7 0 0 0 15 13 C15 8, 8 1, 8 1Z"
        fill={fillColor}
        clipPath={`url(#drop-fill-${Math.round(score * 10)})`}
      />
    </svg>
  );
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

  const scoreLabel = getScoreLabel(score);

  function handleClick() {
    const sentinel = document.getElementById("score-sentinel");
    if (sentinel) {
      sentinel.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <div
      role="banner"
      aria-label={`${district} water quality score`}
      aria-hidden={!visible}
      onClick={handleClick}
      className={[
        "lg:hidden fixed top-0 inset-x-0 h-12 z-40 cursor-pointer",
        "bg-[var(--color-surface)]/95 backdrop-blur-sm shadow-sm",
        "flex items-center justify-between px-5",
        "transition-all duration-200 ease-in-out",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-12 pointer-events-none",
      ].join(" ")}
    >
      {/* Left: district + area name */}
      <div className="flex items-center gap-2 min-w-0">
        <WaterDropIndicator score={score} />
        <span className="font-data font-bold text-[var(--color-ink)] shrink-0">
          {district}
        </span>
        <span className="text-sm text-[var(--color-muted)] truncate">
          {areaName}
        </span>
      </div>

      {/* Right: score label */}
      <div className="shrink-0 ml-3">
        <span className={`font-data font-bold text-sm ${scoreLabel.className}`}>
          {scoreLabel.text}
        </span>
      </div>
    </div>
  );
}
