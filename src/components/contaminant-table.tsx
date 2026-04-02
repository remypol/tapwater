'use client';

import { useRef, useEffect, useState } from 'react';
import { ContaminantReading, getPercentOfLimit } from '@/lib/types';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────

function getBarColorClass(percent: number): string {
  if (percent >= 90) return 'bg-danger';
  if (percent >= 50) return 'bg-warning';
  return 'bg-safe';
}

function formatValue(value: number | null, unit?: string): string {
  if (value === null) return '—';
  return unit ? `${value} ${unit}` : String(value);
}

// ── Sub-components ─────────────────────────────────────────────────────────

interface StatusCellProps {
  status: ContaminantReading['status'];
  display?: 'inline' | 'badge';
}

function StatusDisplay({ status, display = 'inline' }: StatusCellProps) {
  if (display === 'badge') {
    const badgeClass =
      status === 'pass'
        ? 'badge badge-safe'
        : status === 'warning'
          ? 'badge badge-warning'
          : 'badge badge-danger';

    return (
      <span className={badgeClass}>
        {status === 'pass' && <CheckCircle2 className="w-3 h-3" />}
        {status === 'warning' && <AlertTriangle className="w-3 h-3" />}
        {status === 'fail' && <XCircle className="w-3 h-3" />}
        {status === 'pass' ? 'Safe' : status === 'warning' ? 'Watch' : 'Over limit'}
      </span>
    );
  }

  // inline (desktop table cell)
  if (status === 'pass') {
    return (
      <span className="inline-flex items-center gap-1.5 text-safe">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span className="text-xs font-medium">Safe</span>
      </span>
    );
  }
  if (status === 'warning') {
    return (
      <span className="inline-flex items-center gap-1.5 text-warning">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span className="text-xs font-medium">Watch</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-danger">
      <XCircle className="w-4 h-4 shrink-0" />
      <span className="text-xs font-medium">Over limit</span>
    </span>
  );
}

interface ProgressBarProps {
  percent: number;
  visible: boolean;
}

function ProgressBar({ percent, visible }: ProgressBarProps) {
  const colorClass = getBarColorClass(percent);
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100 mt-1.5 overflow-hidden">
      <div
        className={`h-1.5 rounded-full ${colorClass} ${visible ? 'bar-animated' : ''}`}
        style={{ width: `${percent}%` }}
        role="presentation"
      />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function ContaminantTable({ readings }: { readings: ContaminantReading[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>

      {/* ── Desktop table (md+) ── */}
      <div className="hidden md:block card rounded-xl overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-wash text-left">
              <th scope="col" className="w-[30%] py-3 px-4 text-xs font-medium uppercase tracking-wider text-muted">
                Substance
              </th>
              <th scope="col" className="w-[22%] py-3 px-4 text-xs font-medium uppercase tracking-wider text-muted">
                Found
              </th>
              <th scope="col" className="w-[17%] py-3 px-4 text-xs font-medium uppercase tracking-wider text-muted">
                Safe Level
              </th>
              <th scope="col" className="w-[17%] py-3 px-4 text-xs font-medium uppercase tracking-wider text-muted">
                WHO Safe Level
              </th>
              <th scope="col" className="w-[14%] py-3 px-4 text-xs font-medium uppercase tracking-wider text-muted">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {readings.map((reading, i) => {
              const percent = getPercentOfLimit(reading);
              const hasLimit = reading.ukLimit !== null || reading.whoGuideline !== null;
              const isEven = i % 2 === 0;

              return (
                <tr
                  key={reading.name}
                  className={[
                    isEven ? 'bg-wash/30' : 'bg-surface',
                    reading.isPfas ? 'border-l-2 border-l-violet-500' : '',
                    'hover:bg-blue-50/30 transition-colors',
                  ].join(' ')}
                >
                  {/* Contaminant */}
                  <td className="py-3 px-4 align-top">
                    <span className="font-medium text-ink">{reading.name}</span>
                    <div className="text-[10px] text-faint mt-0.5">
                      Source: Environment Agency
                    </div>
                  </td>

                  {/* Your Level */}
                  <td className="py-3 px-4 align-top">
                    <span className="font-data text-sm text-body">
                      {reading.value} {reading.unit}
                    </span>
                    {hasLimit && <ProgressBar percent={percent} visible={visible} />}
                  </td>

                  {/* UK Limit */}
                  <td className="py-3 px-4 align-top">
                    {reading.ukLimit !== null ? (
                      <span className="font-data text-sm text-body">
                        {reading.ukLimit} {reading.unit}
                      </span>
                    ) : (
                      <span className="font-data text-sm text-faint">—</span>
                    )}
                  </td>

                  {/* WHO Guideline */}
                  <td className="py-3 px-4 align-top">
                    {reading.whoGuideline !== null ? (
                      <span className="font-data text-sm text-body">
                        {reading.whoGuideline} {reading.unit}
                      </span>
                    ) : (
                      <span className="font-data text-sm text-faint">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 align-top">
                    <StatusDisplay status={reading.status} display="inline" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards (below md) ── */}
      <div className="md:hidden flex overflow-x-auto gap-3 pb-3 -mx-5 px-5 snap-x snap-mandatory scrollbar-hide sm:flex-wrap sm:overflow-visible sm:mx-0 sm:px-0 sm:gap-3">
        {readings.map((reading) => {
          const percent = getPercentOfLimit(reading);
          const hasLimit = reading.ukLimit !== null || reading.whoGuideline !== null;

          return (
            <div
              key={reading.name}
              className={[
                'card p-4 snap-start shrink-0 w-[280px] sm:w-auto sm:shrink',
                reading.isPfas ? 'border-l-[3px] border-l-violet-500' : '',
              ].join(' ')}
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-medium text-ink">{reading.name}</span>
                  <div className="text-[10px] text-faint mt-0.5">
                    Source: Environment Agency
                  </div>
                </div>
                <StatusDisplay status={reading.status} display="badge" />
              </div>

              {/* Divider */}
              <div className="border-t border-rule mt-2 pt-2">
                {/* Three-column grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-faint mb-1">
                      Found
                    </div>
                    <div className="font-data text-sm text-ink">
                      {reading.value} {reading.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-faint mb-1">
                      Safe level
                    </div>
                    <div className={`font-data text-sm ${reading.ukLimit !== null ? 'text-ink' : 'text-faint'}`}>
                      {formatValue(reading.ukLimit, reading.unit)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-faint mb-1">
                      WHO
                    </div>
                    <div className={`font-data text-sm ${reading.whoGuideline !== null ? 'text-ink' : 'text-faint'}`}>
                      {formatValue(reading.whoGuideline, reading.unit)}
                    </div>
                  </div>
                </div>

                {/* Progress bar + label — only when a reference limit exists */}
                {hasLimit ? (
                  <>
                    <ProgressBar percent={percent} visible={visible} />
                    <div className="text-xs text-muted mt-1.5">
                      {Math.round(percent)}% of safe level
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-faint mt-2">
                    Informational — no set limit
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
