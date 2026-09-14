import Link from "next/link";
import type { HardnessMapDistrict, HardnessMapArea } from "@/lib/data";
import { postcodeAreaName } from "@/lib/postcode-areas";
import { UK_OUTLINE_PATH } from "@/data/uk-outline";

/**
 * The UK drawn from its own water: one dot per postcode district, placed by
 * coordinate, coloured by measured hardness. No basemap. The dots form the
 * coastline on their own, and every dot is a link to the report it came from.
 *
 * Server-rendered SVG, so it indexes, prints, and costs no JavaScript.
 */

const BOUNDS = { minLat: 49.85, maxLat: 60.9, minLng: -8.2, maxLng: 1.85 };
const SCALE = 68; // px per degree of latitude
const COS_MID = Math.cos((55.4 * Math.PI) / 180); // longitude foreshortening at the UK's mid-latitude
const W = Math.round((BOUNDS.maxLng - BOUNDS.minLng) * COS_MID * SCALE);
const H = Math.round((BOUNDS.maxLat - BOUNDS.minLat) * SCALE);

function project(lat: number, lng: number): [number, number] {
  // Whole pixels: a thousand dots at one decimal place is 20 KB of nothing.
  return [
    Math.round((lng - BOUNDS.minLng) * COS_MID * SCALE),
    Math.round((BOUNDS.maxLat - lat) * SCALE),
  ];
}

/** Five bands, two blues for soft and three ambers for hard, matching the bands bar. */
export const HARDNESS_COLOURS = [
  { upTo: 60, label: "Soft", colour: "#38bdf8" },
  { upTo: 120, label: "Moderately soft", colour: "#0284c7" },
  { upTo: 180, label: "Slightly hard", colour: "#fcd34d" },
  { upTo: 250, label: "Hard", colour: "#f59e0b" },
  { upTo: Infinity, label: "Very hard", colour: "#b45309" },
] as const;

export function hardnessColour(value: number): string {
  return HARDNESS_COLOURS.find((b) => value < b.upTo)?.colour ?? HARDNESS_COLOURS[4].colour;
}

interface HardnessMapProps {
  districts: HardnessMapDistrict[];
}

export function HardnessMap({ districts }: HardnessMapProps) {
  // Draw estimated dots first so measured ones sit on top where they overlap.
  const ordered = [...districts].sort((a, b) => Number(a.measured) - Number(b.measured));
  const measuredCount = districts.filter((d) => d.measured).length;

  return (
    <figure className="my-8" aria-labelledby="hardness-map-caption">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-start">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full max-w-[520px] mx-auto h-auto"
          role="img"
          aria-label={`Map of the UK with ${districts.length.toLocaleString("en-GB")} postcode districts coloured by water hardness`}
        >
          {/* Coastline, so the parts with no readings read as land without data, not as a gap in the map. */}
          <path
            d={UK_OUTLINE_PATH}
            fill="var(--color-rule)"
            fillOpacity="0.55"
            stroke="var(--color-rule-strong)"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
          {ordered.map((d) => {
            const [x, y] = project(d.lat, d.lng);
            const colour = hardnessColour(d.value);
            const title = `${d.district} · ${d.areaName} · ${d.value} mg/L${d.measured ? "" : " (area estimate)"}`;
            return (
              <a key={d.district} href={`/postcode/${d.district}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={d.measured ? 3.1 : 2.2}
                  fill={colour}
                  fillOpacity={d.measured ? 0.95 : 0.45}
                >
                  <title>{title}</title>
                </circle>
              </a>
            );
          })}
        </svg>

        <div className="lg:pt-6">
          <ol className="space-y-2">
            {HARDNESS_COLOURS.map((b, i) => {
              const from = i === 0 ? 0 : HARDNESS_COLOURS[i - 1].upTo;
              const range = b.upTo === Infinity ? `${from} mg/L and above` : `${from} to ${b.upTo} mg/L`;
              return (
                <li key={b.label} className="flex items-center gap-3 text-sm">
                  <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: b.colour }} aria-hidden="true" />
                  <span className="text-ink font-medium">{b.label}</span>
                  <span className="text-muted font-data text-xs ml-auto">{range}</span>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-xs text-muted leading-relaxed">
            Solid dots are districts with their own hardness reading. Faint dots take the median of their postcode area. Grey land has no hardness in the open data we use yet. Hover a dot for the value, click it for the full report.
          </p>
        </div>
      </div>
      <figcaption id="hardness-map-caption" className="text-xs text-muted mt-3">
        {measuredCount.toLocaleString("en-GB")} districts measured from water company drinking-water tests, {(districts.length - measuredCount).toLocaleString("en-GB")} estimated from their postcode area. Hardness as mg/L calcium carbonate.
      </figcaption>
    </figure>
  );
}

interface AreaTableProps {
  title: string;
  areas: HardnessMapArea[];
  /** Copy for the empty state, never shown when rows exist. */
  note?: string;
}

export function HardnessAreaTable({ title, areas, note }: AreaTableProps) {
  return (
    <div>
      <h3 className="font-sans font-semibold text-ink mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted border-b border-rule-strong">
              <th className="py-2 pr-3 font-medium">Area</th>
              <th className="py-2 pr-3 font-medium text-right">Median</th>
              <th className="py-2 pr-3 font-medium text-right hidden sm:table-cell">Range</th>
              <th className="py-2 font-medium text-right">Districts</th>
            </tr>
          </thead>
          <tbody>
            {areas.map((a) => (
              <tr key={a.area} className="border-b border-rule">
                <td className="py-2 pr-3">
                  <span className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle" style={{ background: hardnessColour(a.median) }} aria-hidden="true" />
                  <Link href={`/hardness/${a.area.toLowerCase()}`} className="text-ink hover:text-accent transition-colors">
                    {postcodeAreaName(a.area)}
                  </Link>
                  <span className="text-muted ml-1.5 font-data text-xs">{a.area}</span>
                </td>
                <td className="py-2 pr-3 text-right font-data text-ink">{a.median}</td>
                <td className="py-2 pr-3 text-right font-data text-muted hidden sm:table-cell">{a.min}–{a.max}</td>
                <td className="py-2 text-right font-data text-muted">{a.measured}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="text-xs text-muted mt-2">{note}</p>}
    </div>
  );
}
