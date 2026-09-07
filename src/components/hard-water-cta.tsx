import Link from "next/link";
import { ArrowRight, Droplets } from "lucide-react";
import { Kicker } from "@/components/commerce";
import { SoftenerGuidesNav } from "@/components/softener-guides-nav";
import { HARD_WATER_THRESHOLD } from "@/lib/filters";

interface HardWaterCtaProps {
  /** "Leeds", "the South East" — used in the headline. */
  placeName: string;
  /** Average hardness in mg/L CaCO3. Renders nothing below the hard-water threshold. */
  hardness: number | null;
  hardnessClass: string | null;
  className?: string;
}

/**
 * The hard-water funnel on city and region pages. These pages carry most of
 * the "is X water hard or soft" searches, and until now they answered the
 * question and stopped. This turns the answer into the next step: quotes for
 * a softener, and the guides that explain the decision.
 */
export function HardWaterCta({ placeName, hardness, hardnessClass, className = "" }: HardWaterCtaProps) {
  if (hardness == null || hardness < HARD_WATER_THRESHOLD) return null;
  const rounded = Math.round(hardness);
  const veryHard = hardness >= 250;

  return (
    <aside
      aria-labelledby="hard-water-cta-heading"
      className={`card-warm p-6 lg:p-7 border-l-[3px] border-amber-500 ${className}`}
    >
      <Kicker accent>Hard water</Kicker>
      <h2 id="hard-water-cta-heading" className="font-display text-2xl italic text-ink mt-2">
        {placeName} water is {hardnessClass}: {rounded} mg/L
      </h2>
      <p className="text-base text-body leading-relaxed mt-3 max-w-2xl">
        {veryHard
          ? "That is well above the 200 mg/L mark where limescale starts costing money: furred kettles, scaled heating elements and a boiler working harder every year. A softener pays for itself fastest in water like this."
          : "That is over the line where limescale starts to show in kettles, on taps and inside the boiler. A softener is the only fix that removes the hardness; everything else manages the symptoms."}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href="/hardness#softener-quotes"
          className="inline-flex items-center justify-center gap-2 bg-btn text-white rounded-lg px-5 py-3 text-sm font-medium hover:bg-btn-hover transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Droplets className="w-4 h-4" aria-hidden="true" />
          Get softener quotes
        </Link>
        <Link
          href="/guides/do-i-need-a-water-softener/"
          className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline underline-offset-2"
        >
          Do I actually need one?
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
      <SoftenerGuidesNav
        variant="compact"
        current="do-i-need-a-water-softener"
        heading="Read before you buy"
        className="mt-6 pt-5 border-t border-rule"
      />
      <p className="text-sm text-muted mt-4">
        Not ready for a softener?{" "}
        <Link href="/guides/best-kettle-for-hard-water-uk/" className="text-accent hover:underline underline-offset-2">
          The kettles that cope with hard water
        </Link>{" "}
        and{" "}
        <Link href="/guides/best-shower-filter-uk/" className="text-accent hover:underline underline-offset-2">
          shower filters
        </Link>{" "}
        deal with the two places you notice it most.
      </p>
    </aside>
  );
}
