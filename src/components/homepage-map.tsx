"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, MapPin, X } from "lucide-react";
import { UKMap } from "@/components/uk-map";
import { UK_REGIONS, POSTCODE_TO_REGION } from "@/data/uk-regions";
import { getScoreColor } from "@/lib/types";

interface MapPostcodeEntry {
  district: string;
  areaName: string;
  score: number;
  scoreGrade: string;
}

interface HomepageMapProps {
  postcodes: MapPostcodeEntry[];
}

function postcodePrefix(district: string): string {
  const match = district.match(/^([A-Z]+)/i);
  return match ? match[1].toUpperCase() : "";
}

function scoreBadgeClass(score: number): string {
  const c = getScoreColor(score);
  if (c === "safe") return "badge badge-safe";
  if (c === "warning") return "badge badge-warning";
  return "badge badge-danger";
}

export function HomepageMap({ postcodes }: HomepageMapProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const handleRegionSelect = useCallback((regionId: string | null) => {
    setSelectedRegion((prev) => (prev === regionId ? null : regionId));
  }, []);

  const regionPostcodes = useMemo(() => {
    if (!selectedRegion) return [];
    return postcodes
      .filter((pc) => {
        if (pc.score < 0) return false;
        const prefix = postcodePrefix(pc.district);
        const regionId =
          POSTCODE_TO_REGION[prefix] ??
          POSTCODE_TO_REGION[prefix.slice(0, 1)] ??
          null;
        return regionId === selectedRegion;
      })
      .sort((a, b) => a.score - b.score)
      .slice(0, 20);
  }, [postcodes, selectedRegion]);

  const selectedRegionName =
    UK_REGIONS.find((r) => r.id === selectedRegion)?.name ?? "";

  return (
    <div>
      {/* Map — centred, constrained width */}
      <div className="mx-auto max-w-xs">
        <UKMap postcodes={postcodes} onRegionSelect={handleRegionSelect} />
      </div>

      {/* Region postcodes — full width below map */}
      {selectedRegion && regionPostcodes.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
              <h3 className="text-lg font-semibold text-ink">
                {selectedRegionName}
              </h3>
              <span className="text-xs text-muted">
                {regionPostcodes.length} areas
              </span>
            </div>
            <button
              onClick={() => setSelectedRegion(null)}
              className="p-1.5 rounded-lg hover:bg-wash transition-colors text-faint hover:text-ink"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {regionPostcodes.map((pc) => (
              <Link
                key={pc.district}
                href={`/postcode/${pc.district}/`}
                className="card px-3 py-2.5 flex items-center gap-2 group"
              >
                <span className="font-data font-bold text-sm text-ink shrink-0">
                  {pc.district}
                </span>
                <span className="text-xs text-muted flex-1 truncate">
                  {pc.areaName}
                </span>
                <span className={`${scoreBadgeClass(pc.score)} font-data text-xs shrink-0`}>
                  {pc.score.toFixed(1)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
