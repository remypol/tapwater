import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import "./tank.css";
import { TankCanvas } from "./tank-canvas";
import { BubbleColumn } from "./bubble-column";
import { SoftenerButton, StickyAction } from "./tank-actions";
import { AffiliateLink } from "@/components/affiliate-link";
import { SoftenerLeadForm } from "@/components/softener-lead-form";
import { ReportLink, TankSignup } from "./keep-informed";
import { OurTaapOffer } from "./our-taap-offer";
import { CONTAMINANT_SLUG_MAP } from "@/lib/contaminant-slugs";
import { formatPriceRange, installedPriceRange } from "@/lib/softener-prices";

const SOFTENER_PRICE = formatPriceRange(installedPriceRange());
import { HARD_WATER_THRESHOLD } from "@/lib/filters";
import { SOFTENER_GUIDES, SOFTENER_THRESHOLD_MGL } from "@/lib/softener-guides";
import { pickRelatedGuides } from "@/lib/guides";
import { formatReading, formatSampleDate, hardnessBandLabel, type TankAction } from "@/lib/tank-plan";
import { isOverPartLLine } from "@/lib/part-l";
import { describeSupplierSplit } from "@/lib/suppliers";
import { getThamesZones } from "@/lib/thames-zones";
import { catchmentExplorerUrl, chemicalFails, describeRiverStatus, failingElements, waterBodyNoun, ECOLOGICAL_CLASSES } from "@/lib/river-status";
import { formatMicrograms, formatSampleMonth, humaniseSiteLabel } from "@/components/pfas-nearby";
import type { PostcodePageLoad } from "@/lib/postcode-page-load";

/**
 * The postcode page as a tank of the district's own water.
 *
 * Order follows what the visitor came for, then what we need them to do:
 * the verdict and the primary action share the first screen, the full "what to do"
 * block comes second, and the evidence (every result, hardness, river, PFAS,
 * neighbours, questions) follows for the people who want to check our working.
 *
 * Nothing on this page waits for JavaScript to become visible. The canvas and the
 * bubbles add movement to a page that already reads complete without them.
 */

const RIVER_PAINT: Record<string, string> = { Bad: "#ff5a4f", Poor: "#ff9b3d", Moderate: "#ffd23f", Good: "#6fdc8c", High: "#69b7ff" };
const HARD_MAX = 400;

function ProductAction({ action, district, lead }: { action: Extract<TankAction, { kind: "product" }>; district: string; lead: boolean }) {
  const p = action.product;
  const where = p.affiliateProgram === "amazon" ? "Amazon" : p.brand;
  return (
    <>
      <div className="wt-prod">
        {p.imageUrl ? (
          <div className="wt-prod-img">
            <Image src={p.imageUrl} alt={`${p.brand} ${p.model}`} width={112} height={112} />
          </div>
        ) : null}
        <div>
          <h3>{lead ? action.title : `${p.brand} ${p.model}`}</h3>
          <p className="wt-price wt-nums" style={{ marginTop: 8 }}>
            {p.priceGbp > 0 ? <>£{p.priceGbp.toLocaleString("en-GB")}<small>typical price</small></> : "Check today's price"}
          </p>
        </div>
      </div>
      <p>{action.reason}</p>
      <div className="wt-acts">
        <AffiliateLink
          href={p.affiliateUrl}
          pageType="postcode"
          postcodeArea={district}
          recommendationReason={p.matchedContaminants.length > 0 ? "flagged-contaminant" : "general-pick"}
          productCategory={p.category}
          productSlug={p.slug}
          placement={lead ? "tank-primary" : "tank-secondary"}
          campaign="postcode"
          className={`wt-btn ${lead ? "wt-btn--sun" : "wt-btn--ghost"}`}
        >
          Check price at {where}
          <ArrowUpRight aria-hidden="true" />
        </AffiliateLink>
      </div>
    </>
  );
}

function SoftenerAction({ action, district, lead, hardness }: { action: Extract<TankAction, { kind: "softener" }>; district: string; lead: boolean; hardness: number | null }) {
  return (
    <>
      {lead && hardness != null ? (
        <p className="wt-gauge wt-nums" aria-hidden="true">
          {Math.round(hardness)}
          <small>mg/L</small>
        </p>
      ) : null}
      <h3>{lead ? "Hard water: what helps" : "Cut the limescale"}</h3>
      <p>{action.reason}</p>
      {lead ? (
        <p>
          A fitted softener costs {SOFTENER_PRICE}. A filter kettle and a shower filter deal with the scale you notice most, for far less.
        </p>
      ) : null}
      <div className="wt-acts">
        <SoftenerButton district={district} label={action.title} paint={lead ? "sun" : "ink"} placement="action" />
      </div>
    </>
  );
}

