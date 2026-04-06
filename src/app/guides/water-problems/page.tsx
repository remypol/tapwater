import Link from "next/link";
import type { Metadata } from "next";
import { PostcodeSearch } from "@/components/postcode-search";
import { FAQSchema, ArticleSchema, BreadcrumbSchema } from "@/components/json-ld";
import { WATER_PROBLEMS, PROBLEM_CATEGORIES } from "@/lib/water-problems";

const BASE_URL = "https://www.tapwater.uk";

export function generateMetadata(): Metadata {
  const year = new Date().getFullYear();
  return {
    title: `Tap Water Problems: What's Wrong With My Water? (${year})`,
    description:
      "Water tastes of chlorine? Looks cloudy or brown? Smells like rotten eggs? This guide explains the most common UK tap water problems and exactly what to do.",
    openGraph: {
      title: `Tap Water Problems: What's Wrong With My Water? (${year})`,
      description:
        "The most common UK tap water problems explained — taste, smell, colour, and pressure issues. Find out what's causing it and what to do.",
      url: `${BASE_URL}/guides/water-problems`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `Tap Water Problems: What's Wrong With My Water? (${year})`,
      description:
        "Cloudy water, chlorine taste, rotten egg smell, brown water — the most common UK tap water problems explained clearly.",
    },
  };
}

const CATEGORY_ICONS: Record<string, string> = {
  taste: "T",
  appearance: "A",
  smell: "S",
  pressure: "P",
};

const CATEGORY_ACCENT: Record<string, string> = {
  taste: "text-accent",
  appearance: "text-warning",
  smell: "text-safe",
  pressure: "text-danger",
};

