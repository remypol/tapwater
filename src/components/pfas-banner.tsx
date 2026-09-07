import Link from "next/link";
import { ShieldAlert, ArrowRight } from "lucide-react";

interface PfasBannerProps {
  detected: boolean;
  level: number | null;
  postcode: string;
  /**
   * Where the number came from. "page" is the reading attached to this district's
   * own page_data; "nearby" is the highest Environment Agency river or groundwater
   * sample within `radiusKm`, used when page_data carries no PFAS value so the top
   * of the page never contradicts the module further down.
   */
  source?: "page" | "nearby";
  radiusKm?: number;
}

export function PfasBanner({
  detected,
  level,
  postcode,
  source = "page",
  radiusKm = 10,
}: PfasBannerProps) {
  if (!detected) return null;

  if (source === "nearby") {
    // Quieter than the page-data banner: PFAS is not the lead of this page, and
    // this is environmental monitoring. It points down to the module that explains.
    return (
      <div
        className="w-full rounded-lg px-4 py-3 bg-violet-50/80 flex flex-wrap items-center gap-x-4 gap-y-1"
        style={{ borderLeft: "3px solid var(--color-pfas)" }}
      >
        <ShieldAlert className="w-4 h-4 text-violet-600 shrink-0" aria-hidden="true" />
        <p className="text-sm text-violet-900 flex-1 min-w-[16rem]">
          PFAS were measured in rivers and groundwater within {radiusKm} km of {postcode}
          {level !== null ? (
            <>
              , up to <span className="font-data font-semibold">{level} µg/L</span>
            </>
          ) : null}
          . Environmental samples, not tap water.
        </p>
        <Link
          href="#pfas-nearby"
          className="inline-flex items-center gap-1 text-sm font-medium text-violet-700 hover:text-violet-900 hover:underline underline-offset-2"
        >
          See what was found
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div
      className="w-full rounded-lg p-5 bg-violet-50/80"
      style={{ borderLeft: "3px solid var(--color-pfas)" }}
    >
      {/* Heading row */}
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-violet-600 shrink-0" aria-hidden="true" />
        <span className="text-sm font-semibold text-violet-900 uppercase tracking-wide">
          Forever chemicals found near you
        </span>
      </div>

      {/* Body */}
      <div className="mt-2 space-y-1">
        <p className="text-sm text-violet-800">
          PFAS — known as &apos;forever chemicals&apos; — were found at{" "}
          <Link
            href="/pfas"
            className="font-data font-semibold text-violet-700 hover:text-violet-900 underline underline-offset-2"
          >
            {level !== null ? level : "—"} µg/L
          </Link>
          {" "}in water tests near {postcode}. The UK doesn&apos;t have a legal limit for these yet.
        </p>
      </div>

      {/* Links */}
      <div className="mt-3 flex flex-wrap gap-4">
        <Link
          href="/pfas"
          className="inline-flex items-center gap-1 text-sm font-medium text-violet-700 hover:text-violet-900 hover:underline underline-offset-2"
        >
          See PFAS tracker
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
        <Link
          href="/contaminant/pfas"
          className="inline-flex items-center gap-1 text-sm font-medium text-violet-700 hover:text-violet-900 hover:underline underline-offset-2"
        >
          How to remove them
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
