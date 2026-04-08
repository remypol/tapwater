import Link from "next/link";
import type { Metadata } from "next";
import { PostcodeSearch } from "@/components/postcode-search";
import { FAQSchema, ArticleSchema } from "@/components/json-ld";
import { ProductCard } from "@/components/product-card";
import { getProductIncludingUnavailable } from "@/lib/products";
import { AlertTriangle, ShieldCheck, BookOpen, Droplets } from "lucide-react";

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  const year = new Date().getFullYear();
  return {
    title: `Can Tap Water Make Eczema Worse? Hard Water, Chlorine & Skin (${year})`,
    description:
      "University of Sheffield research found hard water damages the skin barrier. What UK water does to eczema, and what you can do about it.",
    alternates: {
      canonical: "https://www.tapwater.uk/guides/water-and-eczema",
    },
    openGraph: {
      title: `Can Tap Water Make Eczema Worse? Hard Water & Chlorine (${year})`,
      description:
        "Research from Sheffield and King's College London links hard water to a damaged skin barrier. Here is what you need to know.",
      url: "https://www.tapwater.uk/guides/water-and-eczema",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `Can Tap Water Make Eczema Worse? Hard Water & Chlorine (${year})`,
      description:
        "Hard water damages the skin barrier. Chlorine strips natural oils. Here is what the research shows and what helps.",
    },
  };
}

