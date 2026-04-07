"use client";

import dynamic from "next/dynamic";

const PfasTrendChart = dynamic(
  () => import("@/components/pfas-trend-chart").then((m) => m.PfasTrendChart),
  { ssr: false }
);

interface TrendPoint {
  date: string;
  totalLevel: number;
}

interface PfasTrendChartWrapperProps {
  data: TrendPoint[];
}

export function PfasTrendChartWrapper({ data }: PfasTrendChartWrapperProps) {
  return <PfasTrendChart data={data} />;
}
