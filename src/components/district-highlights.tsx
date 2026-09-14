import Link from "next/link";
import type { Highlight } from "@/lib/district-highlights";

interface DistrictHighlightsProps {
  district: string;
  highlights: Highlight[];
}

/**
 * The three facts that make this district's water different from the next one.
 *
 * Set as a ledger, not cards: each row is one fact, the bold clause is the fact
 * itself and the plain line under it says what it means. The first row carries
 * the most weight so it is set a size up. Links are inline and quiet; the point
 * is the sentence, not the button.
 */
export function DistrictHighlights({ district, highlights }: DistrictHighlightsProps) {
  if (highlights.length === 0) return null;

  return (
    <section id="what-stands-out" className="mt-10 max-w-3xl" aria-labelledby="what-stands-out-heading">
      <h2 id="what-stands-out-heading" className="font-display text-2xl text-ink italic">
        What stands out in {district}
      </h2>
      <ol className="mt-4 divide-y divide-rule border-y border-rule">
        {highlights.map((h, i) => (
          <li key={h.kind} className={i === 0 ? "py-5" : "py-4"}>
            <p className={`font-medium text-ink leading-snug ${i === 0 ? "text-lg" : "text-base"}`}>
              {h.lead}
            </p>
            <p className="mt-1.5 text-sm text-body leading-relaxed">
              {h.detail}
              {h.link && (
                <>
                  {" "}
                  {h.link.href.startsWith("#") ? (
                    <a
                      href={h.link.href}
                      className="text-ink underline underline-offset-2 decoration-rule hover:decoration-accent transition-colors"
                    >
                      {h.link.label}
                    </a>
                  ) : (
                    <Link
                      href={h.link.href}
                      className="text-ink underline underline-offset-2 decoration-rule hover:decoration-accent transition-colors"
                    >
                      {h.link.label}
                    </Link>
                  )}
                </>
              )}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
