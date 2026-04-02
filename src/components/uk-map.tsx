"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { UK_REGIONS, POSTCODE_TO_REGION } from "@/data/uk-regions";

interface PostcodeEntry {
  district: string;
  areaName: string;
  score: number;
  scoreGrade: string;
}

interface RegionStats {
  avgScore: number;
  worstScore: number;
  count: number;
  flaggedCount: number;
}

interface TooltipState {
  x: number;
  y: number;
  regionId: string;
}

interface UKMapProps {
  postcodes: PostcodeEntry[];
  onRegionSelect?: (regionId: string | null) => void;
}

/** Extract the alpha prefix from a UK postcode district (e.g. "SW1" -> "SW") */
function postcodePrefix(district: string): string {
  const match = district.match(/^([A-Z]+)/i);
  return match ? match[1].toUpperCase() : "";
}

/** Interpolate a score (0–10) to a colour: coral (0) -> amber (5) -> teal (10). */
function scoreToColor(score: number): string {
  const clamped = Math.max(0, Math.min(10, score));
  // HSL values for the three stops
  // coral #ef4444 -> hsl(0, 84%, 60%)
  // amber #d97706 -> hsl(38, 92%, 44%)
  // teal  #0891b2 -> hsl(189, 94%, 37%)
  if (clamped <= 5) {
    const t = clamped / 5;
    const h = 0 + t * 38;
    const s = 84 + t * (92 - 84);
    const l = 60 + t * (44 - 60);
    return `hsl(${h.toFixed(0)}, ${s.toFixed(0)}%, ${l.toFixed(0)}%)`;
  } else {
    const t = (clamped - 5) / 5;
    const h = 38 + t * (189 - 38);
    const s = 92 + t * (94 - 92);
    const l = 44 + t * (37 - 44);
    return `hsl(${h.toFixed(0)}, ${s.toFixed(0)}%, ${l.toFixed(0)}%)`;
  }
}

const NO_DATA_COLOR = "#d1d5db";

export function UKMap({ postcodes, onRegionSelect }: UKMapProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Compute region stats from postcodes
  const regionStats = useMemo(() => {
    const acc: Record<string, { total: number; count: number; worst: number; flagged: number }> = {};

    for (const pc of postcodes) {
      if (pc.score < 0) continue;
      const prefix = postcodePrefix(pc.district);
      const regionId =
        POSTCODE_TO_REGION[prefix] ??
        POSTCODE_TO_REGION[prefix.slice(0, 1)] ??
        null;
      if (!regionId) continue;
      if (!acc[regionId]) acc[regionId] = { total: 0, count: 0, worst: 10, flagged: 0 };
      acc[regionId].total += pc.score;
      acc[regionId].count += 1;
      acc[regionId].worst = Math.min(acc[regionId].worst, pc.score);
      if (pc.score < 7) acc[regionId].flagged += 1;
    }

    const result: Record<string, RegionStats> = {};
    for (const [id, { total, count, worst, flagged }] of Object.entries(acc)) {
      result[id] = { avgScore: total / count, worstScore: worst, count, flaggedCount: flagged };
    }
    return result;
  }, [postcodes]);

  const handleClick = useCallback(
    (regionId: string) => {
      const next = selectedRegion === regionId ? null : regionId;
      setSelectedRegion(next);
      onRegionSelect?.(next);
    },
    [selectedRegion, onRegionSelect],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, regionId: string) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        regionId,
      });
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
    setHoveredRegion(null);
  }, []);

  const tooltipRegion = tooltip
    ? UK_REGIONS.find((r) => r.id === tooltip.regionId)
    : null;
  const tooltipStats = tooltip ? regionStats[tooltip.regionId] : null;

  return (
    <div className="relative flex justify-center">
      <svg
        ref={svgRef}
        viewBox="60 200 340 460"
        className="w-full h-auto mx-auto"
        style={{ maxWidth: 280 }}
        role="img"
        aria-label="UK water quality map by region"
      >
        {/* Sea background */}
        <rect x="60" y="200" width="340" height="460" fill="var(--color-wash)" rx="12" />

        {UK_REGIONS.map((region) => {
          const stats = regionStats[region.id];
          const fill = stats ? scoreToColor(stats.worstScore) : NO_DATA_COLOR;
          const isSelected = selectedRegion === region.id;
          const isHovered = hoveredRegion === region.id;

          return (
            <g key={region.id}>
              {region.paths.map((pathD, i) => (
              <path
              key={`${region.id}-${i}`}
              d={pathD}
              fill={fill}
              stroke={isSelected ? "#0891b2" : "rgba(255,255,255,0.8)"}
              strokeWidth={isSelected ? 2.5 : 1}
              style={{
                cursor: "pointer",
                filter: isHovered ? "brightness(1.15)" : "brightness(1)",
                transition: "fill 0.3s ease, filter 0.2s ease, stroke 0.2s ease, stroke-width 0.2s ease",
              }}
              onClick={() => handleClick(region.id)}
              onMouseMove={(e) => {
                handleMouseMove(e, region.id);
                setHoveredRegion(region.id);
              }}
              onMouseEnter={(e) => {
                handleMouseMove(e, region.id);
                setHoveredRegion(region.id);
              }}
              onMouseLeave={handleMouseLeave}
              aria-label={`${region.name}${stats ? ` — Average score: ${stats.avgScore.toFixed(1)}` : ""}`}
            />
              ))}
            </g>
          );
        })}

        {/* No labels — let the colors and interaction speak */}
      </svg>

      {/* Tooltip */}
      {tooltip && tooltipRegion && (
        <div
          className="absolute pointer-events-none z-10 rounded-lg px-3 py-2 text-xs shadow-lg border border-rule"
          style={{
            left: Math.min(tooltip.x + 12, 340),
            top: tooltip.y - 48,
            background: "var(--color-surface)",
          }}
        >
          <p className="font-semibold text-ink">{tooltipRegion.name}</p>
          {tooltipStats ? (
            <p className="text-muted mt-0.5">
              {tooltipStats.count} area{tooltipStats.count !== 1 ? "s" : ""} checked
              {tooltipStats.flaggedCount > 0
                ? ` · ${tooltipStats.flaggedCount} with issues`
                : " · All looking good"}
            </p>
          ) : (
            <p className="text-faint mt-0.5">No data</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div
        className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg py-1.5 px-2.5 text-[10px] border border-rule"
        style={{ background: "var(--color-surface)" }}
      >
        <span className="flex items-center gap-1 text-muted">
          <span
            className="w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ backgroundColor: scoreToColor(10) }}
          />
          All safe
        </span>
        <span className="flex items-center gap-1 text-muted">
          <span
            className="w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ backgroundColor: scoreToColor(5) }}
          />
          Some issues
        </span>
        <span className="flex items-center gap-1 text-muted">
          <span
            className="w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ backgroundColor: scoreToColor(2) }}
          />
          Needs attention
        </span>
        <span className="flex items-center gap-1 text-muted">
          <span
            className="w-2.5 h-2.5 rounded-sm shrink-0 border border-rule"
            style={{ backgroundColor: NO_DATA_COLOR }}
          />
          No data
        </span>
      </div>
    </div>
  );
}
