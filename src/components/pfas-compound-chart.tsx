interface CompoundBar { compound: string; maxLevel: number; detectionCount: number; }

interface PfasCompoundChartProps {
  compounds: CompoundBar[];
  whoGuideline?: number;
}

export function PfasCompoundChart({ compounds, whoGuideline = 0.1 }: PfasCompoundChartProps) {
  if (compounds.length === 0) return null;

  const maxLevel = Math.max(...compounds.map((c) => c.maxLevel), whoGuideline);

  function barColor(level: number): string {
    if (level >= 0.075) return "bg-[#ef4444]";
    if (level >= 0.01) return "bg-[#f59e0b]";
    return "bg-[#22c55e]";
  }

  const guidelinePct = (whoGuideline / maxLevel) * 100;

  return (
    <div className="space-y-3">
      {compounds.map((c) => {
        const pct = Math.max((c.maxLevel / maxLevel) * 100, 2);
        return (
          <div key={c.compound} className="flex items-center gap-3">
            <span className="text-xs text-body font-medium w-28 shrink-0 truncate" title={c.compound}>
              {c.compound}
            </span>
            <div className="flex-1 relative h-6 bg-wash rounded-sm overflow-hidden">
              <div
                className={`h-full rounded-sm ${barColor(c.maxLevel)}`}
                style={{ width: `${pct}%`, opacity: 0.8 }}
              />
              {/* WHO guideline marker */}
              <div
                className="absolute top-0 bottom-0 border-l-2 border-dashed border-[#ef4444]/50"
                style={{ left: `${guidelinePct}%` }}
              />
            </div>
            <span className="text-[10px] text-muted font-data w-24 shrink-0 text-right">
              {c.maxLevel.toFixed(4)} µg/L
            </span>
          </div>
        );
      })}
      <p className="text-[10px] text-muted">
        Dashed line = WHO guideline ({whoGuideline} µg/L). Bar shows maximum detected level.
      </p>
    </div>
  );
}
