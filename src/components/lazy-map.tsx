"use client";

import dynamic from "next/dynamic";
import type { MapPostcode } from "@/lib/data";

const WaterQualityMap = dynamic(
  () =>
    import("@/components/water-quality-map").then((m) => m.WaterQualityMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="card-elevated rounded-xl w-full animate-pulse bg-wash"
        style={{ height: 480 }}
      />
    ),
  }
);

export function LazyMap({ postcodes }: { postcodes: MapPostcode[] }) {
  return <WaterQualityMap postcodes={postcodes} />;
}
