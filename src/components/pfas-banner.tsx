import Link from "next/link";
import { ShieldAlert, ArrowRight } from "lucide-react";

interface PfasBannerProps {
  detected: boolean;
  level: number | null;
  postcode: string;
}

export function PfasBanner({ detected, level, postcode }: PfasBannerProps) {
  if (!detected) return null;

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
