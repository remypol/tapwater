import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Kicker } from "@/components/commerce";
import { getPfasNationalSummary, type PfasNationalSummary } from "@/lib/pfas-data";

/**
 * "Our data" block on PFAS for a buying guide: the Environment Agency monitoring
 * totals the PFAS guide quotes, in the same words, with the caveat that these are
 * river and groundwater samples.
 *
 * Renders nothing when the summary cannot be read. A failed query must never turn
 * into "no PFAS found", which would be a claim the page makes on our behalf.
 */

function monthYear(iso: string | Date): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function PfasDataView({
  summary,
  asOf,
  children,
}: {
  summary: Pick<
    PfasNationalSummary,
    "totalDetections" | "totalSamplingPoints" | "citiesWithDetections" | "citiesMonitored" | "latestDetectionDate"
  >;
  asOf: Date;
  children?: React.ReactNode;
}) {
  // A flex column with gaps: the .wt reset zeroes margins on p and h3.
  return (
    <aside aria-labelledby="pfas-data-heading" className="card p-6 lg:p-8 my-8 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Kicker accent>TapWater.uk data</Kicker>
        <h3 id="pfas-data-heading" className="font-display text-xl italic text-ink">
          PFAS around UK cities
        </h3>
      </div>
      <p>
        <span className="block font-data text-4xl text-ink">
          {summary.totalDetections.toLocaleString("en-GB")}
        </span>
        <span className="block text-base text-body">
          PFAS detections recorded by Environment Agency monitoring
        </span>
      </p>
      <p className="text-base text-body leading-relaxed">
        They come from {summary.totalSamplingPoints.toLocaleString("en-GB")} river and groundwater
        sampling points in {summary.citiesWithDetections} of the {summary.citiesMonitored} cities
        we track, the most recent in {monthYear(summary.latestDetectionDate)}. These are samples of
        rivers and groundwater, not of tap water, and water companies do not publish their own PFAS
        results by postcode.
      </p>
      {children ? <p className="text-base text-body leading-relaxed">{children}</p> : null}
      <div className="pt-4 border-t border-rule">
        <p className="text-xs text-muted leading-relaxed">
          Source: Environment Agency water quality monitoring, PFAS compounds, as held by
          TapWater.uk. Figures as of {monthYear(asOf)}.{" "}
          <Link href="/pfas" className="text-accent hover:underline">
            PFAS tracker by city
          </Link>
        </p>
      </div>
    </aside>
  );
}

export async function GuidePfasData({ children }: { children?: React.ReactNode }) {
  let summary: PfasNationalSummary | null = null;
  try {
    summary = await getPfasNationalSummary();
  } catch (err) {
    // Next's own control-flow errors must keep propagating; a failed query hides the block.
    unstable_rethrow(err);
    return null;
  }
  if (!summary) return null;
  return (
    <PfasDataView summary={summary} asOf={new Date()}>
      {children}
    </PfasDataView>
  );
}
