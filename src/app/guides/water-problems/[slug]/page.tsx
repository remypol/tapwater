import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PostcodeSearch } from "@/components/postcode-search";
import { FAQSchema, ArticleSchema, BreadcrumbSchema } from "@/components/json-ld";
import { WATER_PROBLEMS } from "@/lib/water-problems";
import { CheckCircle, AlertTriangle, Phone } from "lucide-react";

export const revalidate = 86400;

const BASE_URL = "https://www.tapwater.uk";

export function generateStaticParams() {
  return WATER_PROBLEMS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const problem = WATER_PROBLEMS.find((p) => p.slug === slug);
  if (!problem) return {};

  const year = new Date().getFullYear();
  const maxPageTitle = 45; // 60 - " | TapWater.uk".length
  const fullTitle = `${problem.title} (${year})`;
  const title = fullTitle.length <= maxPageTitle ? fullTitle : problem.title;
  const description = `${problem.symptom} — find out why it happens, whether it's safe, and what to do. UK tap water guide.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/guides/water-problems/${problem.slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

const CONTAMINANT_SLUG_MAP: Record<string, string> = {
  Chlorine: "chlorine",
  Lead: "lead",
  Copper: "copper",
  Iron: "iron",
  Manganese: "manganese",
  Fluoride: "fluoride",
  Nitrate: "nitrate",
};

export default async function WaterProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const problem = WATER_PROBLEMS.find((p) => p.slug === slug);
  if (!problem) notFound();

  const dateStr = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <FAQSchema
        faqs={[
          {
            question: `Is ${problem.symptom.toLowerCase()} dangerous?`,
            answer: problem.isDangerous,
          },
          {
            question: `What should I do if ${problem.symptom.toLowerCase()}?`,
            answer: problem.whatToDo.join(" "),
          },
          {
            question: `When should I contact my water supplier about ${problem.symptom.toLowerCase()}?`,
            answer: problem.whenToContact,
          },
        ]}
      />

      <BreadcrumbSchema
        items={[
          { name: "Home", url: BASE_URL },
          { name: "Guides", url: `${BASE_URL}/guides` },
          { name: "Water Problems", url: `${BASE_URL}/guides/water-problems` },
          { name: problem.title, url: `${BASE_URL}/guides/water-problems/${problem.slug}` },
        ]}
      />

      <ArticleSchema
        headline={problem.title}
        description={`${problem.symptom} — find out why it happens, whether it's safe, and what to do.`}
        url={`${BASE_URL}/guides/water-problems/${problem.slug}`}
        datePublished="2026-04-06"
        dateModified={dateStr}
        authorName="TapWater.uk Research"
        authorUrl={`${BASE_URL}/about`}
      />

      <div className="max-w-3xl mx-auto">

        {/* Breadcrumb */}
        <nav className="text-sm text-muted mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 flex-wrap">
            <li><Link href="/" className="hover:text-accent transition-colors">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/guides" className="hover:text-accent transition-colors">Guides</Link></li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/guides/water-problems/" className="hover:text-accent transition-colors">
                Water Problems
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-ink" aria-current="page">{problem.title}</li>
          </ol>
        </nav>

        {/* H1 */}
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          {problem.title}
        </h1>
        <div className="flex items-center gap-2 mt-3 mb-8 text-sm text-muted">
          <span>By <span className="text-ink font-medium">TapWater.uk Research</span></span>
          <span>·</span>
          <time dateTime={dateStr}>
            Updated {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </time>
          <span>·</span>
          <span>Independent research</span>
        </div>

        {/* Symptom callout */}
        <div className="card p-4 mb-8 border-l-2 border-accent">
          <p className="text-sm font-semibold text-ink uppercase tracking-wider mb-1">Symptom</p>
          <p className="text-base text-body">{problem.symptom}</p>
        </div>

        {/* Causes */}
        <h2 className="font-display text-xl italic mt-8 mb-4 text-ink">
          What causes this?
        </h2>
        <ul className="space-y-3">
          {problem.causes.map((cause, i) => (
            <li key={i} className="flex gap-3 text-base text-body leading-relaxed">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0" aria-hidden="true" />
              {cause}
            </li>
          ))}
        </ul>

        {/* Is it dangerous */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" aria-hidden="true" />
          Is it dangerous?
        </h2>
        <p className="text-base text-body leading-relaxed">
          {problem.isDangerous}
        </p>

        {/* What to do */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-safe shrink-0" aria-hidden="true" />
          What to do
        </h2>
        <ol className="space-y-4">
          {problem.whatToDo.map((step, i) => (
            <li key={i} className="flex gap-4 text-base text-body leading-relaxed">
              <span className="font-data text-xs font-bold text-faint mt-0.5 w-5 shrink-0 text-right">
                {i + 1}.
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        {/* When to contact */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <Phone className="w-5 h-5 text-danger shrink-0" aria-hidden="true" />
          When to contact your water supplier
        </h2>
        <div className="card p-4 border-l-2 border-danger">
          <p className="text-base text-body leading-relaxed">{problem.whenToContact}</p>
        </div>

        {/* Related contaminants */}
        {problem.relatedContaminants.length > 0 && (
          <>
            <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
              Related contaminants
            </h2>
            <p className="text-sm text-muted mb-3">
              These contaminants may be associated with this symptom. Check postcode-level data on our contaminant pages.
            </p>
            <div className="flex flex-wrap gap-2">
              {problem.relatedContaminants.map((name) => {
                const slug = CONTAMINANT_SLUG_MAP[name];
                if (slug) {
                  return (
                    <Link
                      key={name}
                      href={`/contaminant/${slug}/`}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium border border-rule text-body hover:text-accent hover:border-accent transition-colors"
                    >
                      {name}
                    </Link>
                  );
                }
                return (
                  <span
                    key={name}
                    className="inline-flex items-center px-3 py-1.5 text-sm text-body border border-rule"
                  >
                    {name}
                  </span>
                );
              })}
            </div>
          </>
        )}

        {/* CTA */}
        <div className="card p-5 mt-10 bg-[var(--color-surface-raised)]">
          <h2 className="font-display text-lg italic text-ink mb-3">
            Check what&apos;s in your water
          </h2>
          <p className="text-sm text-body leading-relaxed mb-4">
            Enter your postcode to see contaminant data for your area. Our reports cover{" "}
            <Link href="/contaminant/" className="text-accent hover:underline">
              50+ contaminants
            </Link>{" "}
            including lead, chlorine, nitrates, PFAS, and more.
          </p>
          <PostcodeSearch size="sm" />
        </div>

        {/* Related links */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          More guides
        </h2>
        <ul className="space-y-2 text-base text-body leading-relaxed">
          <li className="flex gap-2">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0" aria-hidden="true" />
            <Link href="/guides/water-problems/" className="text-accent hover:underline">
              All tap water problems — full troubleshooting hub
            </Link>
          </li>
          <li className="flex gap-2">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0" aria-hidden="true" />
            <Link href="/filters/" className="text-accent hover:underline">
              Best water filters in the UK — independent reviews
            </Link>
          </li>
          <li className="flex gap-2">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0" aria-hidden="true" />
            <Link href="/guides/best-water-filters-uk/" className="text-accent hover:underline">
              How to choose the right water filter for your home
            </Link>
          </li>
        </ul>

      </div>
    </div>
  );
}
