"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeftRight } from "lucide-react";

const DISTRICT_RE = /^[A-Z]{1,2}[0-9][0-9A-Z]?$/;

function extractDistrict(input: string): string | null {
  const normalized = input.trim().toUpperCase();
  const parts = normalized.split(/\s+/);
  const district = parts.length > 1 ? parts[0] : normalized.replace(/[^A-Z0-9]/g, "").slice(0, 4);
  return DISTRICT_RE.test(district) ? district : null;
}

export function CompareSearch() {
  const router = useRouter();
  const [pc1, setPc1] = useState("");
  const [pc2, setPc2] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const d1 = extractDistrict(pc1);
    const d2 = extractDistrict(pc2);

    if (!d1 || !d2) {
      setError("Enter two valid postcodes (e.g. SW1A and M1)");
      return;
    }
    if (d1 === d2) {
      setError("Enter two different postcodes");
      return;
    }

    router.push(`/compare/${d1}/vs/${d2}`);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="card p-5">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-ink shrink-0">
          <ArrowLeftRight className="w-4 h-4 inline mr-1.5 text-accent" />
          Compare two areas
        </p>
      </div>
      <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          type="text"
          value={pc1}
          onChange={(e) => setPc1(e.target.value)}
          placeholder="e.g. SW1A"
          aria-label="First postcode"
          className="flex-1 border border-rule rounded-lg px-4 py-2.5 text-sm bg-transparent text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <span className="text-xs text-faint text-center shrink-0">vs</span>
        <input
          type="text"
          value={pc2}
          onChange={(e) => setPc2(e.target.value)}
          placeholder="e.g. M1"
          aria-label="Second postcode"
          className="flex-1 border border-rule rounded-lg px-4 py-2.5 text-sm bg-transparent text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <button
          type="submit"
          className="bg-btn text-white rounded-lg py-2.5 px-5 text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-btn-hover transition-colors shrink-0"
        >
          Compare
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
      {error && (
        <p className="text-xs text-danger mt-2">{error}</p>
      )}
    </form>
  );
}
