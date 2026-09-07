import Link from "next/link";
import { ArrowRight, Waves } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Kicker } from "@/components/commerce";
import { PRODUCTS } from "@/lib/products";
import { DWI_PFAS_GUIDELINE_UG_L, type PfasNearbySummary } from "@/lib/pfas-data";

/**
 * "PFAS measured near you": the Environment Agency river and groundwater samples
 * within 10 km of a postcode district, rendered underneath the tap-water data.
 *
 * It is deliberately not the lead of the page. The tap-water tests are. This
 * module exists because it converts well to the PFAS filter guide, and because
 * the question "are there forever chemicals near me" deserves a straight answer
 * built from real samples. Every sentence keeps the distinction: these samples
 * describe rivers and boreholes, never the water in the reader's tap.
 *
 * Renders nothing when there are no samples within range.
 */

/** The PFAS guide's top pick, with a fallback to any PFAS-rated product. */
export function pfasFilterPick() {
  return (
    PRODUCTS.find((p) => p.id === "waterdrop-g3p600" && p.availableInUk !== false) ??
    PRODUCTS.find((p) => p.removes.includes("PFAS (total)") && p.availableInUk !== false)
  );
}

const SITE_ACRONYMS = new Set(["RAF", "MOD", "STW", "WTW", "WWTW", "GW", "BH", "D/S", "U/S"]);
const SITE_SMALL_WORDS = new Set(["at", "of", "on", "the", "and", "to", "in", "by", "for", "nr"]);

