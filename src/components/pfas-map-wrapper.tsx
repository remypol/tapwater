"use client";

import dynamic from "next/dynamic";

const PfasMap = dynamic(
  () => import("@/components/pfas-map").then((m) => m.PfasMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] animate-pulse bg-muted/20 rounded-lg" />
    ),
  }
);

interface MapPoint {
  lat: number;
  lng: number;
  label: string;
  maxLevel: number;
  compound: string;
  city?: string;
  latestDate: string;
}

interface PfasMapWrapperProps {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
}

export function PfasMapWrapper({ points, center, zoom }: PfasMapWrapperProps) {
  return <PfasMap points={points} center={center} zoom={zoom} />;
}
