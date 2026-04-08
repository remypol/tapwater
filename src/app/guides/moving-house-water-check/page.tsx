import Link from "next/link";
import type { Metadata } from "next";
import { PostcodeSearch } from "@/components/postcode-search";
import { FAQSchema, ArticleSchema } from "@/components/json-ld";
import { AlertTriangle, BookOpen, MapPin } from "lucide-react";

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  const year = new Date().getFullYear();
  return {
    title: `Moving House? Check Your New Area's Water Quality (${year})`,
    description:
      "Water quality varies dramatically by postcode in the UK. Check hardness, PFAS, lead, and safety score for any UK address before you move.",
    alternates: {
      canonical: "https://www.tapwater.uk/guides/moving-house-water-check",
    },
    openGraph: {
      title: `Moving House? Check Your New Area's Water Quality (${year})`,
      description:
        "Different water companies, different source water, different pipes. A 10-minute drive can mean completely different tap water.",
      url: "https://www.tapwater.uk/guides/moving-house-water-check",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `Moving House? Check Your New Area's Water Quality (${year})`,
      description:
        "Hard water in the South East, old lead pipes in Victorian homes, PFAS near industrial sites. Know before you move.",
    },
  };
}

export default function MovingHouseWaterCheckGuide() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <FAQSchema
        faqs={[
          {
            question: "Does water quality really vary that much across the UK?",
            answer:
              "Yes, significantly. England alone has ten major water companies serving different regions, each drawing from different sources — reservoirs, rivers, boreholes — and using different treatment processes. Hardness varies from below 30 mg/L in parts of Scotland and Wales to above 300 mg/L in London. Lead pipe prevalence varies by the age of the housing stock. PFAS contamination is clustered around specific industrial sites and airports. These differences are real, measurable, and matter for health and household planning.",
          },
          {
            question: "Should I test my water after moving?",
            answer:
              "If your postcode report shows elevated contaminants — particularly lead — it is worth testing your specific tap rather than relying on area-level averages. Area monitoring data reflects what is coming through the network, but lead specifically is added at the property level by your internal plumbing. A lab test for lead costs £30–£80 and gives you a precise reading from your tap. Your water company may offer free testing for lead — contact them to ask.",
          },
          {
            question: "Can I improve my water quality?",
            answer:
              "Yes, with the right filter for the right problem. For lead: an NSF/ANSI 53-certified carbon block filter or a reverse osmosis system removes 90–99% at the tap. For hardness and limescale: a water softener removes calcium and magnesium from the whole supply. For chlorine taste and smell: a simple carbon jug filter or tap filter makes a noticeable difference. For PFAS: reverse osmosis is the most effective option. The key is matching the solution to what is actually in your water.",
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
            <li className="font-medium text-ink" aria-current="page">Moving House Water Check</li>
          </ol>
        </nav>

        <ArticleSchema
          headline="Moving House? Check Your New Area's Water Quality"
          description="Water quality varies dramatically by postcode in the UK — different companies, different source water, different infrastructure. Here is what to check before you move and what to do if you do not like what you find."
          url="https://www.tapwater.uk/guides/moving-house-water-check"
          datePublished="2026-04-08"
          dateModified={new Date().toISOString().split("T")[0]}
          authorName="Remy"
          authorUrl="https://www.tapwater.uk/about"
        />

        {/* H1 */}
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Moving House? Check Your New Area&apos;s Water Quality
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
          When you move house, you think about schools, commute times, council tax, and broadband speeds. Water quality rarely makes the list — but it probably should. The water coming out of your taps will be different in your new home. Sometimes significantly different. It affects how your tea tastes, how quickly limescale builds up in your kettle, whether your skin feels dry after a shower, and — at the more serious end — whether there are contaminants you need to filter out.
        </p>
        <p className="text-base text-body leading-relaxed">
          A postcode check takes about two minutes and tells you everything you need to know before you move in.
        </p>

        {/* Why water quality varies */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <MapPin className="w-5 h-5 text-accent shrink-0" aria-hidden="true" />
          Why water quality varies by postcode
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          The UK has ten major water companies serving different regions, plus several smaller suppliers. Each draws water from different sources: some rely on upland reservoirs in Wales, Scotland, or the Pennines; others pump water from rivers or treat water from boreholes that tap into chalk aquifers. The geology and environment around those sources determines the natural chemistry of the water — its hardness, trace mineral content, and background levels of agricultural contaminants like nitrate.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          Beyond the source water, each company uses different treatment processes, different disinfection approaches, and manages a distribution network of different age and condition. Chlorine levels are set at the treatment works but fall as the water travels through the network — so a home near a treatment works will receive slightly more residual chlorine than one at the far end of the distribution zone.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          Then there is the infrastructure at the property itself. A Victorian terraced house in inner London may have lead service pipes connecting it to the main. A modern new-build ten miles away will have copper or plastic plumbing throughout. Same water company, same source water — completely different contaminant profile at the tap.
        </p>
        <p className="text-base text-body leading-relaxed">
          All of this means that moving house — even a short distance — can result in meaningfully different water. Moving from Manchester to London is not subtle: you will go from relatively soft water (around 60–80 mg/L hardness) to some of the hardest water in the country (250–300 mg/L). But even moving within the same city can cross a water company boundary or put you in a catchment served by a different source.
        </p>

        {/* What to check before moving */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" aria-hidden="true" />
          What to check before moving
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          There are five things worth looking at for any property you are seriously considering:
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Safety score</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          The TapWater.uk safety score summarises how an area performs across all monitored contaminants — a number from 0 to 100 where 100 means all contaminants are well within regulatory limits. A score below 85 indicates one or more contaminants detected at levels worth investigating. Click through to see exactly what is driving the score.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Contaminants flagged</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          The postcode report lists any contaminants detected above background levels in monitoring data for the area. Lead, nitrate, PFAS, chlorine, and manganese are the most commonly flagged. Each contaminant links through to a detail page explaining what the levels mean, what the regulatory limit is, and what health effects — if any — are associated with the concentrations found.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">PFAS status</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          PFAS contamination is localised — it clusters around airports, military bases, firefighting training sites, and certain industrial areas. If the property is near one of these, it is worth checking specifically. Our PFAS data covers known hotspots across the UK. A postcode in a clean area will show no PFAS detection; one near a contaminated site may show levels above the new UK guideline.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Hardness level</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          If you are moving from a soft water area to a hard water area — or vice versa — you will notice immediately. Hard water leaves limescale on kettles, showers, and taps; requires more washing powder and soap; and can affect skin and hair. The postcode report shows hardness in mg/L CaCO3 and classifies it as soft, moderate, hard, or very hard.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Water supplier</h3>
        <p className="text-base text-body leading-relaxed">
          The postcode report tells you which water company supplies the area. It is worth knowing who your supplier will be — their customer service record, their current infrastructure investment programme, and whether they are in an area affected by any ongoing compliance issues or enforcement notices from the Drinking Water Inspectorate.
        </p>

        {/* Postcode CTA */}
        <div className="card p-6 mt-8">
          <p className="font-display text-xl italic text-ink mb-1">Check your new postcode</p>
          <p className="text-sm text-muted mb-5">Enter the postcode for the property you are moving to. See the safety score, hardness, PFAS status, and any flagged contaminants.</p>
          <PostcodeSearch size="sm" />
          <p className="text-xs text-faint mt-3">
            Covers{" "}
            <Link href="/contaminant/lead" className="text-accent hover:underline">lead</Link>,{" "}
            <Link href="/contaminant/chlorine" className="text-accent hover:underline">chlorine</Link>,{" "}
            hardness, PFAS, nitrate, and 50+ other contaminants.
          </p>
        </div>

        {/* Common surprises */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          Common surprises when moving house
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Certain moves come with predictable water quality changes that are worth knowing in advance.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Moving to London or the South East: limescale</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          London and the surrounding counties are served by water drawn from rivers and the chalk aquifer, which gives it exceptionally high hardness — typically 250–320 mg/L. If you are moving from the North, Scotland, or Wales, this will be immediately noticeable. Kettles fur up fast. Shower screens streak white. Boiler efficiency drops over time. A water softener or a water descaler (a non-salt alternative that changes how minerals behave rather than removing them) is something many households in these areas invest in.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Moving into a pre-1970 home: lead pipes</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          Homes built before 1970 — and particularly those built before 1940 — are likely to have lead service pipes running from the street into the property. This is not visible and does not affect the colour, smell, or taste of the water, but it means lead can dissolve into water that has been sitting in contact with the pipe overnight. The risk is highest in soft water areas (where the water is more corrosive) and for households with young children or during pregnancy.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          Run the cold kitchen tap for 30 seconds each morning before drinking. Your postcode report will show whether lead has been detected in environmental monitoring for the area. Our{" "}
          <Link href="/guides/lead-pipes-uk" className="text-accent hover:underline font-medium">lead pipes guide</Link>{" "}explains the full picture and what pipe replacement involves.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Different taste: chlorine levels by supplier</h3>
        <p className="text-base text-body leading-relaxed">
          UK water companies add different amounts of chlorine — within the same regulatory limits — and some use chloramine rather than free chlorine. The taste and smell of tap water varies noticeably between suppliers. Chlorine taste is usually strongest close to the treatment works and fades with distance. A simple carbon jug filter or tap filter removes chlorine effectively and is usually the first thing people buy when they find the taste of new-area water off-putting.
        </p>

        {/* What to do with poor water */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          What to do if your new area has concerns
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          The right approach depends on what the postcode report shows. Different contaminants need different solutions.
        </p>

        <div className="card p-5 mt-2 space-y-4">
          <div className="flex gap-4">
            <div className="shrink-0 w-1 rounded-full bg-danger self-stretch" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-ink mb-1">Lead detected</p>
              <p className="text-sm text-body">A{" "}
                <Link href="/contaminant/lead" className="text-accent hover:underline">reverse osmosis system</Link>{" "}or NSF/ANSI 53-certified carbon block filter removes 90–99% of lead at the tap. Run the tap 30 seconds before drinking as an immediate measure. Consider{" "}
                <Link href="/guides/how-to-test-your-water" className="text-accent hover:underline">testing your tap specifically</Link>{" "}for accurate readings.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="shrink-0 w-1 rounded-full bg-warning self-stretch" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-ink mb-1">Hard water area</p>
              <p className="text-sm text-body">A water softener is the comprehensive solution — it removes hardness minerals throughout the whole house. For a lower-cost start, a{" "}
                <Link href="/filters" className="text-accent hover:underline">jug filter</Link>{" "}improves drinking water taste, and a shower filter reduces mineral exposure on skin.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="shrink-0 w-1 rounded-full bg-accent self-stretch" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-ink mb-1">Chlorine taste</p>
              <p className="text-sm text-body">A carbon jug filter (BRITA, Aqua Optima) or a tap-mounted filter removes chlorine instantly. Inexpensive and effective for taste improvement, though it does not address other contaminants.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="shrink-0 w-1 rounded-full bg-danger self-stretch" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-ink mb-1">PFAS detected</p>
              <p className="text-sm text-body">Reverse osmosis is the most effective technology for PFAS removal — it reduces PFAS by 90–99% depending on the specific compounds. Carbon block filters offer partial reduction. See our{" "}
                <Link href="/filters" className="text-accent hover:underline">filter comparison pages</Link>{" "}for certified options.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-faint shrink-0" aria-hidden="true" />
          Frequently asked questions
        </h2>
        <div className="space-y-6">
          {[
            {
              q: "Does water quality really vary that much across the UK?",
              a: "Yes, significantly. England alone has ten major water companies serving different regions, each drawing from different sources. Hardness varies from below 30 mg/L in parts of Scotland and Wales to above 300 mg/L in London. Lead pipe prevalence varies by housing age. PFAS contamination clusters around specific sites. These differences are real, measurable, and matter for health and household planning.",
            },
            {
              q: "Should I test my water after moving?",
              a: "If your postcode report shows elevated lead, it is worth testing your specific tap rather than relying on area-level averages. Lead in drinking water comes from the property's own plumbing, not from the network — so area data is only a guide. A lab test for lead costs £30–£80. Your water company may offer free testing — contact them to ask.",
            },
            {
              q: "Can I improve my water quality?",
              a: "Yes, with the right filter for the right problem. For lead: an NSF/ANSI 53-certified filter or reverse osmosis removes 90–99%. For hardness: a water softener removes calcium and magnesium from the whole supply. For chlorine taste: a simple carbon jug filter makes a noticeable difference. For PFAS: reverse osmosis is the most effective option. Match the solution to what is actually in your water.",
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
              { href: "/guides/lead-pipes-uk", label: "UK Lead Pipes: Which Areas Are Most Affected" },
              { href: "/hardness", label: "UK Water Hardness Map" },
              { href: "/guides/how-to-test-your-water", label: "How to Test Your Tap Water" },
              { href: "/contaminant/lead", label: "Lead in UK Water: Postcode Data" },
              { href: "/contaminant/chlorine", label: "Chlorine in UK Water" },
              { href: "/filters", label: "All Water Filters Compared" },
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
