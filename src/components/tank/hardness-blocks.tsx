import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HARDNESS_BANDS, SOFTENER_THRESHOLD_MGL } from "@/lib/softener-guides";
import { hardnessColour } from "@/components/hardness-map";
import { postcodeAreaName } from "@/lib/postcode-areas";
import type { HardnessMapArea } from "@/lib/data";
import { SoftenerButton } from "./tank-actions";
import { TankSearch } from "./tank-search";

/**
 * The pieces the three hardness pages share, in the tank system: the scale, a
 * pill list of areas, an area table, and the softener panel.
 */

const HARD_MAX = 400;

/** The hardness scale as one bar of water turning to chalk, with the softener line. */
export function HardnessScale({ value, caption }: { value?: number | null; caption?: string }) {
  return (
    <figure className="wt-scale">
      <div className="wt-crust" role="img" aria-label={value != null ? `${Math.round(value)} mg/L on a scale from soft to ${HARD_MAX}` : `Hardness scale from soft to ${HARD_MAX} mg/L`}>
        <u style={{ left: `${(SOFTENER_THRESHOLD_MGL / HARD_MAX) * 100}%` }}>a softener pays off from {SOFTENER_THRESHOLD_MGL}</u>
        {value != null ? <i style={{ left: `${Math.min(value / HARD_MAX, 1) * 100}%` }} /> : null}
      </div>
      <ol className="wt-scale-bands" aria-hidden="true">
        {HARDNESS_BANDS.map((b) => (
          <li key={b.label} style={{ width: `${((b.to - b.from) / HARD_MAX) * 100}%` }}>
            <span>{b.to - b.from < 40 ? "" : b.label}</span>
            <small>{b.from}</small>
          </li>
        ))}
      </ol>
      <dl className="wt-sr">
        {HARDNESS_BANDS.map((b) => (
          <div key={b.label}><dt>{b.label}</dt><dd>{b.from} to {b.to} mg/L</dd></div>
        ))}
      </dl>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

export function AreaPills({ areas }: { areas: { area: string; median: number }[] }) {
  return (
    <p className="wt-pills wt-nums">
      {areas.map((a) => (
        <Link key={a.area} href={`/hardness/${a.area.toLowerCase()}`}>
          <span className="wt-dot" style={{ background: hardnessColour(a.median) }} aria-hidden="true" />
          {postcodeAreaName(a.area)} <b>{a.median}</b>
        </Link>
      ))}
    </p>
  );
}

export function AreaTable({ title, areas }: { title: string; areas: HardnessMapArea[] }) {
  return (
    <div>
      <h3 className="wt-h3">{title}</h3>
      <div className="wt-tablewrap">
        <table className="wt-table wt-table--light wt-nums" style={{ minWidth: 420 }}>
          <thead>
            <tr><th scope="col">Area</th><th scope="col" style={{ textAlign: "right" }}>Median</th><th scope="col" style={{ textAlign: "right" }}>Range</th><th scope="col" style={{ textAlign: "right" }}>Districts</th></tr>
          </thead>
          <tbody>
            {areas.map((a) => (
              <tr key={a.area}>
                <td>
                  <span className="wt-dot" style={{ background: hardnessColour(a.median) }} aria-hidden="true" />
                  <Link href={`/hardness/${a.area.toLowerCase()}`}>{postcodeAreaName(a.area)}</Link> <small>{a.area}</small>
                </td>
                <td style={{ textAlign: "right" }}>{a.median}</td>
                <td style={{ textAlign: "right" }}>{a.min}–{a.max}</td>
                <td style={{ textAlign: "right" }}>{a.measured}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** The commercial step of every hardness page: quotes first, then the guides that answer doubts. */
export function SoftenerPanel({ district, heading, intro, hardness }: { district?: string; heading: string; intro: string; hardness: number }) {
  return (
    <div className="wt-primary" id="wt-fix">
      <p className="wt-gauge wt-nums" aria-hidden="true">{Math.round(hardness)}<small>mg/L</small></p>
      <h3>{heading}</h3>
      <p>{intro}</p>
      <ul className="wt-assure">
        <li>Free quotes</li>
        <li>Local installers</li>
        <li>No obligation</li>
      </ul>
      <div className="wt-acts">
        <SoftenerButton district={district ?? "your postcode"} label={district ? `Get softener quotes for ${district}` : "Get softener quotes"} paint="sun" placement="action" />
        <Link href="/guides/do-i-need-a-water-softener" className="wt-link">Do I actually need one?</Link>
      </div>
    </div>
  );
}

export function CheckPostcode({ heading, intro, hash = "wt-hardness" }: { heading: string; intro: string; hash?: string }) {
  return (
    <div className="wt-check">
      <h2 className="wt-h2">{heading}</h2>
      <p className="wt-sub">{intro}</p>
      <TankSearch hash={hash} />
    </div>
  );
}

export function GuideLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="wt-arrow">
      {children}
      <ArrowRight aria-hidden="true" />
    </Link>
  );
}