export default function WaterProblemsHub() {
  const year = new Date().getFullYear();

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <FAQSchema
        faqs={[
          {
            question: "Why does my tap water taste of chlorine?",
            answer:
              "Water companies add chlorine to kill bacteria — it is a legal requirement. The taste is harmless. To reduce it, fill a jug and refrigerate for 30 minutes, or use an activated carbon filter jug.",
          },
          {
            question: "Why is my tap water cloudy or milky?",
            answer:
              "Cloudy or milky tap water is almost always caused by tiny air bubbles. Pour a glass and wait 30 seconds — if it clears from the bottom up, it's just air and completely harmless.",
          },
          {
            question: "Why is my tap water brown or discoloured?",
            answer:
              "Brown tap water is usually caused by iron or manganese deposits disturbed in water mains, often after maintenance work nearby. Do not drink it. Run the cold kitchen tap slowly for 15–20 minutes until it clears.",
          },
          {
            question: "Why does my tap water smell like rotten eggs?",
            answer:
              "A rotten egg smell from hot water is almost always caused by bacteria in your hot water cylinder. Raise the cylinder temperature to 60°C. If the cold tap is also affected, contact your water supplier immediately.",
          },
        ]}
      />

      <BreadcrumbSchema
        items={[
          { name: "Home", url: `${BASE_URL}/` },
          { name: "Guides", url: `${BASE_URL}/guides/` },
          { name: "Water Problems", url: `${BASE_URL}/guides/water-problems/` },
        ]}
      />

      <ArticleSchema
        headline={`Tap Water Problems: What's Wrong With My Water? (${year})`}
        description="The most common UK tap water problems explained — taste, smell, colour, and pressure issues. Find out what's causing it and what to do."
        url={`${BASE_URL}/guides/water-problems`}
        datePublished="2026-04-06"
        dateModified={new Date().toISOString().split("T")[0]}
        authorName="Remy"
        authorUrl={`${BASE_URL}/about`}
      />

      <div className="max-w-3xl mx-auto">

        {/* Breadcrumb */}
        <nav className="text-sm text-muted mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li><Link href="/" className="hover:text-accent transition-colors">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/guides" className="hover:text-accent transition-colors">Guides</Link></li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-ink" aria-current="page">Water Problems</li>
          </ol>
        </nav>

        {/* H1 */}
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Having problems with your tap water?
        </h1>
        <div className="flex items-center gap-2 mt-3 mb-8 text-sm text-muted">
          <span>By <span className="text-ink font-medium">Remy</span></span>
          <span>·</span>
          <time dateTime={new Date().toISOString().split("T")[0]}>
            Updated {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </time>
          <span>·</span>
          <span>Independent research</span>
        </div>

        <p className="text-base text-body leading-relaxed mb-4">
          Most tap water issues have simple explanations and straightforward fixes. Cloudy water is almost always harmless air bubbles. A chlorine taste is legal and expected. Brown water usually clears in minutes. This guide covers every common UK tap water problem — what&apos;s causing it, whether it&apos;s safe, and exactly what to do.
        </p>
        <p className="text-base text-body leading-relaxed mb-10">
          Select the type of problem you&apos;re experiencing below, or{" "}
          <Link href="#all-problems" className="text-accent hover:underline font-medium">
            see the full list
          </Link>{" "}
          of symptom guides.
        </p>

        {/* Category grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {PROBLEM_CATEGORIES.map((cat) => {
            const problems = WATER_PROBLEMS.filter((p) => p.category === cat.id);
            return (
              <div key={cat.id} className="card p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-data text-xs font-bold uppercase tracking-widest border border-current px-1.5 py-0.5 ${CATEGORY_ACCENT[cat.id]}`}
                  >
                    {CATEGORY_ICONS[cat.id]}
                  </span>
                  <span className="font-semibold text-ink text-sm">{cat.label}</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">{cat.description}</p>
                <ul className="space-y-1.5 mt-auto">
                  {problems.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/guides/water-problems/${p.slug}/`}
                        className="text-xs text-accent hover:underline leading-snug block"
                      >
                        {p.symptom}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* All problems list */}
        <h2
          id="all-problems"
          className="font-display text-xl italic mt-10 mb-6 text-ink"
        >
          All tap water problem guides
        </h2>

        <div className="space-y-3">
          {WATER_PROBLEMS.map((problem) => {
            const cat = PROBLEM_CATEGORIES.find((c) => c.id === problem.category);
            return (
              <Link
                key={problem.slug}
                href={`/guides/water-problems/${problem.slug}/`}
                className="card p-4 flex items-start gap-4 hover:border-accent/50 transition-colors group block"
              >
                <span
                  className={`font-data text-xs font-bold uppercase tracking-widest border border-current px-1.5 py-0.5 shrink-0 mt-0.5 ${CATEGORY_ACCENT[problem.category]}`}
                >
                  {CATEGORY_ICONS[problem.category]}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink text-sm group-hover:text-accent transition-colors">
                    {problem.title}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{problem.symptom}</p>
                  {cat && (
                    <p className="text-xs text-faint mt-0.5 capitalize">{cat.label} issue</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Common questions callout */}
        <div className="card p-5 mt-10 bg-[var(--color-surface-raised)]">
          <h2 className="font-display text-lg italic text-ink mb-3">
            Not sure what category your problem is?
          </h2>
          <p className="text-sm text-body leading-relaxed mb-4">
            If your water looks, smells, or tastes wrong — or if your pressure has changed suddenly — enter your postcode below. We&apos;ll show you what has been detected in your area, which can help narrow down the cause.
          </p>
          <PostcodeSearch size="sm" />
          <p className="text-xs text-faint mt-3">
            Covers{" "}
            <Link href="/contaminant/" className="text-accent hover:underline">
              50+ contaminants
            </Link>{" "}
            across 220 postcode districts in England, Wales, and Scotland.
          </p>
        </div>

        {/* Related guides */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          Related guides
        </h2>
        <ul className="space-y-2 text-base text-body leading-relaxed">
          <li className="flex gap-2">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0" aria-hidden="true" />
            <Link href="/guides/lead-pipes-uk/" className="text-accent hover:underline">
              The UK&apos;s lead pipe problem — which areas are most affected?
            </Link>
          </li>
          <li className="flex gap-2">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0" aria-hidden="true" />
            <Link href="/guides/water-hardness-map/" className="text-accent hover:underline">
              UK water hardness map
            </Link>
          </li>
          <li className="flex gap-2">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0" aria-hidden="true" />
            <Link href="/guides/how-to-test-your-water/" className="text-accent hover:underline">
              How to test your tap water at home
            </Link>
          </li>
          <li className="flex gap-2">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0" aria-hidden="true" />
            <Link href="/filters/" className="text-accent hover:underline">
              Best UK water filters — independent reviews
            </Link>
          </li>
        </ul>

      </div>
    </div>
  );
}
