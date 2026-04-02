"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
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

    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

    import("leaflet").then(async (L) => {
      await import("leaflet/dist/leaflet.css");
      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [53.5, -2.0],
        zoom: isMobile ? 5 : 6,
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false,
      });

      // Dark tile layer
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
          subdomains: "abcd",
        }
      ).addTo(map);

      // Zoom controls on top-right
      L.control.zoom({ position: "topright" }).addTo(map);

      for (const pc of postcodes) {
        if (pc.score < 0) continue;

        const colorKey = getScoreColor(pc.score);
        const color = SCORE_COLORS[colorKey];
        const radius = pc.score >= 7 ? 6 : pc.score < 5 ? 9 : 7;

        const marker = L.circleMarker([pc.lat, pc.lng], {
          radius,
          fillColor: color,
          fillOpacity: 0.85,
          color: "#ffffff",
          weight: 1.5,
          opacity: 0.9,
        });

        marker.on("click", () => {
          setSelected(pc);
          map.flyTo([pc.lat, pc.lng], Math.max(map.getZoom(), 9), {
            animate: true,
            duration: 0.6,
          });
        });

        marker.on("mouseover", function (this: L.CircleMarker) {
          this.setRadius(radius + 3);
          this.setStyle({ fillOpacity: 1, weight: 2.5, color: "#ffffff" });
        });

        marker.on("mouseout", function (this: L.CircleMarker) {
          this.setRadius(radius);
          this.setStyle({ fillOpacity: 0.85, weight: 1.5, color: "#ffffff" });
        });

        marker.bindTooltip(
          `<strong>${pc.district}</strong> — ${pc.areaName}<br/>${pc.score.toFixed(1)}/10`,
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
    <>
      {/* Cluster style overrides */}
      <style>{`
        .leaflet-attribution-flag { display: none !important; }
        .leaflet-control-attribution {
          font-size: 10px !important;
          opacity: 0.5 !important;
          background: rgba(0,0,0,0.4) !important;
          color: #aaa !important;
        }
        .leaflet-control-attribution a { color: #888 !important; }
      `}</style>

      <div className="relative">
        <div
          ref={mapRef}
          className="w-full rounded-xl overflow-hidden h-[400px] sm:h-[480px]"
        />

        {/* Legend */}
        {loaded && (
          <div
            className="absolute bottom-4 left-4 z-[1000] flex items-center gap-3 rounded-xl py-2 px-3 text-xs"
            style={{ background: "#1a1a2e", border: "1px solid #2a2a4a" }}
          >
            <span className="flex items-center gap-1.5 text-gray-300">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: SCORE_COLORS.safe,
                  boxShadow: `0 0 6px ${SCORE_COLORS.safe}88`,
                }}
              />
              Good (7+)
            </span>
            <span className="flex items-center gap-1.5 text-gray-300">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: SCORE_COLORS.warning,
                  boxShadow: `0 0 6px ${SCORE_COLORS.warning}88`,
                }}
              />
              Fair (5–7)
            </span>
            <span className="flex items-center gap-1.5 text-gray-300">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: SCORE_COLORS.danger,
                  boxShadow: `0 0 6px ${SCORE_COLORS.danger}88`,
                }}
              />
              Poor (&lt;5)
            </span>
          </div>
        )}

        {/* Selected postcode panel */}
        {selected && (
          <div
            className="absolute top-4 right-4 z-[1000] w-60 rounded-xl p-4"
            style={{ background: "#1a1a2e", border: "1px solid #2a2a4a" }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-white truncate">{selected.district}</p>
                <p className="text-sm text-gray-400 truncate">{selected.areaName}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className="font-bold text-lg tabular-nums"
                  style={{ color: SCORE_COLORS[getScoreColor(selected.score)] }}
                >
                  {selected.score.toFixed(1)}
                </span>
                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-500 hover:text-gray-200 transition-colors"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <Link
              href={`/postcode/${selected.district}/`}
              className="mt-3 flex items-center justify-center gap-1 w-full text-center text-sm font-medium rounded-lg py-2 transition-colors"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "#e2e8f0",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              View report →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
