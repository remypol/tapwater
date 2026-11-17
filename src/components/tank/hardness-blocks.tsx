import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HARDNESS_BANDS, SOFTENER_THRESHOLD_MGL } from "@/lib/softener-guides";
import { hardnessColour } from "@/components/hardness-map";
import { postcodeAreaName } from "@/lib/postcode-areas";
import type { HardnessMapArea } from "@/lib/data";
import { householdLoads, WATER_USE_SOURCE, REQUEST_WINDOW_DAYS } from "@/lib/softener-sizing";
import { MARKETPLACE_GUIDE } from "@/lib/softener-prices";
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

/**
 * What a softener is up against in this place, in figures that change with the
 * local reading: the hardness a household takes in over a year, what one costs
 * fitted, and how many neighbours have asked. Sits above the quote panel on the
 * town and area pages, and carries one line for installers, who find these pages
 * when they search for their own trade and town.
 */
export function SoftenerLocalFacts({ place, area, hardness, softenerPrice, requests, approximate = false }: { place: string; area: string; hardness: number; softenerPrice: string; requests: number; approximate?: boolean }) {
  const rows = householdLoads(hardness);
  const four = rows.find((r) => r.people === 4) ?? rows[rows.length - 1];
  const { serviceYearly } = MARKETPLACE_GUIDE;
  return (
    <div className="wt-local">
      <p className="wt-sub" style={{ maxWidth: "62ch" }}>
        At {approximate ? "about " : ""}{Math.round(hardness)} mg/L, a family of four in {place} takes in about <strong>{four.kg} kg of dissolved chalk a year</strong> with its water. Only part of it
        settles as limescale, mostly where water is heated, but that is what furs up kettles, boilers and shower heads. A softener takes it out as the water
        enters the house.
      </p>
      <div className="wt-local-grid">
        <div className="wt-tablewrap">
          <table className="wt-table wt-table--light wt-nums" style={{ minWidth: 0 }}>
            <caption className="wt-sr">Hardness minerals a household in {place} takes in each year, by household size</caption>
            <thead><tr><th scope="col">Household</th><th scope="col" style={{ textAlign: "right" }}>Water a year</th><th scope="col" style={{ textAlign: "right" }}>Dissolved chalk a year</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.people}>
                  <td>{r.people} {r.people === 1 ? "person" : "people"}</td>
                  <td style={{ textAlign: "right" }}>{r.litres.toLocaleString("en-GB")} litres</td>
                  <td style={{ textAlign: "right" }}>{r.kg} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="wt-ledger wt-nums">
          <li><strong>Softener, supplied and fitted</strong><b>{softenerPrice}</b></li>
          <li><strong>Yearly service</strong><b>£{serviceYearly.low} to £{serviceYearly.high}</b></li>
          {requests > 0 ? (
            <li><strong>Quote requests from {area} postcodes<em>last {REQUEST_WINDOW_DAYS} days</em></strong><b>{requests}</b></li>
          ) : null}
        </ul>
      </div>
      <p className="wt-fine" style={{ marginTop: 20 }}>
        Chalk figures are {Math.round(hardness)} mg/L of calcium carbonate multiplied by 137 litres a person a day, {WATER_USE_SOURCE}. Prices are from the{" "}
        <Link href="/guides/water-softener-cost-uk" className="wt-link">softener cost guide</Link>, which gives the source for each.
      </p>
      <p className="wt-fine" style={{ marginTop: 10 }}>
        Fit softeners in {place}?{" "}
        {requests > 0
          ? `${requests} ${requests === 1 ? "homeowner" : "homeowners"} in ${area} postcodes asked us for quotes in the last ${REQUEST_WINDOW_DAYS} days.`
          : `We pass on quote requests from ${area} postcodes.`}{" "}
        <Link href="/partners" className="wt-link">Your first three are free</Link>.
      </p>
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
