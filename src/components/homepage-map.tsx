"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { UKMap } from "@/components/uk-map";
import { RegionSheet } from "@/components/region-sheet";
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

/** Extract the alpha prefix from a UK postcode district (e.g. "SW1" -> "SW") */
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
    setSelectedRegion(regionId);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedRegion(null);
  }, []);

  // Build list of postcodes for the selected region
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
      .sort((a, b) => a.score - b.score);
  }, [postcodes, selectedRegion]);

  const selectedRegionName =
    UK_REGIONS.find((r) => r.id === selectedRegion)?.name ?? "";

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
        {/* Map */}
        <div className="lg:sticky lg:top-6">
          <UKMap postcodes={postcodes} onRegionSelect={handleRegionSelect} />
        </div>

        {/* Desktop: region detail panel */}
        <div className="hidden lg:block">
          {selectedRegion && regionPostcodes.length > 0 ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={handleClose}
                  className="flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  All regions
                </button>
              </div>
              <h3 className="font-display text-xl text-ink italic mb-1">
                {selectedRegionName}
              </h3>
              <p className="text-xs text-muted mb-4">
                {regionPostcodes.length} postcode area
                {regionPostcodes.length !== 1 ? "s" : ""} with data
              </p>
              <div className="flex flex-col gap-1">
                {regionPostcodes.map((pc) => (
                  <Link
                    key={pc.district}
                    href={`/postcode/${pc.district}/`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-wash transition-colors group card"
                  >
                    <span className="font-data font-bold text-sm text-ink w-14 shrink-0">
                      {pc.district}
                    </span>
                    <span className="text-sm text-muted flex-1 truncate">
                      {pc.areaName}
                    </span>
                    <span className={`${scoreBadgeClass(pc.score)} font-data shrink-0`}>
                      {pc.score.toFixed(1)}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-faint group-hover:text-accent transition shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted text-center py-12">
              <p className="text-faint">Tap a region on the map</p>
              <p className="text-faint mt-1">to see postcode-level data.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      <div className="lg:hidden">
        <RegionSheet
          regionId={selectedRegion}
          regionName={selectedRegionName}
          postcodes={regionPostcodes}
          onClose={handleClose}
        />
      </div>
    </>
  );
}
