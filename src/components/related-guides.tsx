import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { pickRelatedGuides, type RelatedGuideSignals } from "@/lib/guides";

/**
 * The internal-link engine for the programmatic pages (rendered on every
 * postcode and city page). Selection logic lives in pickRelatedGuides so it
 * is unit-testable; this component only renders the cards.
 */
export function RelatedGuides(signals: RelatedGuideSignals) {
  const guides = pickRelatedGuides(signals);

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2 mb-1">
        <BookOpen className="w-4 h-4 text-accent shrink-0" />
        <h2 className="font-display text-2xl text-ink italic">Related guides</h2>
      </div>
      <p className="text-sm text-muted mt-1 mb-5">
        Learn more about the water quality issues relevant to this area.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}/`}
            className="card p-4 flex items-start justify-between gap-3 group"
          >
            <div className="min-w-0">
              <p className="font-semibold text-ink text-sm group-hover:text-accent transition-colors">
                {guide.title}
              </p>
              <p className="text-sm text-muted mt-0.5 leading-snug">{guide.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-faint group-hover:text-accent transition-colors shrink-0 mt-0.5" />
          </Link>
        ))}
      </div>
    </section>
  );
}
