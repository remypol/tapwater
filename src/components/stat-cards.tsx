import { FlaskConical, AlertTriangle, Building2, CalendarCheck } from "lucide-react";

interface StatCardsProps {
  contaminantsTested: number;
  contaminantsFlagged: number;
  supplier: string;
  lastUpdated: string;
}

function formatLastUpdated(raw: string): string {
  // Accept ISO dates like "2026-03-01" or already-formatted strings like "Mar 2026"
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export function StatCards({
  contaminantsTested,
  contaminantsFlagged,
  supplier,
  lastUpdated,
}: StatCardsProps) {
  const isFlagged = contaminantsFlagged > 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

      {/* Parameters Tested */}
      <div className="card p-5 animate-fade-up delay-1">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
          <FlaskConical className="w-4 h-4 text-blue-600" aria-hidden="true" />
        </div>
        <p className="font-data text-2xl font-bold" style={{ color: "var(--color-ink)" }}>
          {contaminantsTested}
        </p>
        <p
          className="mt-1 text-xs uppercase tracking-wider"
          style={{ color: "var(--color-muted)" }}
        >
          Parameters Tested
        </p>
      </div>

      {/* Flagged */}
      <div className="card p-5 animate-fade-up delay-2">
        <div
          className={[
            "w-8 h-8 rounded-lg flex items-center justify-center mb-3",
            isFlagged ? "bg-amber-50" : "bg-green-50",
          ].join(" ")}
        >
          <AlertTriangle
            className={["w-4 h-4", isFlagged ? "text-amber-600" : "text-green-600"].join(" ")}
            aria-hidden="true"
          />
        </div>
        <p
          className="font-data text-2xl font-bold"
          style={{ color: isFlagged ? "#d97706" : "var(--color-ink)" }}
        >
          {contaminantsFlagged}
        </p>
        <p
          className="mt-1 text-xs uppercase tracking-wider"
          style={{ color: "var(--color-muted)" }}
        >
          Flagged
        </p>
      </div>

      {/* Supplier */}
      <div className="card p-5 animate-fade-up delay-3">
        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mb-3">
          <Building2 className="w-4 h-4 text-slate-600" aria-hidden="true" />
        </div>
        <p
          className="text-base font-semibold leading-snug"
          style={{ color: "var(--color-ink)" }}
        >
          {supplier}
        </p>
        <p
          className="mt-1 text-xs uppercase tracking-wider"
          style={{ color: "var(--color-muted)" }}
        >
          Water Supplier
        </p>
      </div>

      {/* Last Updated */}
      <div className="card p-5 animate-fade-up delay-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
          <CalendarCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
        </div>
        <p
          className="font-data text-base font-bold"
          style={{ color: "var(--color-ink)" }}
        >
          {formatLastUpdated(lastUpdated)}
        </p>
        <p
          className="mt-1 text-xs uppercase tracking-wider"
          style={{ color: "var(--color-muted)" }}
        >
          Last Updated
        </p>
      </div>

    </div>
  );
}
