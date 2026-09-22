import { HardnessMapGuide } from "@/components/tank/hardness-pages"
import type { Metadata } from "next"
import { FAQSchema, ArticleSchema } from "@/components/json-ld"
import { OG_IMAGE } from "@/lib/og";
import { getHardnessMap } from "@/lib/data"
import { postcodeAreaName } from "@/lib/postcode-areas"

export const revalidate = 86400

const DESCRIPTION =
  "Interactive UK water hardness map by postcode: over 2,000 districts coloured from measured water company tests, the hardest and softest areas ranked, and what to do about limescale."

export function generateMetadata(): Metadata {
  const year = new Date().getFullYear()
  return {
    title: `UK Water Hardness Map (${year}): Hard and Soft Water Areas by Postcode`,
    description: DESCRIPTION,
    openGraph: {
      images: OG_IMAGE,
      title: `UK Water Hardness Map (${year}): Hard and Soft Water Areas by Postcode`,
      description: DESCRIPTION,
      url: "https://www.tapwater.uk/guides/water-hardness-map",
      type: "article",
    },
  }
}

export default async function WaterHardnessMapPage() {
  const { districts, areas } = await getHardnessMap()
  const ranked = areas.filter((a) => a.measured >= 3)
  const hardest = ranked.filter((a) => a.median >= 250).slice(0, 10)
  const softest = [...ranked].reverse().filter((a) => a.median < 120).slice(0, 10)
  const veryHardShare = districts.length
    ? Math.round((districts.filter((d) => d.value >= 180).length / districts.length) * 100)
    : 0
  const listAreas = (rows: typeof ranked) =>
    rows.slice(0, 5).map((a) => `${postcodeAreaName(a.area)} (${a.median} mg/L)`).join(", ")
  return (
    <>
      <FAQSchema
        faqs={[
          {
            question: "Is my water hard or soft?",
            answer: `Enter your postcode on TapWater.uk to check. ${veryHardShare}% of the ${districts.length.toLocaleString("en-GB")} postcode districts on our map have hard or very hard water (180 mg/L and above). London and the South East have the hardest water, Scotland, Wales and the North West the softest.`,
          },
          ...(hardest.length > 0 ? [{
            question: "Which areas of the UK have the hardest water?",
            answer: `By median measured hardness, the hardest postcode areas are ${listAreas(hardest)}. All sit on chalk and limestone in the south and east of England.`,
          }] : []),
          ...(softest.length > 0 ? [{
            question: "Which areas of the UK have soft water?",
            answer: `The softest postcode areas we measure are ${listAreas(softest)}. Soft water comes from upland reservoirs over granite and other hard rock, so Scotland, Wales, the Lake District and the Pennines dominate.`,
          }] : []),
          {
            question: "Is hard water bad for you?",
            answer: "Hard water is not harmful to health \u2014 calcium and magnesium in hard water may actually be beneficial. However, it causes limescale buildup in pipes and appliances, reducing their efficiency and lifespan.",
          },
          {
            question: "Do I need a water softener?",
            answer: "If your water hardness is above 200 mg/L and you're experiencing limescale problems, a water softener can help. Ion exchange softeners cost \u00a3500-\u00a31,500 installed and require regular salt top-ups.",
          },
        ]}
      />
        <ArticleSchema
          headline={`UK Water Hardness Map: Hard and Soft Water Areas by Postcode (${new Date().getFullYear()})`}
          description={DESCRIPTION}
          url="https://www.tapwater.uk/guides/water-hardness-map"
          datePublished="2026-04-01"
          dateModified={new Date().toISOString().split("T")[0]}
          authorName="TapWater.uk Research"
          authorUrl="https://www.tapwater.uk/about"
        />
      <HardnessMapGuide districts={districts} hardest={hardest} softest={softest} veryHardShare={veryHardShare} year={new Date().getFullYear()} dateModified={new Date().toISOString().split("T")[0]} />
    </>
  )
}
