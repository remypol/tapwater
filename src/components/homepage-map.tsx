"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, ArrowLeft, MapPin } from "lucide-react";
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

const MAX_VISIBLE = 12;

export function HomepageMap({ postcodes }: HomepageMapProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const handleRegionSelect = useCallback((regionId: string | null) => {
    setSelectedRegion(regionId);
    setShowAll(false);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedRegion(null);
    setShowAll(false);
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
      .sort((a, b) => a.score - b.score);
  }, [postcodes, selectedRegion]);

  const selectedRegionName =
    UK_REGIONS.find((r) => r.id === selectedRegion)?.name ?? "";

  const visible = showAll ? regionPostcodes : regionPostcodes.slice(0, MAX_VISIBLE);
  const hasMore = regionPostcodes.length > MAX_VISIBLE;

  return (
    <>
      {/* Map — always centered, compact */}
      <div className="flex justify-center">
        <div className="w-full max-w-[320px]">
          <UKMap postcodes={postcodes} onRegionSelect={handleRegionSelect} />
        </div>
      </div>

      {/* Region detail — slides in below map when selected (desktop) */}
      {selectedRegion && regionPostcodes.length > 0 && (
        <div className="hidden lg:block mt-6 animate-fade-up">
          <div className="card-elevated p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-ink tracking-tight">
                  {selectedRegionName}
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  {regionPostcodes.length} area{regionPostcodes.length !== 1 ? "s" : ""} with data
                </p>
              </div>
              <button
                onClick={handleClose}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors px-3 py-1.5 rounded-lg hover:bg-wash"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
              {visible.map((pc) => (
                <Link
                  key={pc.district}
                  href={`/postcode/${pc.district}/`}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-wash transition-colors group border border-rule"
                >
                  <MapPin className="w-3 h-3 text-faint shrink-0" />
                  <span className="font-data font-bold text-sm text-ink w-12 shrink-0">
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

            {hasMore && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full text-sm text-accent font-medium py-2.5 mt-3 hover:underline"
              >
                Show all {regionPostcodes.length} areas
              </button>
            )}
          </div>
        </div>
      )}

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
