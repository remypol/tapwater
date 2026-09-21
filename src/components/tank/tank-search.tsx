"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { events } from "@/lib/analytics";

const DISTRICT_RE = /^[A-Z]{1,2}[0-9][0-9A-Z]?$/;

/** "SW1A 1AA", "sw1a1aa" or "SW1A" → "SW1A". Null when it is not a UK postcode. */
export function extractDistrict(input: string): string | null {
  const normalized = input.trim().toUpperCase();
  if (!normalized) return null;
  const parts = normalized.split(/\s+/);
  let district: string;
  if (parts.length > 1) district = parts[0];
  else {
    const compact = normalized.replace(/[^A-Z0-9]/g, "");
    // A full postcode typed without a space ends in digit + two letters.
    district = /^[A-Z]{1,2}[0-9][0-9A-Z]?[0-9][A-Z]{2}$/.test(compact) ? compact.slice(0, -3) : compact.slice(0, 4);
  }
  return DISTRICT_RE.test(district) ? district : null;
}

/** The postcode box, in the tank's own dress. One field, one button, one clear error. */
export function TankSearch({ hash, id = "wt-postcode" }: { hash?: string; id?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const district = extractDistrict(value);
    if (!district) {
      setError("That does not look like a UK postcode. Try SW1A 1AA, M1 or B1.");
      return;
    }
    setError("");
    events.postcodeSearch(district);
    router.push(`/postcode/${district}/${hash ? `#${hash}` : ""}`);
  }

  return (
    <form onSubmit={submit} noValidate className="wt-search" role="search">
      <label htmlFor={id} className="wt-sr">Your postcode</label>
      <div className="wt-search-row">
        <Search aria-hidden="true" />
        <input
          id={id}
          name="postcode"
          type="text"
          inputMode="text"
          autoComplete="postal-code"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="Enter your postcode"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button type="submit" className="wt-btn wt-btn--sun">
          Check my water
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
      {error ? <p id={`${id}-error`} className="wt-search-error" role="alert">{error}</p> : null}
    </form>
  );
}
