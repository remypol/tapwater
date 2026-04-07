"use client";

interface TrendPoint { date: string; totalLevel: number; }

interface PfasTrendChartProps {
  data: TrendPoint[];
  whoGuideline?: number;
}

export function PfasTrendChart({ data, whoGuideline = 0.1 }: PfasTrendChartProps) {
  if (data.length < 2) return null;

  const width = 600;
  const height = 250;
  const pad = { top: 20, right: 60, bottom: 40, left: 50 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const maxVal = Math.max(...data.map((d) => d.totalLevel), whoGuideline * 1.2);
  const xScale = (i: number) => pad.left + (i / (data.length - 1)) * chartW;
  const yScale = (v: number) => pad.top + chartH - (v / maxVal) * chartH;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(d.totalLevel).toFixed(1)}`)
    .join(" ");

  const whoY = yScale(whoGuideline);

  // Show ~6 evenly spaced x-axis labels
  const step = Math.max(1, Math.floor(data.length / 6));
  const xLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="PFAS levels over time">
      {/* Grid lines + Y labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const val = pct * maxVal;
        const y = yScale(val);
        return (
          <g key={pct}>
            <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
            <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#94a3b8">{val.toFixed(3)}</text>
          </g>
        );
      })}

      {/* WHO guideline */}
      <line x1={pad.left} x2={width - pad.right} y1={whoY} y2={whoY} stroke="#ef4444" strokeWidth={1} strokeDasharray="4 3" />
      <text x={width - pad.right + 4} y={whoY + 4} fontSize={9} fill="#ef4444" textAnchor="start">WHO 0.1 µg/L</text>

      {/* Data line */}
      <path d={linePath} fill="none" stroke="#a855f7" strokeWidth={2} strokeLinejoin="round" />

      {/* Data points */}
      {data.map((d, i) => (
        <circle key={i} cx={xScale(i)} cy={yScale(d.totalLevel)} r={3} fill="#a855f7" />
      ))}

      {/* X-axis labels */}
      {xLabels.map((d) => {
        const i = data.indexOf(d);
        return (
          <text key={d.date} x={xScale(i)} y={height - 8} textAnchor="middle" fontSize={9} fill="#94a3b8">{d.date}</text>
        );
      })}
    </svg>
  );
}
