import { HardnessHub } from "@/components/tank/hardness-pages"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowDown, ArrowRight } from "lucide-react"
import { PostcodeSearch } from "@/components/postcode-search"
import { SoftenerLeadForm } from "@/components/softener-lead-form"
import { ProductCard } from "@/components/product-card"
import { AffiliateNote } from "@/components/commerce"
import { getProductBySlug } from "@/lib/products"
import { getHardnessMap } from "@/lib/data"
import { postcodeAreaName } from "@/lib/postcode-areas"
import { hardnessColour } from "@/components/hardness-map"
import { SoftenerGuidesNav } from "@/components/softener-guides-nav"
import { FAQSchema, BreadcrumbSchema, ArticleSchema } from "@/components/json-ld"
import { OG_IMAGE } from "@/lib/og";

export function generateMetadata(): Metadata {
  return { title: "Hardness preview", robots: { index: false, follow: false } }
}
function _unusedMetadata(): Metadata {
  const year = new Date().getFullYear()
  return {
    title: `Water Hardness by Postcode: How Hard Is My Water? (${year})`,
    description:
      "Check your water hardness by postcode. Find out if you have hard or soft water, what it means for your home, and whether you need a softener.",
    openGraph: {
      images: OG_IMAGE,
      title: `Water Hardness by Postcode: How Hard Is My Water? (${year})`,
      description:
        "Check your water hardness by postcode. Understand what causes hard water and what you can do about it.",
      url: "https://www.tapwater.uk/hardness",
      type: "website",
    },
    twitter: {
      images: OG_IMAGE,
      card: "summary_large_image",
      title: `Water Hardness Checker (${year})`,
      description: "Is your water hard or soft? Check by postcode and find out what it means.",
    },
  }
}

export default async function HardnessPreview() {
  const { areas } = await getHardnessMap()
  const browseAreas = areas
    .filter((a) => a.measured >= 2)
    .map((a) => ({ ...a, town: postcodeAreaName(a.area) }))
    .sort((a, b) => a.town.localeCompare(b.town))
  const year = new Date().getFullYear()
  const dateModified = new Date().toISOString().split("T")[0]
  return (
    <>
      <FAQSchema
        faqs={[
          {
            question: "Is my water hard or soft?",
            answer:
              "Enter your postcode on TapWater.uk to check. Generally, London and the South East has the hardest water (250\u2013350\u00a0mg/L), while Scotland, Wales, and the North West have softer water (under 100\u00a0mg/L).",
          },
          {
            question: "What causes hard water?",
            answer:
              "Hard water is caused by dissolved calcium and magnesium minerals, picked up as rainwater filters through chalk and limestone rock. Areas built on granite (Scotland, Wales) have naturally soft water.",
          },
          {
            question: "Is hard water bad for you?",
            answer:
              "No. Hard water is not harmful to health \u2014 the calcium and magnesium may actually be beneficial. However, it causes limescale buildup in pipes, kettles, and appliances.",
          },
          {
            question: "Do I need a water softener?",
            answer:
              "If your hardness is above 200\u00a0mg/L and you\u2019re experiencing limescale problems, a softener can help. They cost \u00a3500\u2013\u00a31,500 installed and require regular salt top-ups.",
          },
          {
            question: "What is the hardness scale?",
            answer:
              "Soft: 0\u201360\u00a0mg/L, Moderately soft: 60\u2013120\u00a0mg/L, Moderately hard: 120\u2013180\u00a0mg/L, Hard: 180\u2013250\u00a0mg/L, Very hard: 250+\u00a0mg/L (all as CaCO\u2083).",
          },
          {
            question: "Does a water filter remove hardness?",
            answer:
              "Standard filter jugs don\u2019t significantly reduce hardness. For hardness reduction, you need an ion exchange water softener or a reverse osmosis system.",
          },
        ]}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Water Hardness Checker", url: "https://www.tapwater.uk/hardness" },
        ]}
      />
        <ArticleSchema
          headline={`Water Hardness Checker: Is Your Water Hard or Soft? (${year})`}
          description="Check your water hardness by postcode. Find out if you have hard or soft water, what it means for your home, and whether you need a water softener or filter."
          url="https://www.tapwater.uk/hardness"
          datePublished="2026-04-06"
          dateModified={dateModified}
          authorName="TapWater.uk Research"
          authorUrl="https://www.tapwater.uk/about"
        />
      <HardnessHub areas={browseAreas} year={year} dateModified={dateModified} />
    </>
  )
}
