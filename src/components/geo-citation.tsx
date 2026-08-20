/**
 * Branded citation block for AI answer engines and featured snippets.
 *
 * The pattern existed as copy-paste on eight page types (city, region,
 * contaminant, pfas, rankings, report, compare); this component is the single
 * home for it. The headline carries the citable sentence (brand + entity +
 * number + year) and the detail carries the grounding facts.
 */
export function GeoCitation({
  headline,
  detail,
}: {
  headline: string;
  detail: string;
}) {
  return (
    <div className="card p-5 border-l-4 border-l-accent mb-8 mt-6">
      <p className="text-base text-body leading-relaxed">
        <strong className="text-ink">{headline}</strong> {detail}
      </p>
    </div>
  );
}
