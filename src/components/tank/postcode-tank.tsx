import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import "./tank.css";
import { TankCanvas } from "./tank-canvas";
import { BubbleColumn } from "./bubble-column";
import { SoftenerButton, StickyAction } from "./tank-actions";
import { AffiliateLink } from "@/components/affiliate-link";
import { SoftenerLeadForm } from "@/components/softener-lead-form";
import { EmailCapture } from "@/components/email-capture";
import { CONTAMINANT_SLUG_MAP } from "@/lib/contaminant-slugs";
import { softenerPartnerEnabled, SOFTENER_PARTNER_NAME } from "@/lib/softener-partner";
import { HARD_WATER_THRESHOLD } from "@/lib/filters";
import { SOFTENER_GUIDES, SOFTENER_THRESHOLD_MGL } from "@/lib/softener-guides";
import { pickRelatedGuides } from "@/lib/guides";
import { formatReading, formatSampleDate, hardnessBandLabel, type TankAction } from "@/lib/tank-plan";
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
      <h3>{lead ? "Hard water: compare softener quotes" : "Stop the limescale"}</h3>
      <p>{action.reason}</p>
      {lead ? (
        <p>
          It pays for itself in most homes at this hardness, through a boiler that stays efficient and appliances that last.
        </p>
      ) : null}
      {lead && softenerPartnerEnabled ? (
        <ul className="wt-assure">
          <li>Free quotes</li>
          <li>Installers who cover {district}</li>
          <li>No obligation</li>
        </ul>
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
  const level = Math.max(0.12, Math.min(0.92, data.safetyScore / 10));
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
        <span className={`wt-tick${avg > level ? " wt-tick--air" : ""}`} style={{ top: `${(1 - avg) * 100}%` }}>
          England and Wales average {nationalAverage.toFixed(1)}
        </span>
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
              <a href="#wt-glass" className="wt-link">See everything that was tested</a>
            </div>
          </div>
          <div className="wt-level wt-nums">
            <p className="wt-big">{data.safetyScore.toFixed(1)}<small> / 10</small></p>
            <p>
              The tank is as full as the score.
              {hardValue != null ? " The specks are the minerals that make water hard." : ""}
            </p>
          </div>
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

      {/* ── 3. What's in the glass ── */}
      <section className="wt-bubbles" id="wt-glass" aria-labelledby="wt-glass-h">
        <div className="wt-inner">
          <h2 className="wt-h2" id="wt-glass-h">What&apos;s in a glass of {district} water</h2>
          <p className="wt-sub">
            Every substance the lab measured, on one scale: how much of its legal limit the result used. The line on the right is the limit.
          </p>
          <BubbleColumn bubbles={plan.bubbles} />
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
                  <tr><th scope="col">Substance</th><th scope="col">Result</th><th scope="col">Legal limit</th><th scope="col">Share of limit</th></tr>
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
              </div>
            </div>
            {isHard ? (
              <div className="wt-form">
                <SoftenerLeadForm
                  postcode={district}
                  hardnessValue={hardValue}
                  hardnessLabel={hardness?.label ?? hardnessBandLabel(hardValue).toLowerCase()}
                  source="postcode_page"
                  heading={`Softener quotes for ${district}`}
                  intro={
                    softenerPartnerEnabled
                      ? `Tell ${SOFTENER_PARTNER_NAME || "our quote partner"} about your home and get quotes from installers who cover ${district}. It takes about a minute.`
                      : `Leave your details and we will email you when we can match you with installers who cover ${district}. No obligation.`
                  }
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
              {data.supplyZone ? ` in the ${data.supplyZone} zone` : ""} and scores {data.safetyScore.toFixed(1)} out of 10, against an England and Wales average of {nationalAverage.toFixed(1)}.{" "}
              {data.contaminantsFlagged > 0
                ? `${data.contaminantsFlagged} of ${data.contaminantsTested} tested substances ${data.contaminantsFlagged === 1 ? "was" : "were"} close to or over a limit.`
                : `None of the ${data.contaminantsTested} tested substances came close to a limit.`}{" "}
              The latest sample is from {formatSampleDate(data.lastSampleDate)}.
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
                  <i style={{ height: `${Math.max(12, Math.min(92, n.score * 10))}%` }} />
                  <b>{n.district}</b>
                  <span>{n.score.toFixed(1)} out of 10{n.hardness != null ? ` · ${Math.round(n.hardness)} mg/L` : ""}</span>
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

      <section className="wt-next" style={{ paddingBlock: "56px" }}>
        <div className="wt-inner">
          <EmailCapture postcode={district} />
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
          note={primary.kind === "softener" ? "Compare softener quotes" : "Our pick for this water"}
        >
          {primary.kind === "softener" ? (
            <SoftenerButton district={district} label="Get quotes" paint="sun" placement="sticky" />
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
              We do not hold enough results for {district} to say anything useful about it. That is a gap in the published data, not a sign that the water is unsafe.
              {data.supplierId && data.supplierId !== "unknown" ? <> Your supplier is <Link className="wt-link" href={`/supplier/${data.supplierId}`}>{data.supplier}</Link>.</> : null}
            </p>
          </div>
        </div>
      </section>
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
