import Link from "next/link";
import {
  ECOLOGICAL_CLASSES,
  catchmentExplorerUrl,
  chemicalFails,
  describeRiverStatus,
  waterBodyNoun,
  type EcologicalClass,
  type RiverStatusSummary,
} from "@/lib/river-status";
import type { AreaRivers, DistrictRiver } from "@/lib/river-status-data";

/**
 * How the Environment Agency rates the river a postcode district drains into.
 *
 * The colours are the ones the Water Framework Directive assigns to each class
 * (blue, green, yellow, orange, red), the same ones on the agency's own maps, so
 * the gauge reads the same here as it does in the source.
 *
 * This is river health, never tap water, and every block says so.
 */

export const CLASS_COLOUR: Record<EcologicalClass, string> = {
  High: "#2b7bba",
  Good: "#3f9b4b",
  Moderate: "#dcae0a",
  Poor: "#e07b1a",
  Bad: "#cf2e2e",
};

// Worst on the left, so the eye travels towards better, like a fuel gauge.
const GAUGE_ORDER: EcologicalClass[] = [...ECOLOGICAL_CLASSES].reverse();

/**
 * Five steps from Bad to High with this river's step filled. When `england` is given,
 * a thin bar underneath shows how England's rivers split across the same five steps.
 */
export function RiverGauge({
  value,
  england,
}: {
  value: EcologicalClass | null;
  england?: RiverStatusSummary | null;
}) {
  return (
    <div>
      <ol
        className="grid grid-cols-5 gap-[3px]"
        aria-label={value ? `Ecological health: ${value}, on a scale from Bad to High` : "Ecological health: not rated"}
      >
        {GAUGE_ORDER.map((c) => {
          const active = c === value;
          return (
            <li key={c} aria-current={active ? "true" : undefined}>
              <div
                className="h-3 rounded-[2px]"
                style={{
                  background: CLASS_COLOUR[c],
                  opacity: active ? 1 : 0.18,
                }}
              />
              <p
                className={`mt-1.5 text-xs sm:text-sm ${active ? "text-ink font-semibold" : "text-faint"}`}
              >
                {c}
              </p>
            </li>
          );
        })}
      </ol>

      {england && england.total > 0 && (
        <div className="mt-4">
          <div className="flex h-1.5 overflow-hidden rounded-[2px]" aria-hidden="true">
            {GAUGE_ORDER.map((c) => (
              <div
                key={c}
                style={{
                  width: `${(england.byEcologicalClass[c] / england.total) * 100}%`,
                  background: CLASS_COLOUR[c],
                }}
              />
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted">
            All of England: {england.goodOrBetterPct}% of rivers, estuaries and coastal waters rate good or
            high.
          </p>
        </div>
      )}
    </div>
  );
}

function ClassDot({ value }: { value: string | null }) {
  const colour = value && value in CLASS_COLOUR ? CLASS_COLOUR[value as EcologicalClass] : "var(--color-faint)";
  return <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colour }} aria-hidden="true" />;
}

export function RiverStatusPanel({
  district,
  data,
  england,
}: {
  district: string;
  data: DistrictRiver | null;
  england?: RiverStatusSummary | null;
}) {
  if (!data) return null;
  const { river, matchType, distanceKm } = data;
  const noun = waterBodyNoun(river.type);
  const where =
    matchType === "within"
      ? `Rain that falls on ${district} drains into this stretch of river.`
      : `The nearest classified ${noun} to ${district}${distanceKm != null && distanceKm >= 0.5 ? `, about ${distanceKm} km away` : ""}.`;

  return (
    <section id="river-health" className="mt-10 scroll-mt-20" aria-labelledby="river-health-heading">
      <h2 id="river-health-heading" className="font-display text-2xl text-ink italic">
        Your local {noun}: {river.name}
      </h2>
      <p className="text-sm text-muted mt-1 max-w-2xl leading-relaxed">
        {where} This is the Environment Agency&apos;s own rating of the {noun}&apos;s health. It is not a test of
        your tap water, which is treated before it reaches you.
      </p>

      <div className="mt-5 border-t border-rule-strong pt-5 grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
        <div>
          <RiverGauge value={river.ecologicalClass} england={england} />
          <p className="mt-5 text-sm text-body leading-relaxed max-w-xl">{describeRiverStatus(river)}</p>
          {river.type === "River" && matchType === "within" && river.drinkingWaterProtectedArea && (
            <p className="mt-3 text-sm text-body leading-relaxed max-w-xl">
              This {noun} is a protected source of drinking water, so what is in it matters for what the
              treatment works has to remove.
            </p>
          )}
        </div>

        <div>
          {river.elements.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-ink">What the rating is built from</h3>
              <ul className="mt-2 divide-y divide-rule border-y border-rule">
                {river.elements.map((e) => (
                  <li key={e.key} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="text-body">{e.label}</span>
                    <span className="flex items-center gap-2 text-ink font-medium">
                      <ClassDot value={e.status} />
                      {e.status}
                    </span>
                  </li>
                ))}
                {chemicalFails(river) && (
                  <li className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="text-body">Chemical test</span>
                    <span className="flex items-center gap-2 text-ink font-medium">
                      <ClassDot value="Bad" />
                      Fail
                    </span>
                  </li>
                )}
              </ul>
            </>
          )}
          <p className="mt-3 text-xs text-muted leading-relaxed">
            Environment Agency classification, {river.classificationYear}.{" "}
            <a
              href={catchmentExplorerUrl(river.waterBodyId)}
              rel="noopener noreferrer"
              target="_blank"
              className="text-accent hover:underline underline-offset-2"
            >
              {`See this ${noun} in the agency's records`}
            </a>
            . <Link href="/rivers" className="text-accent hover:underline underline-offset-2">River health across England</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

/** The rivers behind a city or region: a share line, the gauge of shares, and a table. */
export function AreaRiversSection({
  placeName,
  data,
  limit = 12,
}: {
  placeName: string;
  data: AreaRivers | null;
  limit?: number;
}) {
  if (!data) return null;
  const { summary, rivers } = data;
  const shown = rivers.slice(0, limit);
  const allFailChem = summary.chemicalAssessed > 0 && summary.chemicalFail === summary.chemicalAssessed;

  return (
    <section id="river-health" className="mt-12 scroll-mt-20" aria-labelledby="area-rivers-heading">
      <h2 id="area-rivers-heading" className="font-display text-2xl text-ink italic">
        River health around {placeName}
      </h2>
      <p className="text-sm text-body mt-2 max-w-2xl leading-relaxed">
        {summary.goodOrBetter === 0
          ? `None of the ${summary.total} rivers and waters that ${placeName} drains into is rated good by the Environment Agency.`
          : `${summary.goodOrBetter} of the ${summary.total} rivers and waters that ${placeName} drains into ${summary.goodOrBetter === 1 ? "is" : "are"} rated good or high by the Environment Agency.`}{" "}
        {allFailChem &&
          "All of them fail the chemical test, as every river in England does, because of long-lasting pollutants such as mercury and PFOS. "}
        This describes the rivers, not your tap water.
      </p>

      <div className="mt-5 overflow-x-auto border-t border-rule-strong">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th scope="col" className="py-2 pr-4 font-medium">River or water</th>
              <th scope="col" className="py-2 pr-4 font-medium">Ecological health</th>
              <th scope="col" className="py-2 font-medium">Postcode districts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule border-y border-rule">
            {shown.map(({ river, districts }) => (
              <tr key={river.waterBodyId}>
                <td className="py-2.5 pr-4 text-ink">{river.name}</td>
                <td className="py-2.5 pr-4">
                  <span className="flex items-center gap-2 text-ink font-medium whitespace-nowrap">
                    <ClassDot value={river.ecologicalClass} />
                    {river.ecologicalClass ?? "Not rated"}
                  </span>
                </td>
                <td className="py-2.5 text-body">
                  {districts.slice(0, 8).map((d, i) => (
                    <span key={d}>
                      {i > 0 && ", "}
                      <Link href={`/postcode/${d}#river-health`} className="hover:text-accent hover:underline underline-offset-2">
                        {d}
                      </Link>
                    </span>
                  ))}
                  {districts.length > 8 && ` and ${districts.length - 8} more`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">
        {rivers.length > shown.length && `Showing the ${shown.length} lowest rated of ${rivers.length}. `}
        Environment Agency classification, {summary.classificationYear}.{" "}
        <Link href="/rivers" className="text-accent hover:underline underline-offset-2">
          River health across England
        </Link>
      </p>
    </section>
  );
}
