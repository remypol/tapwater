"use client";

import Link from "next/link";
import { FlaskConical, AlertTriangle, Building2, CalendarCheck } from "lucide-react";

interface StatCardsProps {
  contaminantsTested: number;
  contaminantsFlagged: number;
  supplier: string;
  supplierId: string;
  lastUpdated: string;
}

function formatLastUpdated(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function ScrollCard({
  target,
  children,
}: {
  target: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        const el = document.getElementById(target);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className="card p-6 text-left cursor-pointer hover:border-accent/30 transition-colors group"
    >
      {children}
    </button>
  );
}

export function StatCards({
  contaminantsTested,
  contaminantsFlagged,
  supplier,
  supplierId,
  lastUpdated,
}: StatCardsProps) {
  const isFlagged = contaminantsFlagged > 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

      {/* Tests run — scrolls to contaminant table */}
      <ScrollCard target="what-we-found">
        <div className="animate-fade-up delay-1">
          <div className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center mb-3">
            <FlaskConical className="w-4 h-4 text-accent" aria-hidden="true" />
          </div>
          <p className="font-data text-2xl font-bold text-ink">
            {contaminantsTested}
          </p>
          <p className="mt-1 text-sm text-muted">
            Tests run
          </p>
        </div>
      </ScrollCard>

      {/* Flagged — scrolls to contaminant table */}
      <ScrollCard target="what-we-found">
        <div className="animate-fade-up delay-2">
          <div
            className={[
              "w-9 h-9 rounded-xl flex items-center justify-center mb-3",
              isFlagged ? "bg-warning-light" : "bg-safe-light",
            ].join(" ")}
          >
            <AlertTriangle
              className={["w-4 h-4", isFlagged ? "text-warning" : "text-safe"].join(" ")}
              aria-hidden="true"
            />
          </div>
          <p
            className="font-data text-2xl font-bold"
            style={{ color: isFlagged ? "var(--color-warning)" : "var(--color-ink)" }}
          >
            {isFlagged ? contaminantsFlagged : "All clear"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {isFlagged ? "To watch" : "All clear"}
          </p>
        </div>
      </ScrollCard>

      {/* Supplier — links to supplier page */}
      <Link
        href={`/supplier/${supplierId}`}
        className="card p-6 hover:border-accent/30 transition-colors group"
      >
        <div className="animate-fade-up delay-3">
          <div className="w-9 h-9 rounded-xl bg-wash flex items-center justify-center mb-3">
            <Building2 className="w-4 h-4 text-faint group-hover:text-accent transition-colors" aria-hidden="true" />
          </div>
          <p className="text-2xl font-semibold leading-snug text-ink group-hover:text-accent transition-colors">
            {supplier}
          </p>
          <p className="mt-1 text-sm text-muted">
            Your water company
          </p>
        </div>
      </Link>

      {/* Last Updated — scrolls to methodology footer */}
      <ScrollCard target="methodology-footer">
        <div className="animate-fade-up delay-4">
          <div className="w-9 h-9 rounded-xl bg-safe-light flex items-center justify-center mb-3">
            <CalendarCheck className="w-4 h-4 text-safe" aria-hidden="true" />
          </div>
          <p className="font-data text-2xl font-bold text-ink">
            {formatLastUpdated(lastUpdated)}
          </p>
          <p className="mt-1 text-sm text-muted">
            Last checked
          </p>
        </div>
      </ScrollCard>

    </div>
  );
}
