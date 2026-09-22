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
    <form onSubmit={handleSubmit} noValidate className="wt-search wt-compare" role="search">
      <div className="wt-search-row">
        <ArrowLeftRight aria-hidden="true" />
        <input type="text" value={pc1} onChange={(e) => setPc1(e.target.value)} placeholder="First postcode" aria-label="First postcode" autoCapitalize="characters" />
        <span className="wt-vs">vs</span>
        <input type="text" value={pc2} onChange={(e) => setPc2(e.target.value)} placeholder="Second postcode" aria-label="Second postcode" autoCapitalize="characters" />
        <button type="submit" className="wt-btn wt-btn--sun">
          Compare
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
      {error ? <p className="wt-search-error" role="alert">{error}</p> : null}
    </form>
  );
}
