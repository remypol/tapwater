"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { extractDistrict } from "@/lib/postcode-parse";
import { PART_L_HARD_WATER_PPM, isOverPartLLine, unpackDistricts } from "@/lib/part-l";

/**
 * Is this postcode over the 200 ppm line? Answers in the page, from hardness
 * figures sent with it, so a heating engineer on a doorstep gets the number
 * without a second page load.
 */
export function PartLChecker({ packed }: { packed: string }) {
  const districts = useMemo(() => unpackDistricts(packed), [packed]);
  const [value, setValue] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const district = extractDistrict(value);
    if (!district) {
      setAsked(null);
      setError("Enter a postcode or its first half, for example RG1 3AB or RG1.");
      return;
    }
    setError("");
    setAsked(district);
  }

  const found = asked ? districts.get(asked) : undefined;
  const over = found ? isOverPartLLine(found.value) : false;

  return (
    <div>
      <form onSubmit={handleSubmit} noValidate className="wt-search wt-search--sm" role="search">
        <div className="wt-search-row">
          <Search aria-hidden="true" />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Postcode of the property"
            aria-label="Postcode of the property"
            autoCapitalize="characters"
            autoComplete="postal-code"
            spellCheck={false}
          />
          <button type="submit" className="wt-btn wt-btn--sun">
            Check
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
        {error ? <p className="wt-search-error" role="alert">{error}</p> : null}
      </form>

      <div aria-live="polite" style={{ marginTop: asked ? 20 : 0 }}>
        {asked && !found ? (
          <p className="text-base text-body leading-relaxed">
            We hold no hardness figure for <strong className="text-ink">{asked}</strong>. Ask the water company for the supply zone&rsquo;s result, or
            test the tap with a hardness kit.
          </p>
        ) : null}
        {found ? (
          <div>
            <p className="font-display text-2xl italic text-ink">
              {found.district}: {found.basis === "m" ? "" : "about "}
              {found.value} ppm. {over ? "Over the 200 ppm line." : found.value === PART_L_HARD_WATER_PPM ? "On the line, not over it." : "Under the 200 ppm line."}
            </p>
            <p className="text-base text-body leading-relaxed mt-2">
              {over
                ? "The approved document counts this as a hard water area, so a new combination boiler or water heater here should have limescale protection on its feed."
                : "The approved document does not count this as a hard water area, so it asks for nothing extra on scale. A reducer can still be worth fitting if the figure is close to the line."}
            </p>
            <p className="text-sm text-muted leading-relaxed mt-2">
              {found.basis === "m"
                ? "A water company reading for this district, as mg/L of calcium carbonate, which is the same as ppm."
                : found.basis === "a"
                  ? "Thames Water's postcode checker cannot place this district in a supply zone, so this figure comes from the zones around it. Confirm it with Thames Water before relying on it."
                  : "No reading of its own for this district: this is the median for its postcode area. Check the water company's figure for the address."}{" "}
              <Link href={`/postcode/${found.district}`} className="text-accent hover:underline">
                Full water report for {found.district}
              </Link>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
