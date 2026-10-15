import Link from "next/link";
import { Kicker } from "@/components/commerce";
import { getHardnessAreaCodes, getMeasuredHardness } from "@/lib/data";
import {
  LONDON_POSTCODE_AREAS,
  summariseHardness,
  type AreaHardness,
  type HardnessSummary,
} from "@/lib/guide-hardness";

/**
 * "Our data" block for the buying guides: how many measured districts sit at or
 * above the hardness that matters for this product, and which postcode areas are
 * hardest and softest (or, for the London list, how each London area reads).
 *
 * Renders nothing when there is no hardness data (a build without Supabase), so
 * a guide never shows an empty or zeroed block. The guide supplies the sentence
 * that ties the numbers to its own product as children.
 */

const MIN_DISTRICTS = 3;

function monthYear(date: Date): string {
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function AreaList({ title, areas, linked }: { title: string; areas: AreaHardness[]; linked: Set<string> }) {
  return (
    <div className="flex flex-col gap-2">
      <Kicker>{title}</Kicker>
      <ol className="border-t border-rule divide-y divide-rule">
        {areas.map((a) => (
          <li key={a.area} className="py-2 flex items-baseline justify-between gap-3 text-sm">
            <span>
              {linked.has(a.area) ? (
                <Link href={`/hardness/${a.area.toLowerCase()}`} className="text-ink hover:text-accent hover:underline">
                  {a.name}
                </Link>
              ) : (
                <span className="text-ink">{a.name}</span>
              )}{" "}
              <span className="font-mono text-xs text-muted">{a.area}</span>
            </span>
            <span className="font-data text-ink whitespace-nowrap">
              {a.median} mg/L{" "}
              <span className="text-xs text-muted">· {a.districts} measured</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function HardnessDataView({
  summary,
  heading,
  list,
  linked,
  asOf,
  children,
}: {
  summary: HardnessSummary;
  heading: string;
  list: "extremes" | "london";
  /** Area codes that have a /hardness/[area] page to link to. */
  linked: Set<string>;
  asOf: Date;
  children?: React.ReactNode;
}) {
  const headingId = `hardness-data-${summary.threshold}-${list}`;
  // The London list gets a London figure; everything else the UK one.
  const london = list === "london" && summary.pickedMeasured > 0;
  const percent = london ? summary.pickedPercent : summary.percent;
  const measured = london ? summary.pickedMeasured : summary.measured;
  // A flex column with gaps: the .wt reset zeroes margins on p, h3 and ol.
  return (
    <aside aria-labelledby={headingId} className="card p-6 lg:p-8 my-8 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Kicker accent>TapWater.uk data</Kicker>
        <h3 id={headingId} className="font-display text-xl italic text-ink">
          {heading}
        </h3>
      </div>
      <p>
        <span className="block font-data text-4xl text-ink">{percent}%</span>
        <span className="block text-base text-body">
          of the {measured.toLocaleString("en-GB")} {london ? "London" : "UK"} postcode districts
          with a hardness reading of their own are at {summary.threshold} mg/L or more.
        </span>
      </p>
      {children ? <p className="text-base text-body leading-relaxed">{children}</p> : null}

      {list === "extremes" && summary.hardest.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
          <AreaList title="Hardest postcode areas" areas={summary.hardest} linked={linked} />
          {summary.softest.length > 0 ? (
            <AreaList title="Softest postcode areas" areas={summary.softest} linked={linked} />
          ) : null}
        </div>
      ) : null}
      {list === "london" && summary.picked.length > 0 ? (
        <div className="max-w-md mt-2">
          <AreaList title="London, by postcode area" areas={summary.picked} linked={linked} />
        </div>
      ) : null}

      <div className="pt-4 border-t border-rule">
        <p className="text-xs text-muted leading-relaxed">
          Source: TapWater.uk analysis of the hardness results water companies publish for their
          supply zones and through their postcode checkers. Medians per postcode area, for areas
          with {MIN_DISTRICTS} or more measured districts; districts without a reading of their own
          are left out. Figures as of {monthYear(asOf)}.{" "}
          <Link href="/hardness" className="text-accent hover:underline">
            Every area, and your own postcode
          </Link>
        </p>
      </div>
    </aside>
  );
}

export async function GuideHardnessData({
  threshold,
  heading,
  list = "extremes",
  children,
}: {
  /** mg/L CaCO3 that matters for this product: 200 for softening, 250 for a boiling tap's tank. */
  threshold: number;
  heading: string;
  list?: "extremes" | "london";
  children?: React.ReactNode;
}) {
  const rows = await getMeasuredHardness();
  const summary = summariseHardness(rows, {
    threshold,
    minDistricts: MIN_DISTRICTS,
    areas: list === "london" ? LONDON_POSTCODE_AREAS : [],
  });
  if (!summary) return null;
  // Only link areas that have their own page, so the block never points at a 404.
  const linked = new Set((await getHardnessAreaCodes()).map((a) => a.toUpperCase()));
  return (
    <HardnessDataView summary={summary} heading={heading} list={list} linked={linked} asOf={new Date()}>
      {children}
    </HardnessDataView>
  );
}