export default function WaterAndEczemaGuide() {
  const jolieProduct = getProductIncludingUnavailable("jolie-filtered-showerhead");
  const aquablissProduct = getProductIncludingUnavailable("aquabliss-sf220");

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <FAQSchema
        faqs={[
          {
            question: "Does hard water cause eczema?",
            answer:
              "Hard water does not cause eczema directly, but research from the University of Sheffield and King's College London has found that hard water damages the skin barrier, which can trigger flare-ups in people who already have eczema. The calcium and magnesium deposits in hard water irritate sensitive skin and reduce its ability to retain moisture. Around 60% of the UK lives in hard or very hard water areas.",
          },
          {
            question: "Can a shower filter help eczema?",
            answer:
              "A shower filter can help if chlorine sensitivity is contributing to your symptoms. Shower filters with KDF-55 or vitamin C media remove 90%+ of free chlorine. Many people with eczema report improvement in skin comfort after switching to a filtered showerhead. However, shower filters do not remove hardness minerals — if hard water is the main cause, you need a water softener.",
          },
          {
            question: "Is soft water better for eczema?",
            answer:
              "The evidence suggests yes, particularly for children. A clinical trial called SWET (Softened Water Eczema Trial) found that soft water reduced eczema severity in some children, though the effect was not dramatic enough to be statistically significant across the whole group. Anecdotally, many families in hard water areas report significant improvement after installing a water softener. Soft water also requires less soap and shampoo, which can reduce irritant exposure further.",
          },
          {
            question: "Should I see a dermatologist?",
            answer:
              "Yes, if your eczema is persistent, severe, or affecting your quality of life. A dermatologist can identify triggers, prescribe topical treatments, and advise on whether water quality is likely to be a significant factor in your case. Changing your shower water may help, but it is one piece of a larger picture that includes emollients, washing products, fabrics, and stress management.",
          },
        ]}
      />
      <div className="max-w-3xl mx-auto">

        {/* Breadcrumb */}
        <nav className="text-sm text-muted mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li><Link href="/" className="hover:text-accent transition-colors">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/guides" className="hover:text-accent transition-colors">Guides</Link></li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-ink" aria-current="page">Water and Eczema</li>
          </ol>
        </nav>

        <ArticleSchema
          headline="Can Tap Water Make Eczema Worse?"
          description="University of Sheffield and King's College London research found that hard water damages the skin barrier. Here is what the science shows about hard water, chlorine, and eczema — and what you can do about it."
          url="https://www.tapwater.uk/guides/water-and-eczema"
          datePublished="2026-04-08"
          dateModified={new Date().toISOString().split("T")[0]}
          authorName="Remy"
          authorUrl="https://www.tapwater.uk/about"
        />

        {/* H1 */}
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Can Tap Water Make Eczema Worse?
        </h1>
        <div className="flex items-center gap-2 mt-3 mb-8 text-sm text-muted">
          <span>By <span className="text-ink font-medium">Remy</span></span>
          <span>·</span>
          <time dateTime={new Date().toISOString().split("T")[0]}>Updated {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</time>
          <span>·</span>
          <span>Independent research</span>
        </div>

        {/* Opening */}
        <p className="text-base text-body leading-relaxed mb-4">
          Around one in five children in the UK has eczema, and it affects a significant number of adults too. If you live in London, the South East, or any of the many hard water areas across England, you may have noticed that your skin flares up more than friends in different parts of the country. That is not coincidence.
        </p>
        <p className="text-base text-body leading-relaxed">
          The relationship between tap water and eczema is real, it is documented in peer-reviewed research, and it involves two distinct mechanisms: the hardness of the water — specifically its calcium and magnesium content — and the chlorine added as a disinfectant. Understanding which matters more in your case points towards very different solutions.
        </p>

        {/* Hard water and the skin barrier */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" aria-hidden="true" />
          The hard water and eczema connection
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Hard water contains dissolved calcium and magnesium — minerals that come from the rock the water passes through before it reaches the treatment works. In soft water areas, typically upland regions in Wales, Scotland, the north of England, and parts of the South West, there is little of this dissolved mineral content. In hard water areas — which cover most of England including all of London, the South East, East Anglia, the Midlands, and Yorkshire — mineral levels are significantly higher.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          Researchers at the University of Sheffield and King&apos;s College London have found that hard water damages the skin barrier. When hard water is left on the skin — after washing, showering, or bathing — the calcium deposits interact with the natural fats in the skin, disrupting the protective lipid layer. This leaves skin more permeable, more prone to drying out, and more susceptible to irritants and allergens penetrating the surface. For people with eczema, whose skin barrier is already compromised, this is a meaningful aggravating factor.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          A 2017 study published in the Journal of Investigative Dermatology found that children living in hard water areas were 87% more likely to have eczema at age one than those living in soft water areas. A subsequent clinical trial — the SWET trial — tested whether installing water softeners in the homes of children with eczema improved their symptoms. The results were encouraging for families, with many reporting improvement, though the trial was not powered to show a statistically significant effect across the full group. The research remains ongoing.
        </p>
        <div className="card p-5 mt-2">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-faint uppercase tracking-wider mb-1">UK children with eczema</p>
              <p className="font-data text-lg font-bold text-ink">1 in 5</p>
              <p className="text-xs text-muted mt-1">Highest rates in hard water areas</p>
            </div>
            <div>
              <p className="text-xs text-faint uppercase tracking-wider mb-1">UK in hard water</p>
              <p className="font-data text-lg font-bold text-warning">~60%</p>
              <p className="text-xs text-muted mt-1">Mostly England and lowland areas</p>
            </div>
            <div>
              <p className="text-xs text-faint uppercase tracking-wider mb-1">Risk increase (hard vs soft)</p>
              <p className="font-data text-lg font-bold text-danger">+87%</p>
              <p className="text-xs text-muted mt-1">Eczema at age 1 (Sheffield study)</p>
            </div>
          </div>
        </div>

        {/* Chlorine and skin */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <Droplets className="w-5 h-5 text-accent shrink-0" aria-hidden="true" />
          Chlorine and skin sensitivity
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          All UK water companies add chlorine or chloramine to drinking water as a disinfectant. This is essential — it kills bacteria and keeps water safe from the treatment works to your tap. The concentrations used are well within safety limits and cause no harm to most people. But for those with sensitive skin or eczema, daily exposure to chlorinated water in the shower can strip the natural oils that protect the skin, leaving it drier and more reactive.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          This is not the same as a chlorine allergy — true chlorine allergy is extremely rare. What most people describe as a chlorine reaction is an irritant response: the detergent-like effect of chlorine on the skin&apos;s lipid layer, repeated daily. People with atopic dermatitis are more sensitive to this because their skin barrier is already partially impaired.
        </p>
        <p className="text-base text-body leading-relaxed">
          Chlorine levels in tap water vary by supplier and by how far your home is from the treatment works — properties further away in the network tend to receive water with lower residual chlorine. If you notice a strong chlorine smell from your shower, your supply is likely at the higher end. A shower filter addresses this specifically and is a low-cost intervention worth trying before committing to a whole-house solution.
        </p>

        {/* Hardness checker */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          How hard is your water?
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Water hardness is measured in milligrams of calcium carbonate per litre (mg/L CaCO3). Soft water is below 60 mg/L, moderate hardness is 60–120 mg/L, hard water is 120–180 mg/L, and very hard water is above 180 mg/L. London tap water typically measures 250–300 mg/L — among the hardest in the UK. Much of the South East is similarly hard.
        </p>
        <p className="text-base text-body leading-relaxed mb-6">
          Check your exact area on the{" "}
          <Link href="/hardness" className="text-accent hover:underline font-medium">UK water hardness map</Link>{" "}— enter your postcode to see your hardness level and how it compares to the national average. Your postcode report also includes a full water quality summary.
        </p>
        <div className="card p-5">
          <p className="text-sm font-medium text-ink mb-3">Check water hardness for your postcode</p>
          <PostcodeSearch size="sm" />
          <p className="text-xs text-faint mt-3">
            See hardness level, safety score, and detected contaminants for any UK postcode.
          </p>
        </div>

        {/* Shower filters */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          Shower filters for eczema
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          If chlorine is a significant irritant for your skin, a shower filter is the most targeted and affordable solution. KDF-55 (a copper-zinc alloy medium) and vitamin C (ascorbic acid) filters both neutralise free chlorine in shower water. KDF-55 is the most common technology in shower filter showerheads; vitamin C filters are used in some inline designs and are particularly effective at removing chloramine as well as chlorine.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          Shower filters do not remove hardness minerals — calcium and magnesium ions are not affected by KDF or carbon filtration. If hard water is your primary concern, a shower filter will not significantly reduce limescale or the mineral deposits that affect your skin barrier. That requires a water softener.
        </p>

        {jolieProduct && (
          <div className="mt-4 mb-4">
            <ProductCard
              product={jolieProduct}
              highlight="Premium option — KDF-55 filtration in a brushed-steel design"
              pageType="guide-eczema"
            />
          </div>
        )}
        {aquablissProduct && (
          <div className="mt-4">
            <ProductCard
              product={aquablissProduct}
              highlight="Budget option — multi-stage filtration at a fraction of the cost"
              pageType="guide-eczema"
            />
          </div>
        )}

        <p className="text-base text-body leading-relaxed mt-6">
          For a full comparison of shower filter options, see our{" "}
          <Link href="/guides/best-shower-filter-uk" className="text-accent hover:underline font-medium">best shower filter guide</Link>.
        </p>

        {/* Whole-house solutions */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-safe shrink-0" aria-hidden="true" />
          Whole-house solutions for severe cases
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          For families with severe eczema who live in hard water areas, a whole-house water softener is the most comprehensive approach. A water softener uses ion exchange resin to swap the calcium and magnesium ions responsible for hardness with sodium ions. The result is soft water from every tap and shower throughout the home, with none of the mineral deposits that aggravate sensitive skin.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The main drawbacks are cost — a quality installed softener runs £800 to £2,500 — and the requirement for a plumber to install it and ongoing salt top-ups. Softened water is also slightly higher in sodium, which means it is not recommended for drinking in homes with very young babies, and some people find it leaves a slightly slippery feel on skin. Most households use a separate unsoftened drinking water tap.
        </p>
        <p className="text-base text-body leading-relaxed">
          See our{" "}
          <Link href="/guides/best-water-softener-uk" className="text-accent hover:underline font-medium">best water softener guide</Link>{" "}for a full comparison of the leading UK models, including which areas benefit most. You can also check your hardness level on the{" "}
          <Link href="/guides/water-hardness-map" className="text-accent hover:underline font-medium">UK water hardness map</Link>{" "}to see whether your area justifies the investment.
        </p>

        {/* FAQ */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-faint shrink-0" aria-hidden="true" />
          Frequently asked questions
        </h2>
        <div className="space-y-6">
          {[
            {
              q: "Does hard water cause eczema?",
              a: "Hard water does not cause eczema on its own, but research from the University of Sheffield and King's College London has found it damages the skin barrier. This makes flare-ups more likely in people who already have eczema. Children in hard water areas are significantly more likely to develop eczema than those in soft water areas.",
            },
            {
              q: "Can a shower filter help eczema?",
              a: "A shower filter can help if chlorine sensitivity is part of the problem. Filters with KDF-55 or vitamin C media remove most free chlorine from shower water. Many eczema sufferers report improvement in skin comfort. However, shower filters do not remove hardness minerals — if limescale and hard water deposits are the main trigger, a water softener is the more effective solution.",
            },
            {
              q: "Is soft water better for eczema?",
              a: "Evidence suggests it helps, particularly for children. The SWET trial found many families reported improvement after installing softeners, and some studies show reduced eczema severity scores in soft water. Soft water also lets you use less soap and shampoo, which reduces overall irritant load on the skin.",
            },
            {
              q: "Should I see a dermatologist?",
              a: "Yes, if eczema is persistent or significantly affecting your daily life. A dermatologist can confirm the diagnosis, identify your specific triggers, and recommend treatments. Water quality is one potential factor among many — a specialist can help you work out how significant it is in your particular case.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="border-t border-rule pt-5">
              <h3 className="text-base font-semibold text-ink mb-2">{q}</h3>
              <p className="text-base text-body leading-relaxed">{a}</p>
            </div>
          ))}
        </div>

        {/* Related */}
        <div className="mt-10 pt-6 border-t border-rule">
          <p className="text-xs text-faint uppercase tracking-wider mb-3">Related guides</p>
          <ul className="space-y-2">
            {[
              { href: "/hardness", label: "UK Water Hardness Map — Check Your Postcode" },
              { href: "/guides/best-water-softener-uk", label: "Best Water Softeners UK" },
              { href: "/guides/best-shower-filter-uk", label: "Best Shower Filters UK" },
              { href: "/guides/water-hardness-map", label: "Water Hardness by Area" },
              { href: "/filters/shower", label: "All Shower Filters Reviewed" },
            ].map(({ href, label }) => (
              <li key={href} className="flex gap-2">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0" aria-hidden="true" />
                <Link href={href} className="text-accent hover:underline">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