/** EA labels arrive shouted ("RIVER LEE AT BOW LOCKS"); read them back quietly. */
export function humaniseSiteLabel(label: string): string {
  return label
    .trim()
    .split(/\s+/)
    .map((raw, i) => {
      const upper = raw.toUpperCase();
      if (SITE_ACRONYMS.has(upper) || /\d/.test(raw)) return upper;
      const word = raw.toLowerCase();
      if (i > 0 && SITE_SMALL_WORDS.has(word)) return word;
      return word.replace(/(^|[-(/'])([a-z])/g, (_, pre: string, ch: string) => pre + ch.toUpperCase());
    })
    .join(" ");
}

/** "2024-11-02" -> "November 2024". Month is enough precision for a spot sample. */
export function formatSampleMonth(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** Trim a µg/L reading to the digits that matter, never to "0". */
export function formatMicrograms(value: number): string {
  if (value >= 1) return value.toFixed(2).replace(/\.?0+$/, "");
  if (value >= 0.01) return value.toFixed(3).replace(/0+$/, "");
  return value.toPrecision(2).replace(/0+$/, "");
}

/** How the highest reading sits against the DWI's 0.1 µg/L guideline, in words. */
export function describeAgainstGuideline(value: number): string {
  const guideline = `the ${DWI_PFAS_GUIDELINE_UG_L} µg/L guideline the Drinking Water Inspectorate uses for a single PFAS compound in drinking water`;
  const ratio = value / DWI_PFAS_GUIDELINE_UG_L;
  if (ratio >= 1.5) {
    const times = ratio >= 10 ? Math.round(ratio) : Math.round(ratio * 10) / 10;
    return `That is ${times} times ${guideline}.`;
  }
  if (ratio >= 1) return `That is at or just above ${guideline}.`;
  if (ratio >= 0.1) return `That is about ${Math.round(ratio * 100)}% of ${guideline}.`;
  return `That is well under ${guideline}.`;
}

function joinCompounds(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

interface PfasNearbyProps {
  district: string;
  summary: PfasNearbySummary | null;
}

export function PfasNearby({ district, summary }: PfasNearbyProps) {
  if (!summary) return null;

  const { highest, radiusKm } = summary;
  const pick = pfasFilterPick();
  const compounds = summary.topCompounds.map((c) => c.compound);
  const distance =
    highest.distanceKm < 1 ? "under 1 km" : `${highest.distanceKm.toFixed(1)} km`;
  const cell = "p-4 border-t border-rule even:border-l sm:border-l sm:first:border-l-0";

  return (
    <section id="pfas-nearby" className="mt-10 scroll-mt-20" aria-labelledby="pfas-nearby-heading">
      <div className="flex items-start gap-2">
        <Waves className="w-4 h-4 mt-2 text-[var(--color-pfas)] shrink-0" aria-hidden="true" />
        <h2 id="pfas-nearby-heading" className="font-display text-2xl text-ink italic">
          PFAS measured in rivers and groundwater within {radiusKm} km of {district}
        </h2>
      </div>
      <p className="text-sm text-muted mt-1 max-w-2xl leading-relaxed">
        These are Environment Agency samples from rivers, streams and boreholes, not
        tests of the water in your tap. They show which forever chemicals are in the
        environment around {district}. The UK has no legal limit for PFAS in drinking
        water yet; the Drinking Water Inspectorate works to a {DWI_PFAS_GUIDELINE_UG_L} µg/L
        guideline for individual compounds.
      </p>

      <div className="card mt-5 overflow-hidden">
        {/* The highest reading is the one thing worth remembering; the rest is context. */}
        <div className="p-5 sm:p-6" style={{ borderLeft: "3px solid var(--color-pfas)" }}>
          <Kicker>Highest single reading</Kicker>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-display text-4xl sm:text-5xl text-ink tabular-nums leading-none">
              {formatMicrograms(highest.value)}
              <span className="text-2xl sm:text-3xl text-muted"> µg/L</span>
            </span>
            <span className="text-base text-ink font-medium">{highest.compound}</span>
          </p>
          <p className="mt-3 text-sm text-body leading-relaxed max-w-2xl">
            Sampled at {humaniseSiteLabel(highest.samplingPointLabel)}, {distance} from{" "}
            {district}, in {formatSampleMonth(highest.date)}.{" "}
            {describeAgainstGuideline(highest.value)} The comparison is for scale only:
            river and groundwater is treated before it reaches a tap.
          </p>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4">
          <div className={cell}>
            <dt className="text-xs text-muted">Detections</dt>
            <dd className="font-data text-xl font-semibold text-ink mt-0.5 tabular-nums">
              {summary.detectionCount.toLocaleString("en-GB")}
            </dd>
          </div>
          <div className={cell}>
            <dt className="text-xs text-muted">Sampling sites</dt>
            <dd className="font-data text-xl font-semibold text-ink mt-0.5 tabular-nums">
              {summary.samplingPointCount.toLocaleString("en-GB")}
            </dd>
          </div>
          <div className={cell}>
            <dt className="text-xs text-muted">Most often found</dt>
            <dd className="text-sm font-medium text-ink mt-1 leading-snug">
              {joinCompounds(compounds)}
            </dd>
          </div>
          <div className={cell}>
            <dt className="text-xs text-muted">Most recent sample</dt>
            <dd className="text-sm font-medium text-ink mt-1 leading-snug">
              {formatSampleMonth(summary.latestDate)}
            </dd>
          </div>
        </dl>

        <div className="border-t border-rule px-5 py-3 flex flex-wrap gap-x-6 gap-y-2">
          {summary.nearestCitySlug && summary.nearestCityName && (
            <Link
              href={`/pfas/${summary.nearestCitySlug}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline underline-offset-2"
            >
              Every PFAS sample around {summary.nearestCityName}
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          )}
          <Link
            href="/guides/best-water-filter-pfas"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline underline-offset-2"
          >
            Which filters remove PFAS
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {pick && (
        <div className="mt-5">
          <p className="text-sm text-body leading-relaxed max-w-2xl mb-3">
            If you would rather not wait for PFAS rules to catch up, reverse osmosis is
            the home treatment with the strongest evidence for removing them. This is the
            system our PFAS filter guide rates highest.
          </p>
          <ProductCard
            product={pick}
            highlight="For PFAS specifically: certified reverse osmosis"
            pageType="postcode"
            placement="postcode-pfas"
            postcodeArea={district}
            recommendationReason="pfas-nearby"
          />
        </div>
      )}
    </section>
  );
}
