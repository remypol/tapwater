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
    title: `Water Quality and Pregnancy: What You Need to Know (${year})`,
    description:
      "Lead, nitrate, and PFAS in tap water during pregnancy. What the NHS says, what the science shows, and how to check your postcode.",
    alternates: {
      canonical: "https://www.tapwater.uk/guides/water-quality-pregnancy",
    },
    openGraph: {
      title: `Water Quality and Pregnancy: What You Need to Know (${year})`,
      description:
        "Lead crosses the placenta. Nitrate can affect oxygen in the blood. Here is what pregnant women need to know about UK tap water.",
      url: "https://www.tapwater.uk/guides/water-quality-pregnancy",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `Water Quality and Pregnancy: What You Need to Know (${year})`,
      description:
        "What the NHS recommends, which contaminants matter most, and how to filter your water during pregnancy.",
    },
  };
}

export default function WaterQualityPregnancyGuide() {
  const roProduct = getProductIncludingUnavailable("waterdrop-g3p600");

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <FAQSchema
        faqs={[
          {
            question: "Is UK tap water safe during pregnancy?",
            answer:
              "The NHS says UK tap water is safe to drink during pregnancy in most areas. Water companies are legally required to test it against strict standards. However, the NHS also advises that pregnant women in homes with lead pipes should avoid drinking water that has been standing in the pipes, and run the tap for 30 seconds before use.",
          },
          {
            question: "Should I use a water filter when pregnant?",
            answer:
              "If you live in a property with lead pipes — typically homes built before 1970 — a reverse osmosis filter is worth considering during pregnancy. RO systems remove 95–99% of lead and PFAS. Carbon block filters certified to NSF/ANSI 53 also reduce lead. For most households with newer plumbing in low-risk areas, tap water meets all legal safety standards.",
          },
          {
            question: "Does boiling water remove lead?",
            answer:
              "No. Boiling water does not remove lead. It can actually concentrate lead slightly by evaporating some of the water while leaving the dissolved lead behind. If you are concerned about lead, run the tap for 30–60 seconds before filling the kettle, and consider a certified lead-reducing filter.",
          },
          {
            question: "What about bottled water during pregnancy?",
            answer:
              "Bottled water is not automatically safer than tap water during pregnancy. Some bottled waters have higher mineral levels that may be unsuitable for making up formula or for daily consumption. NHS guidance specifically cautions against using bottled water high in sodium or sulphate for babies. UK tap water, which is among the most tightly regulated in the world, is the most consistent option.",
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
            <li className="font-medium text-ink" aria-current="page">Water Quality and Pregnancy</li>
          </ol>
        </nav>

        <ArticleSchema
          headline="Water Quality and Pregnancy: What You Need to Know"
          description="Lead crosses the placenta. Nitrate can affect oxygen in the blood. PFAS has been linked to developmental effects in studies. Here is what pregnant women need to know about UK tap water, what the NHS recommends, and how to check your postcode."
          url="https://www.tapwater.uk/guides/water-quality-pregnancy"
          datePublished="2026-04-08"
          dateModified={new Date().toISOString().split("T")[0]}
          authorName="Remy"
          authorUrl="https://www.tapwater.uk/about"
        />

        {/* H1 */}
        <h1 className="font-display text-3xl lg:text-4xl italic text-ink tracking-tight">
          Water Quality and Pregnancy: What You Need to Know
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
          UK tap water is among the most tightly regulated in the world, and for the vast majority of pregnant women in most postcodes, it is safe to drink without modification. But pregnancy is a period when the developing baby is more vulnerable to contaminants than a healthy adult — and a small number of specific substances can cross the placenta or affect foetal development at concentrations that cause no obvious symptoms in the mother.
        </p>
        <p className="text-base text-body leading-relaxed">
          This guide focuses on three contaminants with the strongest evidence base — lead, nitrate, and PFAS — and explains what the NHS recommends, what the science shows, and what practical steps you can take if you want additional reassurance.
        </p>

        {/* Why water quality matters during pregnancy */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <Droplets className="w-5 h-5 text-accent shrink-0" aria-hidden="true" />
          Why water quality matters more during pregnancy
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          A developing baby cannot filter out contaminants the way an adult body can. The placenta is not a perfect barrier — many substances that circulate in the mother&apos;s blood can reach the foetus. This does not mean tap water is dangerous; it means that the small margins of risk that are acceptable for a healthy adult carry more weight when a foetus is involved.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The World Health Organization&apos;s guidance on drinking water safety during pregnancy identifies lead, nitrate, and certain persistent chemicals including PFAS as the primary concerns in water supplies that otherwise meet standard safety thresholds. In the UK, all three are monitored and regulated — but regulation sets a legal maximum, not a health guarantee, and some homes still have infrastructure that can introduce contaminants after the water leaves the treatment works.
        </p>

        {/* Contaminants to watch */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" aria-hidden="true" />
          Contaminants to watch
        </h2>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Lead</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          Lead is a proven neurotoxin with no safe exposure level. Unlike many contaminants, it crosses the placenta freely and accumulates in foetal tissue. Early-life lead exposure — including in the womb — is associated with reduced cognitive development, lower IQ, and impaired neurological function. These effects are permanent. There is no treatment that reverses neurological damage from prenatal lead exposure.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          In UK water supplies, lead comes not from the treatment works but from the infrastructure in between: lead service pipes in older homes, lead-jointed fittings, and historically lead solder used to join copper pipes. Homes built before 1970 are at highest risk. See our{" "}
          <Link href="/contaminant/lead" className="text-accent hover:underline font-medium">lead contaminant page</Link>{" "}for postcode-level monitoring data.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Nitrate</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          Nitrate in drinking water is primarily an agricultural issue — it enters groundwater and surface water through fertiliser runoff. The main concern during pregnancy is not direct harm to the mother, but the risk to formula-fed infants if nitrate-containing tap water is used to make up feeds. High nitrate levels can interfere with the blood&apos;s ability to carry oxygen, causing a condition known as methaemoglobinaemia — sometimes called blue baby syndrome. The UK legal limit for nitrate in drinking water is 50 mg/L, which is considered safe for adults and most children. Bottle-fed infants are the primary at-risk group.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          Nitrate levels vary significantly by area. Agricultural regions — particularly parts of East Anglia, Lincolnshire, and the East Midlands — tend to have higher nitrate readings than upland or urban areas. Check the{" "}
          <Link href="/contaminant/nitrate" className="text-accent hover:underline font-medium">nitrate data for your postcode</Link>{" "}to see where your area sits.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">PFAS</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          PFAS — per- and polyfluoroalkyl substances — are a large family of industrial chemicals that do not break down in the environment or in the human body. They are found in UK drinking water supplies near industrial sites, airports, and areas where firefighting foam containing PFAS has been used. The science on PFAS in pregnancy is still developing, but multiple studies have found associations between PFAS exposure and lower birth weight, reduced foetal growth, thyroid disruption, and altered immune function in children. The UK government has introduced a regulatory limit for total PFAS in drinking water, but campaigners and some scientists argue it should be tighter.
        </p>
        <p className="text-base text-body leading-relaxed">
          Our{" "}
          <Link href="/contaminant/pfas" className="text-accent hover:underline font-medium">PFAS contaminant page</Link>{" "}shows detection data by postcode, and our{" "}
          <Link href="/guides/pfas-uk-explained" className="text-accent hover:underline font-medium">PFAS guide</Link>{" "}explains the full picture in plain language.
        </p>

        {/* What the NHS recommends */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-safe shrink-0" aria-hidden="true" />
          What the NHS recommends
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          The NHS position is clear: UK tap water is safe for pregnant women. The NHS Start4Life guidance does not advise pregnant women to avoid tap water or to use filters as a general precaution. UK water companies must comply with the Water Supply (Water Quality) Regulations 2016, which set legally enforceable limits for hundreds of substances. The Drinking Water Inspectorate publishes annual compliance reports and water companies face enforcement action if they fall short.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          However, the NHS also acknowledges the lead pipe problem specifically. NHS advice notes that homes with lead pipes carry a higher risk of lead in tap water, and recommends running the cold tap for 30 seconds before drinking — particularly first thing in the morning when water has been sitting in contact with lead pipes overnight. This is especially relevant during pregnancy.
        </p>
        <div className="card p-5 mt-2">
          <p className="text-xs text-faint uppercase tracking-wider mb-3">NHS guidance summary</p>
          <ul className="space-y-2 text-sm text-body">
            <li className="flex gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-safe shrink-0" aria-hidden="true" />
              UK tap water is safe to drink during pregnancy in the vast majority of cases
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-warning shrink-0" aria-hidden="true" />
              In homes with lead pipes, run the cold tap for 30 seconds before drinking
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-warning shrink-0" aria-hidden="true" />
              Do not use hot tap water for drinking, cooking, or making up formula — it dissolves lead more readily
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-safe shrink-0" aria-hidden="true" />
              Bottled water is not automatically safer — some mineral waters have high sodium or sulphate levels unsuitable for formula
            </li>
          </ul>
        </div>

        {/* How to check your water */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          How to check your water quality
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Enter your postcode below to see what monitoring data shows for your area. TapWater.uk tracks lead, nitrate, PFAS, and 50+ other contaminants across UK postcodes, drawing on Drinking Water Inspectorate compliance data and Environment Agency monitoring returns.
        </p>
        <p className="text-base text-body leading-relaxed mb-6">
          The safety score on your postcode report summarises how your area performs across all monitored contaminants — 100 is a clean bill of health, lower scores indicate one or more contaminants detected at levels worth paying attention to. You can click through to any contaminant to see the specific monitoring data.
        </p>
        <div className="card p-5">
          <p className="text-sm font-medium text-ink mb-3">Check your postcode</p>
          <PostcodeSearch size="sm" />
          <p className="text-xs text-faint mt-3">
            Covers lead, nitrate, PFAS, and 50+ other contaminants across UK postcodes.
          </p>
        </div>

        {/* Best filters for pregnant women */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">
          Best filters for pregnant women
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          If you live in an older property, your postcode report shows elevated lead, or you want additional peace of mind during pregnancy, filtration is a reasonable step. Different filter types offer different levels of protection.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Reverse osmosis — the most thorough option</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          Reverse osmosis systems push water through a semi-permeable membrane that removes 95–99% of lead, PFAS, nitrate, fluoride, and most other dissolved contaminants. They are the most comprehensive under-sink option for households with specific concerns — particularly lead pipe risk or confirmed PFAS detection. They require installation under the kitchen sink and connect to a separate filtered-water tap. See our{" "}
          <Link href="/filters/reverse-osmosis" className="text-accent hover:underline font-medium">reverse osmosis guide</Link>{" "}for a full comparison.
        </p>

        {roProduct && (
          <div className="mt-4">
            <ProductCard
              product={roProduct}
              highlight="Recommended for lead and PFAS removal during pregnancy"
              pageType="guide-pregnancy"
            />
          </div>
        )}

        <h3 className="text-lg font-semibold mt-6 mb-2 text-ink">Carbon block filters — certified lead reduction</h3>
        <p className="text-base text-body leading-relaxed mb-4">
          Pitcher-style and under-sink carbon block filters certified to NSF/ANSI Standard 53 can reduce lead by 90% or more at the tap. Look specifically for NSF 53 certification — not all carbon filters reduce lead, and many standard pitcher filters (including some BRITA models) are not certified for lead removal. This is a lower-cost option than reverse osmosis and sufficient if your concern is lead alone rather than PFAS or nitrate.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          Note that no filter eliminates the need to run the tap for 30 seconds first if you have lead pipes — the filter needs fresh water flowing through it to work effectively.
        </p>

        {/* FAQ */}
        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-faint shrink-0" aria-hidden="true" />
          Frequently asked questions
        </h2>
        <div className="space-y-6">
          {[
            {
              q: "Is UK tap water safe during pregnancy?",
              a: "The NHS says yes — UK tap water is safe to drink during pregnancy in most areas. Water companies must meet strict legal standards. The main exception is homes with lead pipes, where the NHS advises running the cold tap before drinking. If you are in a pre-1970 home, check your postcode above.",
            },
            {
              q: "Should I use a water filter when pregnant?",
              a: "It depends on your specific situation. If you are in a home with lead pipes, an NSF 53-certified filter or reverse osmosis system is a sensible precaution. If your postcode report shows PFAS detection, reverse osmosis provides the most effective removal. For households in newer properties with no flagged contaminants, a filter is optional rather than necessary.",
            },
            {
              q: "Does boiling water remove lead?",
              a: "No. Boiling does not remove lead and can actually slightly concentrate it by reducing the water volume. The only way to reduce lead at the tap is to run the tap first to flush standing water, and to use a certified lead-reducing filter for drinking and cooking water.",
            },
            {
              q: "What about bottled water during pregnancy?",
              a: "Bottled water is not automatically safer than tap water during pregnancy. Some mineral waters contain high levels of sodium or sulphate, which are not recommended for formula. UK tap water — which is heavily regulated — is generally a more consistent choice. If you want to avoid specific contaminants, a good filter is more reliable and far cheaper than bottled water.",
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
              { href: "/guides/pfas-uk-explained", label: "PFAS in UK Water: The Full Picture" },
              { href: "/contaminant/lead", label: "Lead in UK Water: Postcode Data" },
              { href: "/contaminant/nitrate", label: "Nitrate in UK Water: Postcode Data" },
              { href: "/filters/reverse-osmosis", label: "Best Reverse Osmosis Systems UK" },
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
