import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, AlertTriangle, Check, Star, ArrowUpRight, ShieldCheck, Search } from "lucide-react";
import { PostcodeSearch } from "@/components/postcode-search";
import { ProductCard } from "@/components/product-card";
import { ArticleSchema, BreadcrumbSchema, FAQSchema } from "@/components/json-ld";
import { getProductsByCategory } from "@/lib/products";

const year = new Date().getFullYear();

const FAQ_DATA = [
  {
    question: "Dip strip vs lab test — which should I use?",
    answer:
      "Dip strips (£13–£15) give you a quick snapshot in 2 minutes. They are good for a rough idea of hardness, pH, chlorine, and some metals. But the colour-matching is subjective and they cannot detect PFAS or microplastics. Lab tests (£80+) give you precise numbers for 50+ parameters including PFAS and heavy metals, analysed by an accredited laboratory. Use a dip strip first as a screening tool. If anything looks concerning, follow up with a lab test for confirmation before spending money on a filter.",
  },
  {
    question: "What should I test my water for?",
    answer:
      "At minimum: hardness (affects appliances and skin), pH (affects pipe corrosion), lead (common in older homes with lead pipes), chlorine (always present in UK mains water), and nitrate (elevated in agricultural areas). If you are concerned about specific contaminants like PFAS or heavy metals, you need a lab test — dip strips cannot detect PFAS. Alternatively, enter your postcode on TapWater.uk for free data on what your water company reports for your area.",
  },
  {
    question: "How do I take a proper water sample?",
    answer:
      "For dip strips: run the cold tap for 30 seconds to flush standing water from the pipes, then dip the strip directly into the flowing water. For lab tests: follow the kit instructions exactly — most require you to run the tap for 2 minutes, fill the provided bottles to the marked line without touching the inside, seal them immediately, and post within 24 hours. Temperature matters: keep the sample cool (not frozen) during transit. Morning samples before anyone uses water give the most revealing results for lead and bacteria.",
  },
  {
    question: "How often should I test my water?",
    answer:
      "For peace of mind, once a year with dip strips is sensible — especially if you have older plumbing. Test again after any plumbing work, if you notice a change in taste, colour, or smell, or if your area has had a water quality incident. Lab tests are typically a one-time investment to establish a baseline. If you live in an area our postcode tool flags for any contaminant, annual testing is worth the cost.",
  },
];

