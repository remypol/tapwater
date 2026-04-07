"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapPoint {
  lat: number;
  lng: number;
  label: string;
  maxLevel: number;
  compound: string;
  city?: string;
  latestDate: string;
}

interface PfasMapProps {
  points: MapPoint[];
  center?: [number, number];  // [lng, lat]
  zoom?: number;
}

function markerColor(level: number): string {
  if (level >= 0.075) return "#ef4444";
  if (level >= 0.01) return "#f59e0b";
  return "#22c55e";
}

export function PfasMap({ points, center, zoom }: PfasMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.warn("[PfasMap] NEXT_PUBLIC_MAPBOX_TOKEN not set");
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: center ?? [-2.5, 54.0],
      zoom: zoom ?? 5.5,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      for (const point of points) {
        const el = document.createElement("div");
        el.style.width = "12px";
        el.style.height = "12px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = markerColor(point.maxLevel);
        el.style.border = "2px solid white";
        el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";
        el.style.cursor = "pointer";

        const popup = new mapboxgl.Popup({ offset: 15, closeButton: false }).setHTML(
          `<div style="font-family:system-ui;font-size:13px;line-height:1.4;">
            <strong>${point.label}</strong><br/>
            ${point.compound}: <strong>${point.maxLevel.toFixed(4)} µg/L</strong><br/>
            <span style="color:#666;">${point.latestDate}</span>
            ${point.city ? `<br/><span style="color:#999;">${point.city}</span>` : ""}
          </div>`
        );

        new mapboxgl.Marker({ element: el })
          .setLngLat([point.lng, point.lat])
          .setPopup(popup)
          .addTo(map);
      }

      if (points.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        for (const p of points) bounds.extend([p.lng, p.lat]);
        map.fitBounds(bounds, { padding: 50, maxZoom: 13 });
      }
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [points, center, zoom]);

  return (
    <div ref={containerRef} className="w-full h-[300px] sm:h-[400px] rounded-lg overflow-hidden border border-rule" />
  );
}
