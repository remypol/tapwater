"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PostcodeData } from "@/lib/types";
import { getScoreColor } from "@/lib/types";

interface MapProps {
  postcodes: {
    district: string;
    areaName: string;
    lat: number;
    lng: number;
    score: number;
    scoreGrade: string;
  }[];
}

const SCORE_COLORS = {
  safe: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
} as const;

export function WaterQualityMap({ postcodes }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const [selected, setSelected] = useState<MapProps["postcodes"][0] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamic import to avoid SSR issues
    import("leaflet").then((L) => {
      import("leaflet/dist/leaflet.css");

      const map = L.map(mapRef.current!, {
        center: [53.5, -2.0], // Centre of England
        zoom: 6,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false, // Prevent accidental scroll hijack
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add markers for each postcode
      for (const pc of postcodes) {
        if (pc.score < 0) continue; // Skip insufficient data

        const color = SCORE_COLORS[getScoreColor(pc.score)];
        const radius = pc.score >= 7 ? 6 : pc.score >= 5 ? 7 : 8; // Worse = bigger marker

        const marker = L.circleMarker([pc.lat, pc.lng], {
          radius,
          fillColor: color,
          fillOpacity: 0.8,
          color: color,
          weight: 1.5,
          opacity: 1,
        });

        marker.on("click", () => {
          setSelected(pc);
        });

        marker.on("mouseover", function (this: L.CircleMarker) {
          this.setRadius(radius + 3);
          this.setStyle({ fillOpacity: 1, weight: 2.5 });
        });

        marker.on("mouseout", function (this: L.CircleMarker) {
          this.setRadius(radius);
          this.setStyle({ fillOpacity: 0.8, weight: 1.5 });
        });

        marker.bindTooltip(
          `<strong>${pc.district}</strong> ${pc.areaName}<br/>${pc.score.toFixed(1)}/10`,
          { direction: "top", offset: [0, -8] }
        );

        marker.addTo(map);
      }

      mapInstanceRef.current = map;
      setLoaded(true);
    });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [postcodes]);

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="w-full rounded-xl overflow-hidden"
        style={{ height: 480 }}
      />

      {/* Legend */}
      {loaded && (
        <div className="absolute bottom-4 left-4 z-[1000] card p-3 flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SCORE_COLORS.safe }} />
            Good (7+)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SCORE_COLORS.warning }} />
            Fair (5-7)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SCORE_COLORS.danger }} />
            Poor (&lt;5)
          </span>
        </div>
      )}

      {/* Selected postcode panel */}
      {selected && (
        <div className="absolute top-4 right-4 z-[1000] card-elevated p-4 w-64">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-data font-bold text-ink">{selected.district}</p>
              <p className="text-sm text-muted">{selected.areaName}</p>
            </div>
            <span
              className="font-data text-lg font-bold"
              style={{ color: SCORE_COLORS[getScoreColor(selected.score)] }}
            >
              {selected.score.toFixed(1)}
            </span>
          </div>
          <Link
            href={`/postcode/${selected.district}/`}
            className="mt-3 block w-full text-center text-sm font-medium bg-ink text-white rounded-lg py-2 hover:bg-gray-800 transition-colors"
          >
            View full report
          </Link>
          <button
            onClick={() => setSelected(null)}
            className="mt-1 block w-full text-center text-xs text-faint hover:text-muted transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