export function generateMetadata(): Metadata {
  return {
    title: `Best Water Testing Kit UK ${year} \u2014 Test Before You Filter`,
    description:
      "We analysed 2,800 UK postcodes — but your specific home could be different. Compare dip strips vs lab tests and find out what is actually in your water before buying a filter.",
    alternates: {
      canonical: "https://tapwater.uk/guides/best-water-testing-kit-uk/",
    },
    openGraph: {
      title: `Best Water Testing Kit UK (${year})`,
      description:
        "Compare dip strips vs lab tests. Find out what is in your water before spending money on a filter.",
      url: "https://tapwater.uk/guides/best-water-testing-kit-uk/",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `Best Water Testing Kit UK (${year})`,
      description:
        "Test your water before you buy a filter. Dip strips vs lab tests compared.",
    },
  };
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function ProductReview({
  product,
  heading,
  verdict,
  review,
  pros,
  cons,
  ctaLabel,
}: {
  product: ReturnType<typeof getProductsByCategory>[number];
  heading: string;
  verdict: string;
  review: string;
  pros: string[];
  cons: string[];
  ctaLabel?: string;
}) {
  return (
    <div className="card p-6 lg:p-8">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-display text-xl italic text-ink">{heading}</h3>
          <p className="text-sm text-muted mt-0.5">
            {product.brand} {product.model}
          </p>
        </div>
        <span className="font-data text-2xl font-bold text-ink">
          &pound;{product.priceGbp}
        </span>
      </div>

      <p className="text-xs font-medium text-accent mt-2">{verdict}</p>

      <p className="text-base text-body leading-relaxed mt-4">{review}</p>

      {/* Certifications */}
      {product.certifications.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {product.certifications.map((cert) => (
            <span
              key={cert}
              className="text-[10px] bg-gray-100 text-faint rounded px-1.5 py-0.5"
            >
              {cert}
            </span>
          ))}
        </div>
      )}

      {/* Pros / Cons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
        <div>
          <p className="text-xs font-medium text-safe uppercase tracking-wider mb-2">
            Pros
          </p>
          <ul className="space-y-1.5">
            {pros.map((p) => (
              <li
                key={p}
                className="flex items-start gap-1.5 text-sm text-body"
              >
                <Check className="w-3.5 h-3.5 text-safe shrink-0 mt-0.5" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-warning uppercase tracking-wider mb-2">
            Cons
          </p>
          <ul className="space-y-1.5">
            {cons.map((c) => (
              <li
                key={c}
                className="flex items-start gap-1.5 text-sm text-body"
              >
                <span className="w-3.5 h-3.5 shrink-0 mt-0.5 text-warning">
                  &ndash;
                </span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Rating + CTA */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-rule">
        <span className="flex items-center gap-1 text-sm text-muted">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          {product.rating.toFixed(1)} average rating
        </span>
        <a
          href={product.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="inline-flex items-center gap-1.5 bg-ink text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          {ctaLabel ?? "View deal"}
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function BestWaterTestingKitGuide() {
  const testingProducts = getProductsByCategory("testing_kit");
  const simplex = testingProducts.find((p) => p.id === "simplexhealth-17-in-1")!;
  const sjWave = testingProducts.find((p) => p.id === "sj-wave-16-in-1")!;
  const tapScore = testingProducts.find((p) => p.id === "tap-score-essential")!;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* ── Schema markup ────────────────────────────────────────────── */}
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://tapwater.uk" },
          { name: "Guides", url: "https://tapwater.uk/guides" },
          {
            name: "Best Water Testing Kit UK",
            url: "https://tapwater.uk/guides/best-water-testing-kit-uk/",
          },
        ]}
      />
      <ArticleSchema
        headline={`Best Water Testing Kit UK ${year} \u2014 Test Before You Filter`}
        description="Compare dip strips vs lab tests. Find out what is in your water before spending money on a filter."
        url="https://tapwater.uk/guides/best-water-testing-kit-uk/"
        datePublished="2026-04-05"
        dateModified={new Date().toISOString().split("T")[0]}
        authorName="Remy"
        authorUrl="https://tapwater.uk/about"
      />
      <FAQSchema faqs={FAQ_DATA} />

      <div className="max-w-3xl mx-auto">
        {/* ── Breadcrumb nav ───────────────────────────────────────── */}
        <nav className="text-sm text-muted mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-accent transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href="/guides"
                className="hover:text-accent transition-colors"
              >
                Guides
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-ink" aria-current="page">
              Best Water Testing Kit UK
            </li>
          </ol>
        </nav>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Best Water Testing Kit UK {year}
        </h1>
        <p className="font-display text-lg italic text-muted mt-1">
          Test before you filter
        </p>
        <div className="flex items-center gap-2 mt-3 mb-8 text-sm text-muted">
          <span>
            By <span className="text-ink font-medium">Remy</span>
          </span>
          <span>&middot;</span>
          <span>Updated April {year}</span>
        </div>

        <div className="prose-section">
          <p className="text-lg text-body leading-relaxed">
            Before you spend &pound;50 to &pound;500 on a water filter, spend
            &pound;13 finding out what is actually in your water. We see people
            buy reverse osmosis systems when a &pound;25 jug would have been
            enough — and others buy BRITA jugs when they have PFAS that only RO
            removes.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            Our postcode tool uses data from 2,800 UK postcodes and 1.6 million
            readings to show you what your water company reports. But your
            specific home could be different — especially if you have old lead
            pipes or live at the end of a long supply line. A testing kit tells
            you what is coming out of <em>your</em> tap.
          </p>
        </div>

        {/* ── Affiliate disclosure ─────────────────────────────────── */}
        <div className="bg-wash border border-rule rounded-xl p-4 mt-6 mb-8 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <p className="text-sm text-body">
            This guide contains affiliate links. If you buy through these links,
            we earn a small commission at no extra cost to you. This funds our
            independent water quality research.{" "}
            <Link
              href="/affiliate-disclosure"
              className="text-accent hover:underline"
            >
              Full disclosure
            </Link>
          </p>
        </div>

        {/* ── Quick picks ──────────────────────────────────────────── */}
        <div className="card-elevated rounded-2xl p-6 lg:p-8 mb-12">
          <h2 className="font-display text-xl italic text-ink mb-4">
            Quick picks
          </h2>
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-rule">
              <div>
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Best quick screen</p>
                <p className="font-display text-base italic text-ink mt-0.5">
                  {simplex.brand} {simplex.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  17 parameters in 2 minutes, cheapest option at &pound;13
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{simplex.priceGbp}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-rule">
              <div>
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Best for ongoing monitoring</p>
                <p className="font-display text-base italic text-ink mt-0.5">
                  {sjWave.brand} {sjWave.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  150 strips included, enough for monthly testing all year
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{sjWave.priceGbp}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Best for real answers</p>
                <p className="font-display text-base italic text-ink mt-0.5">
                  {tapScore.brand} {tapScore.model}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  ISO 17025 accredited lab, 50+ parameters including PFAS
                </p>
              </div>
              <span className="font-data text-lg font-bold text-ink shrink-0">
                &pound;{tapScore.priceGbp}
              </span>
            </div>
          </div>
        </div>

        {/* ── Free alternative: postcode tool ──────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-12 mb-4">
          Start here: check your postcode for free
        </h2>
        <p className="text-base text-body leading-relaxed">
          Before spending anything on a testing kit, try our free postcode tool.
          We pull data from the Environment Agency and water company compliance
          reports covering 2,800 UK postcode districts and 1.6 million
          individual readings. It will tell you what your water company reports
          for your area — including hardness, chlorine, lead, PFAS, and more.
        </p>
        <p className="text-base text-body leading-relaxed mt-3">
          A testing kit becomes valuable when you want to verify what is coming
          out of <em>your specific tap</em>, especially if you have older
          plumbing.
        </p>

        <div className="mt-8 card-elevated p-8 text-center rounded-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="font-display text-xl italic text-ink">
            Free water quality check
          </h3>
          <p className="text-base text-muted mt-2 max-w-md mx-auto">
            Enter your postcode. We will show you what your water company
            reports for your area — no testing kit needed.
          </p>
          <div className="mt-6 max-w-sm mx-auto">
            <PostcodeSearch />
          </div>
        </div>

        {/* ── Dip strips vs lab tests ──────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Dip strips vs lab tests: what is the difference?
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              Dip strips (&pound;13&ndash;&pound;15)
            </h3>
            <p className="text-base text-body leading-relaxed">
              You dip a paper strip into your tap water, wait 60 seconds, and
              compare the colour changes to a chart. Quick, cheap, and good
              enough for a rough screening. They test for hardness, pH,
              chlorine, lead, iron, copper, nitrate, and more. The limitation:
              colour matching is subjective (especially in poor lighting), and
              they cannot detect PFAS, microplastics, or pharmaceutical
              residues. Think of them as a screening tool, not a definitive
              answer.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              Lab tests (&pound;80+)
            </h3>
            <p className="text-base text-body leading-relaxed">
              You collect a water sample, post it to an accredited laboratory,
              and receive a detailed report with precise measurements for 50+
              parameters — including PFAS, heavy metals, bacteria, and volatile
              organic compounds. The Tap Score Essential test uses an ISO 17025
              accredited lab, which is the same standard used by professional
              water testing services. Results take 5&ndash;7 business days. If
              you need real numbers to make a filter purchasing decision, this is
              the only option that gives you them.
            </p>
          </div>
        </div>

        {/* ── What to look for ─────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          What to look for in a water testing kit
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              Number of parameters tested
            </h3>
            <p className="text-base text-body leading-relaxed">
              More is generally better, but only if the extra parameters are
              relevant. For UK mains water, you want at minimum: hardness, pH,
              chlorine, lead, and nitrate. If PFAS are a concern (check your
              postcode first), only a lab test will detect them.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              Accuracy and accreditation
            </h3>
            <p className="text-base text-body leading-relaxed">
              Dip strips give you a range (e.g., &ldquo;lead: 0&ndash;15
              ppb&rdquo;), not a precise number. That is fine for screening but
              not enough to make a confident filter decision. Lab tests from
              ISO 17025 accredited labs give you exact measurements with
              uncertainty ranges — the same standard that regulatory bodies use.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink text-lg mb-2">
              Number of strips included
            </h3>
            <p className="text-base text-body leading-relaxed">
              If you plan to test regularly (monthly or quarterly), you want a
              kit with multiple strips. The SJ WAVE includes 150 strips —
              enough for over two years of monthly testing. Single-use lab kits
              like the Tap Score are one-time tests.
            </p>
          </div>
        </div>

        {/* ── Product reviews ──────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          The three best water testing options for UK homes
        </h2>

        {/* Product cards at a glance */}
        <div className="space-y-4 mb-8">
          {testingProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              highlight={
                product.id === "simplexhealth-17-in-1"
                  ? "Best quick screen"
                  : product.id === "sj-wave-16-in-1"
                    ? "Best for ongoing monitoring"
                    : "Best for real answers"
              }
            />
          ))}
        </div>

        {/* Detailed reviews */}
        <div className="space-y-8">
          <ProductReview
            product={simplex}
            heading="SimplexHealth 17-in-1 \u2014 Best quick screen"
            verdict="The cheapest and fastest way to get a snapshot of your water."
            review="At £13, the SimplexHealth 17-in-1 is the obvious starting point. You get results for 17 parameters in about 2 minutes: hardness, pH, chlorine, lead, iron, copper, nitrate, nitrite, fluoride, and more. The colour-match system is straightforward in good lighting. It will not give you precise numbers — you are matching colours to a printed chart, which is inherently subjective. But it is accurate enough to flag obvious problems. If the strip shows elevated lead or high hardness, you know to investigate further with a lab test. If everything looks clean, you have peace of mind for £13."
            pros={[
              "Tests 17 parameters including lead, hardness, pH, and chlorine",
              "Results in 2 minutes — the fastest option here",
              "Just £13 — the cheapest way to screen your water",
              "No lab, no postage, no waiting for results",
            ]}
            cons={[
              "Colour matching is subjective — poor lighting makes it worse",
              "Cannot detect PFAS, microplastics, or pharmaceutical residues",
              "Only provides ranges, not precise measurements",
            ]}
            ctaLabel="View on Amazon"
          />

          <ProductReview
            product={sjWave}
            heading="SJ WAVE 16-in-1 \u2014 Best for ongoing monitoring"
            verdict="150 strips in the box — enough for monthly testing for two years."
            review="The SJ WAVE 16-in-1 tests one fewer parameter than the SimplexHealth, but the real selling point is quantity: 150 strips in the box, compared to the typical 10–15 you get from competitors. At £15 total, that works out to 10p per test. This makes it practical for monthly or even weekly monitoring. The colour chart is printed directly on the bottle label, which is convenient. One unique feature: it includes a bacteria test strip, though this requires a 48-hour incubation period and is the least reliable of the tests. For everything else — hardness, pH, chlorine, lead, iron — the results are comparable to the SimplexHealth."
            pros={[
              "150 strips included — 10p per test for regular monitoring",
              "16 parameters including bacteria (48-hour incubation)",
              "Colour chart printed on the bottle for easy reference",
              "Practical for monthly or quarterly ongoing testing",
            ]}
            cons={[
              "Bacteria test requires 48-hour incubation — not instant",
              "Same colour-matching limitations as all dip strips",
              "Cannot detect PFAS or pharmaceutical residues",
            ]}
            ctaLabel="View on Amazon"
          />

          <ProductReview
            product={tapScore}
            heading="Tap Score Essential \u2014 Best for real answers"
            verdict="The only option that gives you precise numbers from an accredited lab."
            review="The Tap Score Essential City Water Test is in a different league. You collect a sample, post it to an ISO 17025 accredited laboratory, and receive a detailed online report with precise measurements for 50+ parameters — including PFAS, all major heavy metals, bacteria, volatile organic compounds, and more. The online dashboard is excellent: it colour-codes each result against WHO and EPA guidelines and gives personalised health recommendations. At £80 it costs significantly more than dip strips, and results take 5–7 business days. But if you are trying to decide whether to invest £300–£500 in a reverse osmosis system, spending £80 to get definitive data first is the smart move. This is the test that tells you what filter you actually need."
            pros={[
              "ISO 17025 accredited lab — the gold standard for water testing",
              "50+ parameters including PFAS and heavy metals",
              "Online dashboard with personalised health recommendations",
              "Precise measurements, not subjective colour matching",
            ]}
            cons={[
              "£80 — significantly more expensive than dip strips",
              "Results take 5–7 business days via post",
              "One-time test — no strips for ongoing monitoring",
            ]}
            ctaLabel="View on Amazon"
          />
        </div>

        {/* ── No comparison table for testing kits ─────────────────── */}

        {/* ── Verdict ──────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Our verdict
        </h2>
        <div className="prose-section">
          <p className="text-base text-body leading-relaxed">
            Start with the free option:{" "}
            <Link href="/" className="text-accent hover:underline">
              check your postcode on TapWater.uk
            </Link>{" "}
            to see what your water company reports. If you want to verify what
            is coming out of your specific tap, grab the{" "}
            <strong className="text-ink">SimplexHealth 17-in-1</strong> for
            &pound;13 as a quick screen.
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            If your postcode flags PFAS, heavy metals, or elevated nitrate —
            or if you are considering a &pound;300+ filter purchase — invest in
            the{" "}
            <strong className="text-ink">
              Tap Score Essential lab test
            </strong>{" "}
            at &pound;80. Precise numbers from an accredited lab will tell you
            exactly which filter you need (and whether you need one at all).
          </p>
          <p className="text-base text-body leading-relaxed mt-4">
            For ongoing monitoring after you have installed a filter, the{" "}
            <strong className="text-ink">SJ WAVE 16-in-1</strong> at &pound;15
            for 150 strips is unbeatable value.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <a
            href={tapScore.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center justify-center gap-2 bg-ink text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Get the Tap Score lab test
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href={simplex.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center justify-center gap-2 border border-rule text-ink rounded-lg px-6 py-3 text-sm font-medium hover:bg-wash transition-colors"
          >
            Get the SimplexHealth strips (&pound;13)
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-6">
          Frequently asked questions
        </h2>
        <div className="space-y-6">
          {FAQ_DATA.map((faq) => (
            <div key={faq.question}>
              <h3 className="font-semibold text-ink text-base">{faq.question}</h3>
              <p className="text-sm text-body leading-relaxed mt-2">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        {/* ── Related links ────────────────────────────────────────── */}
        <h2 className="font-display text-2xl italic text-ink mt-14 mb-4">
          Related reading
        </h2>
        <div className="space-y-2">
          <Link
            href="/filters/testing-kits"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            All water testing kits we review
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Free postcode water quality check
          </Link>
          <Link
            href="/guides/best-water-filters-uk"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Best water filters UK (all categories)
          </Link>
        </div>

        {/* ── Affiliate disclosure footer ──────────────────────────── */}
        <footer className="mt-12 pb-4 text-sm text-faint leading-relaxed border-t border-rule pt-6">
          <p>
            Product recommendations last reviewed April {year}. Prices are
            approximate and may vary. Water quality data sourced from the
            Environment Agency and water company compliance reports covering
            2,800 UK postcode districts. We earn a commission from purchases
            made through affiliate links at no extra cost to you.{" "}
            <Link
              href="/affiliate-disclosure"
              className="underline underline-offset-2 hover:text-muted transition-colors"
            >
              Affiliate disclosure
            </Link>{" "}
            &middot;{" "}
            <Link
              href="/about/methodology"
              className="underline underline-offset-2 hover:text-muted transition-colors"
            >
              Our methodology
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
