'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { ContaminantReading, getPercentOfLimit } from '@/lib/types';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

// Map contaminant display names → slug for cross-linking to /contaminant/[slug]
const CONTAMINANT_SLUG_MAP: Record<string, string> = {
  "PFAS": "pfas", "Lead": "lead", "Nitrate": "nitrate", "Copper": "copper",
  "Chlorine": "chlorine", "Fluoride": "fluoride", "Trihalomethanes": "trihalomethanes",
  "E. coli": "ecoli", "Arsenic": "arsenic", "Manganese": "manganese",
  "Iron": "iron", "Mercury": "mercury", "Microplastics": "microplastics",
  "Nitrite": "nitrite", "Turbidity": "turbidity", "Aluminium": "aluminium",
  "Coliform Bacteria": "coliform", "Cadmium": "cadmium", "Chromium": "chromium",
  "Pesticides": "pesticides", "Total Coliforms": "coliform",
  "Coliform bacteria": "coliform",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function getBarColorClass(percent: number): string {
  if (percent >= 90) return 'bg-danger';
  if (percent >= 50) return 'bg-warning';
  return 'bg-safe';
}

function cleanNumber(value: number): string {
  // Fix floating point noise: 0.0000149999999 → 0.0000150
  if (value === 0) return '0';
  const precision = value < 0.001 ? 3 : value < 0.1 ? 4 : value < 10 ? 3 : 2;
  return parseFloat(value.toPrecision(precision)).toString();
}

function formatValue(value: number | null, unit?: string): string {
  if (value === null) return '—';
  return unit ? `${cleanNumber(value)} ${unit}` : cleanNumber(value);
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
    <div className="h-1.5 w-full rounded-full bg-rule mt-1.5 overflow-hidden">
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
  const [showAllSafe, setShowAllSafe] = useState(false);

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

  // Split readings into flagged (shown always) and safe (collapsed)
  const flagged = readings.filter((r) => r.status !== 'pass');
  const safe = readings.filter((r) => r.status === 'pass');
  const hasFlagged = flagged.length > 0;
  const visibleReadings = showAllSafe ? readings : (hasFlagged ? flagged : readings.slice(0, 6));

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
            {visibleReadings.map((reading, i) => {
              const percent = getPercentOfLimit(reading);
              const hasLimit = reading.ukLimit !== null || reading.whoGuideline !== null;
              const isEven = i % 2 === 0;

              return (
                <tr
                  key={reading.name}
                  className={[
                    reading.status === 'fail' ? 'bg-red-50' : reading.status === 'warning' ? 'bg-amber-50' : isEven ? 'bg-wash/30' : 'bg-surface',
                    reading.isPfas ? 'border-l-2 border-l-violet-500' : reading.status === 'fail' ? 'border-l-2 border-l-red-500' : reading.status === 'warning' ? 'border-l-2 border-l-amber-500' : '',
                    'hover:bg-blue-50/30 transition-colors',
                  ].join(' ')}
                >
                  {/* Contaminant */}
                  <td className="py-4 px-4 align-top">
                    {CONTAMINANT_SLUG_MAP[reading.name] ? (
                      <Link href={`/contaminant/${CONTAMINANT_SLUG_MAP[reading.name]}`} className="font-medium text-accent hover:underline">
                        {reading.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-ink">{reading.name}</span>
                    )}
                  </td>

                  {/* Your Level */}
                  <td className="py-4 px-4 align-top">
                    <span className="font-data text-sm text-body">
                      {reading.belowDetectionLimit ? `< ${cleanNumber(reading.value)}` : cleanNumber(reading.value)} {reading.unit}
                    </span>
                    {hasLimit && <ProgressBar percent={percent} visible={visible} />}
                  </td>

                  {/* UK Limit */}
                  <td className="py-4 px-4 align-top">
                    {reading.ukLimit !== null ? (
                      <span className="font-data text-sm text-body">
                        {reading.ukLimit} {reading.unit}
                      </span>
                    ) : (
                      <span className="font-data text-sm text-faint">—</span>
                    )}
                  </td>

                  {/* WHO Guideline */}
                  <td className="py-4 px-4 align-top">
                    {reading.whoGuideline !== null ? (
                      <span className="font-data text-sm text-body">
                        {reading.whoGuideline} {reading.unit}
                      </span>
                    ) : (
                      <span className="font-data text-sm text-faint">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 align-top">
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
        {visibleReadings.map((reading) => {
          const percent = getPercentOfLimit(reading);
          const hasLimit = reading.ukLimit !== null || reading.whoGuideline !== null;

          return (
            <div
              key={reading.name}
              className={[
                'card p-4 snap-start shrink-0 w-[300px] sm:w-auto sm:shrink',
                reading.isPfas ? 'border-l-[3px] border-l-violet-500' : '',
                reading.status === 'fail' ? 'bg-red-50 border border-red-200 shadow-[inset_0_0_0_1px_rgba(220,38,38,0.08)]' : '',
                reading.status === 'warning' ? 'bg-amber-50 border border-amber-200' : '',
              ].join(' ')}
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-2">
                {CONTAMINANT_SLUG_MAP[reading.name] ? (
                  <Link href={`/contaminant/${CONTAMINANT_SLUG_MAP[reading.name]}`} className="font-medium text-accent hover:underline">
                    {reading.name}
                  </Link>
                ) : (
                  <span className="font-medium text-ink">{reading.name}</span>
                )}
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
                      {reading.belowDetectionLimit ? `< ${cleanNumber(reading.value)}` : cleanNumber(reading.value)} {reading.unit}
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

      {/* Show/hide safe results */}
      {!showAllSafe && safe.length > 0 && hasFlagged && (
        <button
          onClick={() => setShowAllSafe(true)}
          className="mt-4 w-full text-sm text-accent font-medium py-2.5 rounded-lg border border-rule hover:border-accent hover:bg-accent-light transition-colors flex items-center justify-center gap-1.5"
        >
          <CheckCircle2 className="w-4 h-4 text-safe" />
          Show {safe.length} safe result{safe.length !== 1 ? 's' : ''}
        </button>
      )}
      {!showAllSafe && !hasFlagged && readings.length > 6 && (
        <button
          onClick={() => setShowAllSafe(true)}
          className="mt-4 w-full text-sm text-accent font-medium py-2.5 rounded-lg border border-rule hover:border-accent hover:bg-accent-light transition-colors"
        >
          Show all {readings.length} results
        </button>
      )}

      {/* Attribution */}
      <p className="text-xs text-faint mt-3">
        Source: {readings.some((r) => r.source === 'drinking') ? 'Stream Water Data Portal' : 'Environment Agency'}
      </p>

    </div>
  );
}