export function PostcodeTank({ page }: { page: PostcodePageLoad }) {
  const { data, plan, hardness, river, pfasNearby, neighbours, highlights, faqs, city, nationalAverage, incidents } = page;
  const district = data.district;
  const supplierSplit = describeSupplierSplit(district);
  // No tap results for this district: what we hold is the river and groundwater layer.
  const riverOnly = data.dataSource === "ea-only";
  // Set for the few Thames districts whose zones were taken from their neighbours.
  const borrowedFrom = data.supplierId === "thames-water" ? getThamesZones(district)?.approx ?? null : null;
  // With no tap score the tank is drawn half full: its height means nothing here.
  const level = riverOnly ? 0.55 : Math.max(0.12, Math.min(0.92, data.safetyScore / 10));
  const avg = Math.max(0, Math.min(1, nationalAverage / 10));
  const hardValue = hardness?.value ?? null;
  const isHard = hardValue != null && hardValue >= HARD_WATER_THRESHOLD;
  const longHeadline = plan.headline[0].length > 18;
  const place = [district, data.areaName !== data.city ? data.areaName : null, data.city].filter(Boolean).join(", ");
  const primary = plan.primary;
  const usesProduct = [primary, ...plan.secondary].some((a) => a?.kind === "product");
  const flaggedNames = data.readings.filter((r) => r.status !== "pass").map((r) => r.name);
  const pfasAnywhere = (data.pfasDetected && data.pfasLevel != null) || pfasNearby !== null;
  const guides = pickRelatedGuides({
    pfasDetected: pfasAnywhere,
    hasLeadFlagged: data.readings.some((r) => /lead/i.test(r.name) && r.status !== "pass"),
    isHardWater: (hardValue ?? 0) >= HARD_WATER_THRESHOLD,
    hasContaminantsFlagged: data.contaminantsFlagged > 0,
  });
  const scoredNeighbours = new Set(neighbours.map((n) => n.district));
  const otherNearby = data.nearbyPostcodes.filter((pc) => !scoredNeighbours.has(pc));
  // Only worth a second table when the tap results above are not these same samples.
  const riverReadings = data.drinkingWaterReadings.length > 0 ? data.environmentalReadings : [];

  return (
    <div className="wt">
      <div className="wt-top">
        <div className="wt-inner">
          <nav aria-label="Breadcrumb" className="wt-crumbs">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            {city.hasPage ? <Link href={`/city/${city.slug}`}>{city.name}</Link> : <span>{city.name}</span>}
            <span aria-hidden="true">/</span>
            <span aria-current="page">{district}</span>
          </nav>
        </div>
      </div>

      {incidents.length > 0 ? (
        <div className="wt-alert" role="status">
          <div className="wt-inner">
            Live from {data.supplier}: {incidents[0].title}.{" "}
            <Link href={`/supplier/${data.supplierId}`}>See current incidents</Link>
          </div>
        </div>
      ) : null}

      {/* ── 1. The tank ── */}
      <section className="wt-tank" id="wt-tank" style={{ ["--wt-surface" as string]: `${(1 - level) * 100}%` }}>
        <TankCanvas level={level} hardness={hardValue} />
        {riverOnly ? null : (
          <span className={`wt-tick${avg > level ? " wt-tick--air" : ""}`} style={{ top: `${(1 - avg) * 100}%` }}>
            England and Wales average {nationalAverage.toFixed(1)}
          </span>
        )}
        <div className="wt-inner">
          <div>
            {/* The place line is part of the h1: the district and town are what people
                search for, and the old h1 ("Your water in OX1") carried them. */}
            <h1 className={longHeadline ? "wt-long" : undefined}>
              <span className="wt-where">{`Tap water in ${place}`}</span>
              <span>{plan.headline[0]}</span>
              {plan.headline[1] ? <span className="wt-hardline">{plan.headline[1]}</span> : null}
            </h1>
            <p className="wt-basis wt-nums">Supplied by {data.supplier}. {plan.basis}</p>
            <div className="wt-heroacts">
              {primary?.kind === "softener" ? (
                <SoftenerButton district={district} label={primary.title} paint="sun" placement="hero" />
              ) : primary ? (
                <a href="#wt-fix" className="wt-btn wt-btn--sun">
                  See the filter we recommend
                  <ArrowDown aria-hidden="true" />
                </a>
              ) : null}
              <a href="#wt-glass" className="wt-link">{riverOnly ? "See what was measured nearby" : "See everything that was tested"}</a>
            </div>
          </div>
          {riverOnly ? (
            <div className="wt-level wt-nums">
              {hardValue != null ? (
                <>
                  <p className="wt-big">{Math.round(hardValue)}<small> mg/L</small></p>
                  <p>
                    Hardness{hardness?.estimated ? `, typical for the ${hardness.estimatedFrom ?? "postcode"} area` : `, ${data.supplier}'s own figure`}. There is no tap score: no tap
                    results are published here. The specks are the minerals that make water hard.
                  </p>
                </>
              ) : (
                <p>No tap score: {data.supplier} publishes no tap-water results for {district}.</p>
              )}
            </div>
          ) : (
            <div className="wt-level wt-nums">
              <p className="wt-big">{data.safetyScore.toFixed(1)}<small> / 10</small></p>
              <p>
                The tank is as full as the score.
                {hardValue != null ? " The specks are the minerals that make water hard." : ""}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── 2. What to do ── */}
      {primary ? (
        <section className="wt-do" id="wt-fix" aria-labelledby="wt-fix-h">
          <div className="wt-inner">
            <h2 className="wt-h2" id="wt-fix-h">What to do about it</h2>
            <div className="wt-do-grid">
              <div className="wt-primary">
                {primary.kind === "softener" ? (
                  <SoftenerAction action={primary} district={district} lead hardness={hardValue} />
                ) : (
                  <ProductAction action={primary} district={district} lead />
                )}
              </div>
              <div className="wt-side">
                {plan.secondary.map((a) => (
                  <div className="wt-second" key={a.kind === "product" ? a.product.slug : "softener"}>
                    {a.kind === "softener" ? (
                      <SoftenerAction action={a} district={district} lead={false} hardness={hardValue} />
                    ) : (
                      <ProductAction action={a} district={district} lead={false} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            {usesProduct ? (
              <p className="wt-fine" style={{ marginTop: 24 }}>
                We earn a commission if you buy through these links, at no extra cost to you. It never changes which product we put first.{" "}
                <Link href="/affiliate-disclosure">How we make money</Link>
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ── 2b. Keep in touch: alerts, and the paid report we are testing demand for ── */}
      <section className="wt-keep" aria-labelledby="wt-keep-h">
        <div className="wt-inner">
          <div>
            <h2 id="wt-keep-h">Hear about it if {district}&rsquo;s water changes</h2>
            <p>We check for supply incidents every fifteen minutes. If one affects {district}, you get an email the same day. You also get five short emails about your water over the first month.</p>
            <TankSignup district={district} purpose="alerts" />
          </div>
          <div className="wt-keep-report">
            <h2>Want this as a document?</h2>
            <p>Every result, the limits, hardness and what to do, as a PDF to keep with the house papers or send to a buyer or landlord. £19.99.</p>
            <ReportLink district={district} placement="postcode-band">See the full report for {district}</ReportLink>
          </div>
        </div>
      </section>

      {!isHard ? <OurTaapOffer district={district} /> : null}

      {/* ── 3. What's in the glass ── */}
      <section className="wt-bubbles" id="wt-glass" aria-labelledby="wt-glass-h">
        <div className="wt-inner">
          {riverOnly ? (
            <>
              <h2 className="wt-h2" id="wt-glass-h">What&apos;s in the rivers and groundwater around {district}</h2>
              <p className="wt-sub">
                {data.supplier} publishes no tap-water results for {district}. These are Environment Agency samples of untreated river and
                groundwater nearby. Drinking-water limits apply to treated tap water, not to these samples; the dashed line shows where that limit
                would sit, for scale.
              </p>
            </>
          ) : (
            <>
              <h2 className="wt-h2" id="wt-glass-h">What&apos;s in a glass of {district} water</h2>
              <p className="wt-sub">
                Every bubble is a substance the lab measured. The higher it floats, the closer it came to its legal limit, the dashed line at the top.
              </p>
            </>
          )}
          <BubbleColumn bubbles={plan.bubbles} untreated={riverOnly} />
          {plan.others.length > 0 ? (
            <ul className="wt-chips wt-nums">
              {plan.others.map((o) => (
                <li key={o.name}>
                  {o.name} <b className={o.good ? undefined : "wt-badchip"}>{o.text}</b>
                </li>
              ))}
            </ul>
          ) : null}
          <details className="wt-all">
            <summary>All {data.readings.length} results as a table</summary>
            <div className="wt-tablewrap">
              <table className="wt-table wt-nums">
                <thead>
                  <tr><th scope="col">Substance</th><th scope="col">Result</th><th scope="col">{riverOnly ? "Tap-water limit" : "Legal limit"}</th><th scope="col">Share of limit</th></tr>
                </thead>
                <tbody>
                  {data.readings.map((r) => {
                    const share = r.ukLimit != null && r.ukLimit > 0 ? r.value / r.ukLimit : null;
                    return (
                      <tr key={r.name}>
                        <td>{CONTAMINANT_SLUG_MAP[r.name] ? <Link className="wt-link" href={`/contaminant/${CONTAMINANT_SLUG_MAP[r.name]}`}>{r.name}</Link> : r.name}</td>
                        <td>{formatReading(r.value)} {r.unit}</td>
                        <td>{r.ukLimit == null ? "No legal limit" : r.ukLimit === 0 ? "Must be zero" : `${formatReading(r.ukLimit)} ${r.unit}`}</td>
                        <td>
                          {share == null ? (
                            r.ukLimit === 0 ? (r.value === 0 ? "None found" : "Found") : "–"
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div className="wt-meter" style={{ flex: 1 }}>
                                <i className={share > 1 ? "wt-over" : share >= 0.75 ? "wt-hot" : undefined} style={{ width: `${Math.min(share, 1) * 100}%` }} />
                              </div>
                              <span style={{ minWidth: "3.2em", textAlign: "right" }}>{share < 0.01 ? "<1" : Math.round(share * 100)}%</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </section>

      {/* ── 4. Hardness ── */}
      {hardValue != null ? (
        <section className={`wt-chalk${isHard ? "" : " wt-chalk--soft"}`} id="wt-hardness" aria-labelledby="wt-hard-h">
          <div className="wt-inner">
            <div className="wt-chalk-grid">
              <p className="wt-n wt-nums">
                {Math.round(hardValue)}
                <small>
                  mg of limescale minerals in every litre
                  {hardness?.estimated ? `, typical for the ${hardness.estimatedFrom ?? "wider"} area. ${district} has no reading of its own.` : ""}
                </small>
              </p>
              <div>
                <h2 className="wt-h2" id="wt-hard-h">
                  {isHard ? "This is the water that furs up kettles" : hardValue < 120 ? "Soft water. Kind to kettles, boilers and skin" : "Middling hardness. Some scale, slowly"}
                </h2>
                <p>
                  {isHard
                    ? `${hardnessBandLabel(hardValue)} on the UK scale. It is fine to drink. It is hard on boilers, showers, skin and anything that heats water, and a jug or tap filter will not change that.`
                    : hardValue < 120
                      ? "You will not need a softener here, and you will use less soap and detergent than most of England."
                      : "Below the point where a softener pays for itself. Descaling the kettle now and then is all most homes need."}
                </p>
                <div className="wt-crust" role="img" aria-label={`${Math.round(hardValue)} mg/L on a scale from soft to ${HARD_MAX}`}>
                  <u style={{ left: `${(SOFTENER_THRESHOLD_MGL / HARD_MAX) * 100}%` }}>a softener pays off from {SOFTENER_THRESHOLD_MGL}</u>
                  <i style={{ left: `${Math.min(hardValue / HARD_MAX, 1) * 100}%` }} />
                </div>
                <div className="wt-ends"><span>Soft</span><span>{HARD_MAX} mg/L</span></div>
                {isOverPartLLine(hardValue) ? (
                  <p className="wt-fine" style={{ marginTop: 16 }}>
                    Over 200 mg/L, the building regulations guidance for England counts this as a hard water area: a new combination boiler or water
                    heater should have limescale protection.{" "}
                    <Link className="wt-link" href="/guides/hard-water-boiler-regulations">The 200 ppm rule</Link>
                  </p>
                ) : null}
                {page.hardnessLinks.town || page.hardnessLinks.area ? (
                  <p className="wt-hardlinks">
                    {page.hardnessLinks.town ? (
                      <Link className="wt-link" href={`/hardness/${page.hardnessLinks.town.slug}`}>Water hardness in {page.hardnessLinks.town.name}</Link>
                    ) : null}
                    {page.hardnessLinks.area ? (
                      <Link className="wt-link" href={`/hardness/${page.hardnessLinks.area.code.toLowerCase()}`}>
                        Hardness across {page.hardnessLinks.area.name} ({page.hardnessLinks.area.code})
                      </Link>
                    ) : null}
                  </p>
                ) : null}
              </div>
            </div>
            {isHard ? (
              <div className="wt-form">
                <SoftenerLeadForm
                  postcode={district}
                  hardnessValue={hardValue}
                  hardnessLabel={hardness?.label ?? hardnessBandLabel(hardValue).toLowerCase()}
                  source="postcode_page"
                />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ── 5. Outside the tap ── */}
      {river || pfasNearby ? (
        <section className="wt-river" aria-label={`Rivers and groundwater around ${district}`}>
          <div className="wt-inner wt-river-grid">
            {river ? (
              <div id="river-health">
                <span className="wt-tag">Outside your tap</span>
                <h2>
                  Your {waterBodyNoun(river.river.type)} is the {river.river.name}
                  {river.river.ecologicalClass ? `, rated ${river.river.ecologicalClass.toLowerCase()}` : ""}
                </h2>
                <ol className="wt-steps" aria-hidden="true">
                  {[...ECOLOGICAL_CLASSES].reverse().map((c) => (
                    <li key={c} className={c === river.river.ecologicalClass ? "wt-on" : undefined}>
                      <i style={{ background: RIVER_PAINT[c] }} />
                      {c}
                    </li>
                  ))}
                </ol>
                <p>{describeRiverStatus(river.river)}</p>
                <p style={{ fontSize: "0.9rem" }}>
                  {failingElements(river.river).length === 0 && !chemicalFails(river.river) ? "" : "None of this is a test of your tap water. "}
                  <a className="wt-link" href={catchmentExplorerUrl(river.river.waterBodyId)} target="_blank" rel="noopener noreferrer">Environment Agency record</a>
                  {" · "}
                  <Link className="wt-link" href="/rivers">River health across England</Link>
                </p>
              </div>
            ) : null}
            {pfasNearby ? (
              <div id="pfas-nearby">
                <span className="wt-tag">Within {pfasNearby.radiusKm} km</span>
                <p className="wt-bign wt-nums">{pfasNearby.detectionCount.toLocaleString("en-GB")}</p>
                <h2 style={{ fontSize: "1.5rem", marginTop: 8 }}>forever-chemical detections in nearby rivers and groundwater</h2>
                <p className="wt-nums">
                  At {pfasNearby.samplingPointCount} {pfasNearby.samplingPointCount === 1 ? "site" : "sites"}. The highest was {pfasNearby.highest.compound} at{" "}
                  {formatMicrograms(pfasNearby.highest.value)} µg/L, at {humaniseSiteLabel(pfasNearby.highest.samplingPointLabel)},{" "}
                  {pfasNearby.highest.distanceKm < 1 ? "under 1 km" : `${pfasNearby.highest.distanceKm.toFixed(1)} km`} away, in {formatSampleMonth(pfasNearby.highest.date)}.
                  These are river and borehole samples, not tests of your tap water.
                </p>
                <p style={{ fontSize: "0.9rem" }}>
                  {pfasNearby.nearestCitySlug && pfasNearby.nearestCityName ? (
                    <><Link className="wt-link" href={`/pfas/${pfasNearby.nearestCitySlug}`}>Every PFAS sample around {pfasNearby.nearestCityName}</Link>{" · "}</>
                  ) : null}
                  <Link className="wt-link" href="/guides/best-water-filter-pfas">Which filters remove PFAS</Link>
                  {" · "}
                  <Link className="wt-link" href="/guides/pfas-uk-explained">PFAS explained</Link>
                </p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ── 6. The district in words ── */}
      <section className="wt-story" aria-labelledby="wt-story-h">
        <div className="wt-inner wt-story-grid">
          <div>
            <h2 className="wt-h2" id="wt-story-h">{district} in short</h2>
            <p className="wt-lead wt-nums">
              Tap water in {district} ({data.areaName === data.city ? data.city : `${data.areaName}, ${data.city}`}) is supplied by{" "}
              {data.supplierId && data.supplierId !== "unknown" ? <Link href={`/supplier/${data.supplierId}`}>{data.supplier}</Link> : data.supplier}
              {supplierSplit ? ` (${supplierSplit})` : ""}
              {data.supplyZone ? ` in the ${data.supplyZone} zone` : ""}
              {riverOnly ? (
                <>
                  . {data.supplier} publishes no tap-water test results for this area, so there is no tap score for {district}. The{" "}
                  {data.contaminantsTested} substances on this page were measured in rivers and groundwater nearby, before treatment, and say
                  nothing certain about your tap. Every water company must meet the same legal standards at the tap.
                  {hardness && !hardness.estimated ? ` The hardness figure, ${Math.round(hardness.value)} mg/L, is ${data.supplier}'s own for this district.` : ""}{" "}
                </>
              ) : (
                <>
                  {" "}and scores {data.safetyScore.toFixed(1)} out of 10, against an England and Wales average of {nationalAverage.toFixed(1)}.{" "}
                  {data.contaminantsFlagged > 0
                    ? `${data.contaminantsFlagged} of ${data.contaminantsTested} tested substances ${data.contaminantsFlagged === 1 ? "was" : "were"} close to or over a limit.`
                    : `None of the ${data.contaminantsTested} tested substances came close to a limit.`}{" "}
                </>
              )}
              The latest sample is from {formatSampleDate(data.lastSampleDate)}.
              {borrowedFrom ? ` Thames Water's postcode checker cannot place ${district} in a supply zone, so these results are from the zones around it (${borrowedFrom.join(", ")}). Read them as typical for the area.` : ""}
            </p>
          </div>
          {highlights.length > 0 ? (
            <div id="what-stands-out">
              <ul className="wt-facts">
                {highlights.map((h) => (
                  <li key={h.kind}>
                    <strong>{h.lead}</strong>
                    <span>
                      {h.detail}
                      {h.link ? <> {h.link.href.startsWith("#") ? <a href={h.link.href}>{h.link.label}</a> : <Link href={h.link.href}>{h.link.label}</Link>}</> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      {/* ── 7. Next door ── */}
      {neighbours.length > 0 ? (
        <section className="wt-next" aria-labelledby="wt-next-h">
          <div className="wt-inner">
            <h2 className="wt-h2" id="wt-next-h">Next door</h2>
            <div className="wt-cards wt-nums">
              {neighbours.map((n) => (
                <Link key={n.district} href={`/postcode/${n.district}`} className="wt-card">
                  <i style={{ height: `${n.score == null ? 55 : Math.max(12, Math.min(92, n.score * 10))}%` }} />
                  <b>{n.district}</b>
                  <span>{n.score == null ? "No tap results" : `${n.score.toFixed(1)} out of 10`}{n.hardness != null ? ` · ${Math.round(n.hardness)} mg/L` : ""}</span>
                </Link>
              ))}
            </div>
            {otherNearby.length > 0 ? (
              <p className="wt-more">
                Also nearby:{" "}
                {otherNearby.map((pc, i) => (
                  <span key={pc}>{i > 0 ? ", " : ""}<Link href={`/postcode/${pc}`}>{pc}</Link></span>
                ))}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ── 8. Questions ── */}
      {faqs.length > 0 ? (
        <section className="wt-faq" aria-labelledby="wt-faq-h">
          <div className="wt-inner">
            <h2 className="wt-h2" id="wt-faq-h">Questions about {district} water</h2>
            {faqs.map((f, i) => (
              <details key={f.question} open={i === 0}>
                <summary>{f.question}</summary>
                <p>{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── 9. Keep reading: every internal link the old page carried ── */}
      <section className="wt-read" aria-labelledby="wt-read-h">
        <div className="wt-inner">
          <h2 className="wt-h2" id="wt-read-h">Keep reading</h2>
          <ul className="wt-guides">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link href={`/guides/${g.slug}/`}>
                  <strong>{g.title}</strong>
                  <span>{g.description}</span>
                </Link>
              </li>
            ))}
            {isHard
              ? SOFTENER_GUIDES.map((g) => (
                  <li key={g.slug}>
                    <Link href={`/guides/${g.slug}/`}>
                      <strong>{g.label}</strong>
                      <span>{g.blurb}</span>
                    </Link>
                  </li>
                ))
              : null}
          </ul>
          <p className="wt-pills">
            {pfasAnywhere ? <Link href="/contaminant/pfas">PFAS explained</Link> : null}
            {flaggedNames.some((n) => /lead/i.test(n)) ? <Link href="/contaminant/lead">Lead in water</Link> : null}
            {flaggedNames.some((n) => /nitrate|nitrite/i.test(n)) ? <Link href="/contaminant/nitrate">Nitrate levels</Link> : null}
            {flaggedNames.some((n) => /chlorine/i.test(n)) ? <Link href="/contaminant/chlorine">Chlorine</Link> : null}
            {/* The buying guide that answers the problem this district has */}
            {isHard ? <Link href="/guides/best-boiling-water-tap-uk">Boiling water taps and hard water</Link> : null}
            {flaggedNames.some((n) => /lead/i.test(n)) ? <Link href="/guides/best-under-sink-water-filter-uk">Under sink water filters</Link> : null}
            {flaggedNames.some((n) => /chlorine/i.test(n)) ? <Link href="/guides/best-whole-house-water-filter-uk">Whole house water filters</Link> : null}
            <Link href="/guides/how-to-test-your-water">How to test your water</Link>
            <Link href="/guides/best-water-filters-uk">Best water filters</Link>
            <Link href="/guides/best-shower-filter-uk">Filter shower heads</Link>
            <Link href="/filters/water-testing-kits">Water testing kits</Link>
            {city.hasPage ? <Link href={`/city/${city.slug}`}>All of {city.name}</Link> : null}
            <Link href="/compare">UK water rankings</Link>
            <Link href="/hardness">Water hardness checker</Link>
            <Link href="/guides/water-hardness-map">Water hardness map</Link>
          </p>
          {riverReadings.length > 0 ? (
            <details className="wt-env">
              <summary>River and groundwater readings near {district}</summary>
              <p>
                Environment Agency samples from rivers, groundwater and reservoirs nearby. Not your tap water. For scale they are shown against drinking water
                limits; rivers are judged against much stricter environmental standards, and on those every river in England fails for chemicals.
              </p>
              <div className="wt-tablewrap">
                <table className="wt-table wt-table--light wt-nums">
                  <thead><tr><th scope="col">Substance</th><th scope="col">Reading</th><th scope="col">Drinking water limit</th></tr></thead>
                  <tbody>
                    {riverReadings.map((r) => (
                      <tr key={r.name}>
                        <td>{CONTAMINANT_SLUG_MAP[r.name] ? <Link href={`/contaminant/${CONTAMINANT_SLUG_MAP[r.name]}`}>{r.name}</Link> : r.name}</td>
                        <td>{formatReading(r.value)} {r.unit}</td>
                        <td>{r.ukLimit == null ? "None" : `${formatReading(r.ukLimit)} ${r.unit}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ) : null}
        </div>
      </section>


      <footer className="wt-foot">
        <div className="wt-inner">
          <p>
            Source:{" "}
            {data.dataSource === "stream" || data.dataSource === "mixed"
              ? `${data.supplier} test results, published through the Stream Water Data Portal`
              : "the Environment Agency Water Quality Archive"}
            ; rivers and PFAS from the Environment Agency. Page updated <time dateTime={data.lastUpdated}>{formatSampleDate(data.lastUpdated)}</time>.{" "}
            <Link href="/about/methodology">How we score</Link> · <Link href="/about/data-sources">Where the data comes from</Link>
          </p>
        </div>
      </footer>

      {primary ? (
        <StickyAction
          title={primary.kind === "softener" ? `${hardValue != null ? Math.round(hardValue) : ""} mg/L: ${hardnessBandLabel(hardValue ?? 0).toLowerCase()} water` : primary.title}
          note={primary.kind === "softener" ? "What helps with the limescale" : "Our pick for this water"}
        >
          {primary.kind === "softener" ? (
            <SoftenerButton district={district} label="What helps" paint="sun" placement="sticky" />
          ) : (
            <a href="#wt-fix" className="wt-btn wt-btn--sun">See it</a>
          )}
        </StickyAction>
      ) : null}
    </div>
  );
}

/**
 * A district we hold no usable results for. These pages are noindex; their job is to
 * say so plainly and send the visitor somewhere that does have data.
 */
export function PostcodeTankEmpty({ page }: { page: PostcodePageLoad }) {
  const { data, city } = page;
  const district = data.district;
  // Many districts with no test results still have a hardness reading of their own.
  // An area estimate is not shown here: the page would then say nothing measured.
  const hardKnown = page.hardness != null && !page.hardness.estimated;
  const hardValue = hardKnown ? (page.hardness?.value ?? null) : null;
  const isHard = hardValue != null && hardValue >= HARD_WATER_THRESHOLD;
  return (
    <div className="wt">
      <div className="wt-top">
        <div className="wt-inner">
          <nav aria-label="Breadcrumb" className="wt-crumbs">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            {city.hasPage ? <Link href={`/city/${city.slug}`}>{city.name}</Link> : <span>{city.name}</span>}
            <span aria-hidden="true">/</span>
            <span aria-current="page">{district}</span>
          </nav>
        </div>
      </div>
      <section className="wt-tank" style={{ ["--wt-surface" as string]: "70%" }}>
        <div className="wt-inner" style={{ color: "var(--wt-deep)", alignItems: "start" }}>
          <div>
            <h1 className="wt-long">
              <span className="wt-where">{`Tap water in ${district}, ${data.areaName}`}</span>
              <span>Not enough test results yet.</span>
            </h1>
            <p className="wt-basis">
              {hardKnown
                ? `We do not hold enough tap test results for ${district} to score its water, but we do know how hard it is. The gap is in the published data, not a sign that the water is unsafe.`
                : `We do not hold enough results for ${district} to say anything useful about it. That is a gap in the published data, not a sign that the water is unsafe.`}
              {data.supplierId && data.supplierId !== "unknown" ? <> Your supplier is <Link className="wt-link" href={`/supplier/${data.supplierId}`}>{data.supplier}</Link>.</> : null}
            </p>
          </div>
        </div>
      </section>
      {hardKnown && hardValue != null ? (
        <section className={`wt-chalk${isHard ? "" : " wt-chalk--soft"}`} id="wt-hardness" aria-labelledby="wt-hard-h">
          <div className="wt-inner">
            <div className="wt-chalk-grid">
              <p className="wt-n wt-nums">
                {Math.round(hardValue)}
                <small>mg of limescale minerals in every litre</small>
              </p>
              <div>
                <h2 className="wt-h2" id="wt-hard-h">
                  {isHard ? `${district} has hard water` : hardValue < 120 ? `${district} has soft water` : `${district} water is middling in hardness`}
                </h2>
                <p>
                  {isHard
                    ? `${hardnessBandLabel(hardValue)} on the UK scale. It is fine to drink. It is hard on boilers, showers and anything that heats water, and only a softener removes it.`
                    : hardValue < 120
                      ? "You will not need a softener here, and you will use less soap and detergent than most of England."
                      : "Below the point where a softener pays for itself. Descaling the kettle now and then is all most homes need."}
                </p>
                <div className="wt-crust" role="img" aria-label={`${Math.round(hardValue)} mg/L on a scale from soft to ${HARD_MAX}`}>
                  <u style={{ left: `${(SOFTENER_THRESHOLD_MGL / HARD_MAX) * 100}%` }}>a softener pays off from {SOFTENER_THRESHOLD_MGL}</u>
                  <i style={{ left: `${Math.min(hardValue / HARD_MAX, 1) * 100}%` }} />
                </div>
                <div className="wt-ends"><span>Soft</span><span>{HARD_MAX} mg/L</span></div>
                {page.hardnessLinks.town || page.hardnessLinks.area ? (
                  <p className="wt-hardlinks">
                    {page.hardnessLinks.town ? (
                      <Link className="wt-link" href={`/hardness/${page.hardnessLinks.town.slug}`}>Water hardness in {page.hardnessLinks.town.name}</Link>
                    ) : null}
                    {page.hardnessLinks.area ? (
                      <Link className="wt-link" href={`/hardness/${page.hardnessLinks.area.code.toLowerCase()}`}>
                        Hardness across {page.hardnessLinks.area.name} ({page.hardnessLinks.area.code})
                      </Link>
                    ) : null}
                  </p>
                ) : null}
              </div>
            </div>
            {isHard ? (
              <div className="wt-form">
                <SoftenerLeadForm
                  postcode={district}
                  hardnessValue={hardValue}
                  hardnessLabel={hardnessBandLabel(hardValue).toLowerCase()}
                  source="postcode_page"
                />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
      {data.nearbyPostcodes.length > 0 ? (
        <section className="wt-next">
          <div className="wt-inner">
            <h2 className="wt-h2">Districts nearby</h2>
            <p className="wt-pills">
              {data.nearbyPostcodes.map((pc) => <Link key={pc} href={`/postcode/${pc}`}>{pc}</Link>)}
              {city.hasPage ? <Link href={`/city/${city.slug}`}>All of {city.name}</Link> : null}
              <Link href="/postcode">Every postcode district</Link>
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
