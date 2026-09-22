import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { AffiliateNote } from "@/components/commerce";
import { SoftenerLeadForm } from "@/components/softener-lead-form";
import { HardnessMap } from "@/components/hardness-map";
import { hardnessColour } from "@/components/hardness-map";
import { getProductBySlug } from "@/lib/products";
import { postcodeAreaName } from "@/lib/postcode-areas";
import { SOFTENER_GUIDES } from "@/lib/softener-guides";
import { HARD_WATER_THRESHOLD } from "@/lib/filters";
import type { HardnessAreaPage, HardnessMapArea, HardnessMapDistrict } from "@/lib/data";
import { TankSearch } from "./tank-search";
import { AreaPills, AreaTable, CheckPostcode, GuideLink, HardnessScale, SoftenerPanel } from "./hardness-blocks";
import "./tank.css";

/**
 * The three hardness pages. Copy, FAQs and links come across from the previous
 * versions unchanged; only the form is new. Each page opens with the question it ranks
 * for and the answer, then the check, then the money step, then the reading.
 */

const BANDS = [
  { label: "Soft", range: "0 to 60 mg/L", colour: 30, text: "Scotland, Wales, and most of northwest England. Minimal limescale. Soap lathers easily. No descaling needed. Some very soft supplies can be slightly more corrosive on old pipes." },
  { label: "Moderately soft", range: "60 to 120 mg/L", colour: 90, text: "Parts of the North East, some of Yorkshire and the South West. Light limescale deposits may form over time. Standard maintenance is usually enough." },
  { label: "Moderately hard", range: "120 to 180 mg/L", colour: 150, text: "Much of the Midlands and parts of the South West. Visible limescale in kettles and on shower screens. Regular descaling is advisable." },
  { label: "Hard", range: "180 to 250 mg/L", colour: 215, text: "Much of the Midlands, parts of Yorkshire and the Home Counties. Limescale builds quickly on heating elements. Appliance lifespans are noticeably reduced. Dishwasher salt is essential." },
  { label: "Very hard", range: "250 mg/L and above", colour: 300, text: "London, the Thames Valley, East Anglia, and parts of Kent. Some areas exceed 400 mg/L. Serious limescale damage to boilers and appliances. A water softener gives a meaningful return on investment here." },
];

const REGIONS = [
  ["London & Thames Valley", "Thames Water, Affinity Water", "250–400 mg/L"],
  ["East Anglia & East Midlands", "Anglian Water", "200–350 mg/L"],
  ["Midlands", "Severn Trent", "180–280 mg/L"],
  ["Yorkshire", "Yorkshire Water", "80–200 mg/L"],
  ["Northwest England", "United Utilities", "50–100 mg/L"],
  ["Wales", "Dwr Cymru", "below 80 mg/L"],
  ["Scotland", "Scottish Water", "below 60 mg/L"],
];

function Crumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <div className="wt-top">
      <div className="wt-inner">
        <nav aria-label="Breadcrumb" className="wt-crumbs">
          {items.map((it, i) => (
            <span key={it.label} style={{ display: "contents" }}>
              {i > 0 ? <span aria-hidden="true">/</span> : null}
              {it.href ? <Link href={it.href}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
            </span>
          ))}
        </nav>
      </div>
    </div>
  );
}

function Picks({ pageType, placement, reason }: { pageType: string; placement: string; reason: string }) {
  const shower = getProductBySlug("jolie-filtered-showerhead");
  const ro = getProductBySlug("osmio-zero");
  const picks = [
    { product: shower, highlight: "For dry skin and hair after a shower" },
    { product: ro, highlight: "Reverse osmosis without a plumber" },
  ].filter((p): p is { product: NonNullable<typeof shower>; highlight: string } => Boolean(p.product));
  return (
    <>
      <div className="wt-picks">
        {picks.map(({ product, highlight }) => (
          <ProductCard key={product.id} product={product} highlight={highlight} pageType={pageType} placement={placement} recommendationReason={reason} />
        ))}
      </div>
      <AffiliateNote withFundingLink className="mt-4" />
    </>
  );
}

function SoftenerGuideList({ current }: { current?: string }) {
  return (
    <ul className="wt-guides">
      {SOFTENER_GUIDES.filter((g) => g.slug !== current).map((g) => (
        <li key={g.slug}>
          <Link href={`/guides/${g.slug}/`}><strong>{g.label}</strong><span>{g.blurb}</span></Link>
        </li>
      ))}
    </ul>
  );
}

// ── /hardness ─────────────────────────────────────────────────────────────────

export function HardnessHub({ areas, year, dateModified }: { areas: (HardnessMapArea & { town: string })[]; year: number; dateModified: string }) {
  return (
    <div className="wt">
      <Crumbs items={[{ label: "Home", href: "/" }, { label: "Water Hardness Checker" }]} />

      <section className="wt-chalk" id="wt-hardness">
        <div className="wt-inner">
          <h1 className="wt-h2" style={{ fontSize: "clamp(2.4rem, 6vw, 4.6rem)", maxWidth: "16ch" }}>
            How Hard Is My Water? Check Water Hardness by Postcode ({year})
          </h1>
          <p className="wt-byline">
            By <strong>TapWater.uk Research</strong> · <time dateTime={dateModified}>Updated {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</time> · Independent research
          </p>
          <p className="wt-sub" style={{ marginTop: 28 }}>
            Enter your postcode to see the exact hardness reading for your supply zone, pulled from your water company&apos;s published compliance data.
          </p>
          <div style={{ marginTop: 24 }}><TankSearch hash="wt-hardness" /></div>
          <HardnessScale caption="Hardness in mg/L as calcium carbonate, the scale UK water companies report in." />
        </div>
      </section>

      <section className="wt-band wt-band--white">
        <div className="wt-inner wt-prose">
          <p>
            Whether you&apos;ve noticed white deposits on your kettle, soap that won&apos;t lather, or a boiler that needs descaling more often than it should, water hardness is
            almost certainly the explanation. The UK has one of the widest hardness ranges of any country in Europe: from some of the softest water in Scotland and Wales to
            some of the hardest supplies in London and East Anglia, all from the same national infrastructure.
          </p>
          <p>
            Hardness is measured in milligrams per litre of calcium carbonate equivalent (mg/L CaCO<sub>3</sub>). It is a regulated parameter that every water company
            monitors and reports to the Drinking Water Inspectorate, which is why we can show you an accurate reading for your specific postcode.
          </p>
        </div>
      </section>

      <section className="wt-band wt-band--foam">
        <div className="wt-inner">
          <h2 className="wt-h2">The hardness scale</h2>
          <p className="wt-sub">UK water companies use the following classification. Each band reflects both the mineral content of the water and the practical effects you&apos;re likely to notice.</p>
          <ul className="wt-bands">
            {BANDS.map((b) => (
              <li key={b.label}>
                <i style={{ background: hardnessColour(b.colour) }} aria-hidden="true" />
                <div><strong>{b.label}, {b.range}</strong><p>{b.text}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="wt-band wt-band--white">
        <div className="wt-inner wt-prose">
          <h2 className="wt-h2">What causes hard water?</h2>
          <p style={{ marginTop: 20 }}>
            Rainwater starts out soft and slightly acidic. As it soaks into the ground and makes its way through soil and rock, it picks up whatever minerals it encounters.
            In southeast England, East Anglia, and much of the Midlands, the underground rock is chalk and limestone, both composed largely of calcium carbonate.
            Slightly acidic rainwater dissolves these rocks over time, loading the groundwater with calcium and magnesium ions before it reaches an aquifer or reservoir.
          </p>
          <p>
            Scotland, Wales, and northwest England sit on much older, harder geology: granite, gneiss, and other igneous or metamorphic rocks that resist dissolution. Water
            flowing over granite picks up almost no mineral content, emerging as naturally soft water. The Lake District, Snowdonia, and the Scottish Highlands all have this
            character. Cornwall, despite being in the far southwest, also produces soft water for the same reason.
          </p>
          <p>
            The upshot is that hardness in the UK maps almost directly onto the geological map. If you live over chalk downland, your water will be hard. If you live over old
            upland granite, it will be soft. Mixed geology, like parts of Yorkshire and the Midlands, produces a blend depending on how much groundwater versus surface
            reservoir water goes into the supply.
          </p>

          <h2 className="wt-h2" style={{ marginTop: 56 }}>What does hard water actually do?</h2>
          <p style={{ marginTop: 20 }}>
            Hard water is not a health risk. The calcium and magnesium it contains contribute to your dietary mineral intake, and the World Health Organisation does not set
            any health-based guideline limit for hardness. Some studies have found associations between hard water and slightly lower cardiovascular risk, though the
            evidence is not strong enough to have changed public health advice.
          </p>
          <p>
            Where hard water matters is in your home. When hard water is heated, or when it evaporates, the dissolved calcium carbonate comes back out of solution and
            deposits as limescale, the white or off-white crust on heating elements, inside kettles, around taps, and on shower screens. Scale on a heating element acts as
            an insulator: even 1.6mm of buildup increases energy consumption by around 12%, according to research by the Water Quality Research Foundation. Over years,
            this adds meaningfully to energy bills and shortens appliance life.
          </p>
          <p>
            Other effects include: soap and shampoo that lather less effectively (calcium ions react with fatty acids in soap to form scum rather than foam), laundry needing
            more detergent for the same result, and shower screens and taps that need frequent cleaning. Some people with sensitive skin find very hard water aggravates
            dryness, though the science on this is mixed.
          </p>
        </div>
      </section>

      <section className="wt-chalk">
        <div className="wt-inner">
          <h2 className="wt-h2">How to deal with hard water</h2>
          <p className="wt-sub">The right solution depends on your hardness level and what you actually want to fix.</p>
          <div className="wt-do-grid" style={{ marginTop: 32 }}>
            <SoftenerPanel
              hardness={220}
              heading="Water softener, for the whole house"
              intro="An ion exchange softener is the most effective solution. It replaces calcium and magnesium ions with sodium ions, producing genuinely soft water throughout the house. Units cost £500–£1,500 installed, with ongoing costs of roughly £5–£10 per month for salt. Life expectancy is 15–20 years. Keep one unsoftened tap in the kitchen for drinking."
            />
            <div className="wt-side">
              <div className="wt-second">
                <h3>Shower filter, for skin and hair</h3>
                <p>A shower filter does not reduce hardness; the scale stays. What it removes is chlorine, which strips natural oils and is the usual culprit when hard water areas report dry skin and brittle hair.</p>
                <p><GuideLink href="/guides/best-shower-filter-uk">Filter shower heads and inline filters compared</GuideLink></p>
              </div>
              <div className="wt-second">
                <h3>Reverse osmosis, for drinking water</h3>
                <p>Standard filter jugs and most under-sink filters do not significantly reduce hardness. For hardness reduction from a filter, you need a reverse osmosis system, which removes virtually all dissolved minerals.</p>
                <p><GuideLink href="/filters/">Browse water filters</GuideLink></p>
              </div>
              <div className="wt-second">
                <h3>Descaling, for what is already there</h3>
                <p>Citric acid descalers work well on kettles and shower heads. Dishwasher salt and the right hardness setting protect the machine. This does nothing for your boiler or pipes, but covers the day-to-day.</p>
                <p><GuideLink href="/guides/best-kettle-for-hard-water-uk">Best kettles for hard water</GuideLink></p>
                <p><GuideLink href="/guides/best-boiling-water-tap-uk">What hard water does to boiling water taps</GuideLink></p>
              </div>
            </div>
          </div>
          <Picks pageType="hardness" placement="hardness-solutions" reason="hard-water" />
          <p className="wt-fine" style={{ marginTop: 20 }}>
            <GuideLink href="/guides/water-softener-cost-uk">What a softener really costs</GuideLink>{" · "}
            <GuideLink href="/guides/water-hardness-map/">UK Water Hardness Map: which areas have the hardest water?</GuideLink>
          </p>
        </div>
      </section>

      {areas.length > 0 ? (
        <section className="wt-band wt-band--white" aria-labelledby="browse-areas-heading">
          <div className="wt-inner">
            <h2 className="wt-h2" id="browse-areas-heading">Hardness by postcode area</h2>
            <p className="wt-sub">Every area with measured readings, from water company tests and their own postcode checkers. The number is the median across the area&rsquo;s districts.</p>
            <AreaPills areas={areas} />
          </div>
        </section>
      ) : null}

      <section className="wt-band wt-band--foam">
        <div className="wt-inner">
          <SoftenerLeadForm hardnessValue={220} hardnessLabel="hard" source="hardness_page" />
          <h2 className="wt-h2" style={{ marginTop: 56 }}>Thinking about a softener? Read first</h2>
          <SoftenerGuideList />
        </div>
      </section>

      <section className="wt-band wt-band--white">
        <div className="wt-inner">
          <h2 className="wt-h2">Water hardness by region</h2>
          <p className="wt-sub">These are the general ranges based on water company compliance data and DWI reporting. Your exact reading may differ; enter your postcode above for precise figures.</p>
          <ul className="wt-ledger wt-nums" style={{ marginTop: 28, maxWidth: 720 }}>
            {REGIONS.map(([name, co, range]) => (
              <li key={name}><span><strong>{name}</strong><em>{co}</em></span><b>{range}</b></li>
            ))}
          </ul>
          <p className="wt-fine" style={{ marginTop: 20 }}><GuideLink href="/guides/water-hardness-map/">UK Water Hardness Map by region</GuideLink></p>
        </div>
      </section>

      <section className="wt-band wt-band--foam">
        <div className="wt-inner">
          <CheckPostcode heading="Check your specific postcode" intro="Regional averages only tell part of the story. Enter your postcode to see the exact hardness reading for your supply zone, along with all other quality parameters tested by your water company." />
        </div>
      </section>
    </div>
  );
}

// ── /hardness/[area] ──────────────────────────────────────────────────────────

function bandSentence(median: number): string {
  if (median >= 250) return "very hard, the top band on the scale water companies use";
  if (median >= 180) return "hard, past the point where limescale starts costing money";
  if (median >= 120) return "moderately hard, with some scale over time but rarely enough to need a softener";
  if (median >= 60) return "moderately soft, with little limescale to speak of";
  return "soft, so limescale is not a problem here";
}

function bandWord(v: number): string {
  return v < 60 ? "soft" : v < 120 ? "moderately soft" : v < 180 ? "moderately hard" : v < 250 ? "hard" : "very hard";
}

export function HardnessArea({ data, faqs }: { data: HardnessAreaPage; faqs: { question: string; answer: string }[] }) {
  const { summary, districts, nearby } = data;
  const town = postcodeAreaName(data.area);
  const hard = summary.median >= HARD_WATER_THRESHOLD;
  const measured = districts.filter((d) => d.measured);
  const hardest = districts[0];
  const softest = districts[districts.length - 1];

  return (
    <div className="wt">
      <Crumbs items={[{ label: "Home", href: "/" }, { label: "Water hardness", href: "/hardness" }, { label: town }]} />

      <section className={`wt-chalk${hard ? "" : " wt-chalk--soft"}`} id="wt-hardness">
        <div className="wt-inner">
          <div className="wt-chalk-grid">
            <p className="wt-n wt-nums">
              {summary.median}
              <small>mg of limescale minerals in every litre, the median across {data.area} districts</small>
            </p>
            <div>
              <h1 className="wt-h2">Is {town} a hard water area?</h1>
              <p style={{ marginTop: 16 }}>
                <strong>{hard ? "Yes." : "No."}</strong> Tap water across the {data.area} postcode area is <strong>{bandSentence(summary.median)}</strong>, with a median of{" "}
                {summary.median} mg/L calcium carbonate. It ranges from {softest.value} mg/L in <Link className="wt-link" href={`/postcode/${softest.district}`}>{softest.district}</Link> to{" "}
                {hardest.value} mg/L in <Link className="wt-link" href={`/postcode/${hardest.district}`}>{hardest.district}</Link>, from {measured.length} district{measured.length === 1 ? "" : "s"} with
                their own water company reading{measured.length < districts.length ? ` and ${districts.length - measured.length} estimated from the area` : ""}.
              </p>
              <HardnessScale value={summary.median} />
            </div>
          </div>
        </div>
      </section>

      <section className="wt-band wt-band--white">
        <div className="wt-inner">
          <h2 className="wt-h2" id="districts">Hardness by {data.area} district</h2>
          <p className="wt-sub">
            Hardest first. Hard starts at 180 mg/L, very hard at 250.
            {measured.length < districts.length ? " Districts marked with an asterisk take the area's median rather than a reading of their own." : ""}
          </p>
          <div className="wt-tablewrap" style={{ marginTop: 24 }}>
            <table className="wt-table wt-table--light wt-nums" style={{ minWidth: 520 }}>
              <thead><tr><th scope="col">District</th><th scope="col">Area</th><th scope="col" style={{ textAlign: "right" }}>mg/L</th><th scope="col">Hardness</th></tr></thead>
              <tbody>
                {districts.map((d) => (
                  <tr key={d.district}>
                    <td><span className="wt-dot" style={{ background: hardnessColour(d.value) }} aria-hidden="true" /><Link href={`/postcode/${d.district}`}>{d.district}</Link>{!d.measured ? <span title="Postcode-area estimate">*</span> : null}</td>
                    <td style={{ opacity: 0.7 }}>{d.areaName}</td>
                    <td style={{ textAlign: "right" }}>{d.value}</td>
                    <td style={{ textTransform: "capitalize" }}>{bandWord(d.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {hard ? (
        <section className="wt-chalk">
          <div className="wt-inner">
            <h2 className="wt-h2">What to do about it</h2>
            <div className="wt-do-grid" style={{ marginTop: 32 }}>
              <SoftenerPanel
                hardness={summary.median}
                heading="Hard water: compare softener quotes"
                intro={`At ${summary.median} mg/L most ${data.area} homes get their money back on a softener within a few years. A filter will not touch limescale; only a softener does.`}
              />
              <div className="wt-side">
                <div className="wt-second">
                  <h3>Check your own district first</h3>
                  <p>The area figure is a median. Your district can sit anywhere between {summary.min} and {summary.max} mg/L.</p>
                  <TankSearch hash="wt-hardness" id="wt-postcode-area" />
                </div>
              </div>
            </div>
            <div className="wt-form">
              <SoftenerLeadForm hardnessValue={summary.median} hardnessLabel={summary.label} source="hardness_area" heading={`Softener quotes for ${town}`} intro={`At ${summary.median} mg/L most ${data.area} homes get their money back on a softener within a few years. Free quotes from installers covering your postcode.`} />
            </div>
            <h2 className="wt-h2" style={{ marginTop: 56 }}>Before you buy</h2>
            <SoftenerGuideList />
          </div>
        </section>
      ) : (
        <section className="wt-band wt-band--foam">
          <div className="wt-inner">
            <h2 className="wt-h2">You do not need a softener in {town}.</h2>
            <p className="wt-sub">
              At {summary.median} mg/L the practical effects are minor. If you notice anything, it is usually chlorine rather than hardness:{" "}
              <Link className="wt-link" href="/guides/best-shower-filter-uk">a shower filter</Link> or <Link className="wt-link" href="/guides/best-water-filter-jug-uk">a filter jug</Link> deals with that.
            </p>
            <div style={{ marginTop: 32 }}>
              <CheckPostcode heading="Check your exact postcode" intro={`The area figure is a median. Your district can sit anywhere between ${summary.min} and ${summary.max} mg/L.`} />
            </div>
          </div>
        </section>
      )}

      {nearby.length > 0 ? (
        <section className="wt-band wt-band--white">
          <div className="wt-inner">
            <h2 className="wt-h2">Nearby areas</h2>
            <div style={{ marginTop: 20 }}><AreaPills areas={nearby} /></div>
          </div>
        </section>
      ) : null}

      <section className="wt-faq">
        <div className="wt-inner">
          <h2 className="wt-h2">Questions about {town} water</h2>
          {faqs.map((f, i) => (
            <details key={f.question} open={i === 0}><summary>{f.question}</summary><p>{f.answer}</p></details>
          ))}
          <p className="wt-fine" style={{ marginTop: 32 }}>
            Hardness as mg/L calcium carbonate from water company drinking-water tests and postcode checkers. See the <Link href="/guides/water-hardness-map">UK hardness map</Link> for every area.
          </p>
        </div>
      </section>
    </div>
  );
}

// ── /guides/water-hardness-map ────────────────────────────────────────────────

const MAP_REGIONS = [
  ["London and the Thames Valley", "Very hard. The Thames catchment sits almost entirely on chalk and oolitic limestone. Thames Water and Affinity Water both report hardness consistently in the range of 250–350 mg/L CaCO₃, with some eastern supply zones touching 400 mg/L. This is among the hardest water supplied to any major city in Europe. Limescale is a persistent household problem, and appliance manufacturers selling into this market routinely recommend the use of water softener salt in dishwashers."],
  ["East Anglia and the East Midlands", "Hard to very hard. Anglian Water serves one of the driest and geologically flattest parts of the country, drawing heavily on chalk aquifers. Hardness across much of Norfolk, Suffolk, Cambridgeshire, and Lincolnshire falls in the 200–350 mg/L range. The same chalk that gives East Anglian arable land its free-draining character makes the water hard."],
  ["The Midlands", "Generally hard. Severn Trent serves a geologically varied area, but much of the central Midlands (Birmingham, Coventry, Leicester) receives water in the 200–280 mg/L range. Parts of the west, drawing on Severn and Welsh sources, are somewhat softer."],
  ["Yorkshire", "Moderate to hard. Yorkshire Water draws from a mix of Pennine upland reservoirs, which produce soft water, and local groundwater sources. The blend means hardness varies across the region from around 80 mg/L in upland West Yorkshire to 200 mg/L or above in parts of the East Riding, where chalk underlies the landscape."],
  ["Northwest England", "Soft. United Utilities, which serves Greater Manchester, Merseyside, Lancashire, and Cumbria, draws heavily from upland Pennine and Lake District reservoirs. Hardness across much of this region falls in the 50–100 mg/L range, soft enough that limescale is rarely a practical problem. Greater Manchester typically measures around 60–80 mg/L."],
  ["Wales", "Soft. Dwr Cymru (Welsh Water) sources most of its supply from upland reservoirs over impermeable Palaeozoic rocks. Hardness across Wales is generally below 80 mg/L, with many western and northern areas below 50 mg/L. The water is among the softest publicly supplied in Britain."],
  ["Scotland", "Soft. Scottish Water draws on loch and river sources flowing over granite and metamorphic rock. Hardness across most of Scotland is below 60 mg/L, with Highland and island supplies often below 30 mg/L. The exception is the Central Belt, where some groundwater sources produce moderately harder water, though still well below the levels seen in southeast England."],
];

export function HardnessMapGuide({ districts, hardest, softest, veryHardShare, year, dateModified }: {
  districts: HardnessMapDistrict[];
  hardest: HardnessMapArea[];
  softest: HardnessMapArea[];
  veryHardShare: number;
  year: number;
  dateModified: string;
}) {
  return (
    <div className="wt">
      <Crumbs items={[{ label: "Home", href: "/" }, { label: "Guides", href: "/guides" }, { label: "Water Hardness Map" }]} />

      <section className="wt-chalk" id="wt-hardness">
        <div className="wt-inner">
          <h1 className="wt-h2" style={{ fontSize: "clamp(2.4rem, 6vw, 4.6rem)", maxWidth: "18ch" }}>
            UK Water Hardness Map: Hard and Soft Water Areas by Postcode ({year})
          </h1>
          <p className="wt-byline">
            By <strong>TapWater.uk Research</strong> · <time dateTime={dateModified}>Updated {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</time> · Independent research
          </p>
          <p className="wt-sub" style={{ marginTop: 28 }}>
            This is not a drawing of regions. Each dot is a postcode district placed at its real coordinates and coloured by the hardness its water company reported, so the
            chalk of the south-east and the granite of the north and west show up as the country&rsquo;s own shape.
            {veryHardShare > 0 ? <> Across the map, <strong>{veryHardShare}% of districts</strong> are hard or very hard.</> : null}
          </p>
          <div id="map"><HardnessMap districts={districts} /></div>
        </div>
      </section>

      <section className="wt-band wt-band--white">
        <div className="wt-inner">
          <div className="wt-prose">
            <p>
              Turn on a tap in central London and the water that comes out has travelled through chalk and limestone aquifers that have been dissolving calcium and magnesium
              salts for thousands of years. Turn on a tap in the Scottish Highlands and the water has flowed over ancient granite, picking up almost nothing along the way. Same
              country, completely different water. That variation, from some of the hardest supplies in Europe to some of the softest, is one of the defining characteristics of
              UK tap water, and it touches everything from how much you spend on descaling products to how your skin feels after a shower.
            </p>
            <p>
              Water hardness is measured in milligrams per litre of calcium carbonate equivalent (mg/L CaCO<sub>3</sub>). The UK&apos;s Drinking Water Inspectorate does not set a
              maximum limit for hardness because it poses no direct health risk, but water companies are required to monitor it as a regulated parameter. The results reveal a
              stark geographical divide that maps almost exactly onto the underlying geology of the British Isles.
            </p>
          </div>
          <div style={{ marginTop: 48 }}>
            <CheckPostcode heading="Am I in a hard water area?" intro="Enter the first part of your postcode. You get the hardness reading for your district from your water company's own tests, on the scale below, plus the rest of your water report." />
          </div>
          <HardnessScale caption="Hardness in mg/L as calcium carbonate, the scale UK water companies report in." />
        </div>
      </section>

      {hardest.length > 0 ? (
        <section className="wt-band wt-band--foam">
          <div className="wt-inner">
            <h2 className="wt-h2" id="hardest-and-softest">The hardest and softest water areas</h2>
            <p className="wt-sub">Ranked by the median of the measured districts in each postcode area. The range shows how much hardness varies inside the area, which is why a postcode check beats any map.</p>
            <div className="wt-twocol" style={{ marginTop: 32 }}>
              <AreaTable title="Hardest water" areas={hardest} />
              <AreaTable title="Softest water" areas={softest} />
            </div>
          </div>
        </section>
      ) : null}

      <section className="wt-band wt-band--white">
        <div className="wt-inner wt-prose">
          <h2 className="wt-h2">What makes water hard?</h2>
          <p style={{ marginTop: 20 }}>
            Rainwater is naturally soft and slightly acidic. As it percolates through soil and rock, it dissolves minerals it encounters; the chemistry depends entirely on what
            those rocks are made of. In southeast England, East Anglia, and much of the Midlands, the underlying geology is chalk and limestone. These are composed largely of
            calcium carbonate, and slightly acidic rainwater dissolves them readily, loading the water with calcium and magnesium ions before it reaches the aquifer.
          </p>
          <p>
            When this water is heated, or when it evaporates, those dissolved minerals come back out of solution and deposit as scale, the white or off-white crust you find
            around taps, on heating elements, and inside kettles. The technical term is calcium carbonate precipitation, but most people just call it limescale.
          </p>
          <p>
            Scotland, Wales, and much of northwest England sit on much older and harder geology: granite, gneiss, and other igneous or metamorphic rocks that resist
            dissolution. Water flowing over these surfaces picks up very little mineral content, emerging as soft water with low calcium and magnesium concentrations. The Lake
            District, Snowdonia, and the Scottish Highlands all share this characteristic. The peat moorland common in these areas adds a further twist: it can make water
            slightly acidic and discoloured, which is why water from these regions sometimes requires additional treatment before it reaches your tap.
          </p>
          <p>
            There is no hard cut-off between hard and soft. The conventional classification used by UK water companies runs roughly as follows: below 100 mg/L is considered
            soft, 100–200 mg/L is moderately hard, 200–300 mg/L is hard, and above 300 mg/L is very hard. A handful of supply zones in Bedfordshire and Hertfordshire reach
            400 mg/L or above.
          </p>

          <h2 className="wt-h2" style={{ marginTop: 56 }}>Hard water in the UK by region</h2>
          <p style={{ marginTop: 20 }}>
            The regional picture is consistent enough that you can predict water hardness from a map of Britain&apos;s geology with reasonable accuracy. Here is how the main
            regions break down based on published water company compliance data and DWI regional summaries.
          </p>
          {MAP_REGIONS.map(([name, text]) => (
            <div key={name}><h3>{name}</h3><p>{text}</p></div>
          ))}

          <h2 className="wt-h2" style={{ marginTop: 56 }}>Does hard water matter?</h2>
          <p style={{ marginTop: 20 }}>
            From a health perspective, the scientific consensus is that hard water is not a concern, and may offer a marginal benefit. The calcium and magnesium in hard
            water contribute to dietary mineral intake, and some epidemiological studies have reported associations between hard water and lower cardiovascular disease
            rates, though the evidence is not conclusive enough to have changed public health guidelines. The World Health Organisation has reviewed the evidence and does
            not recommend any health-based guideline value for hardness.
          </p>
          <p>
            Where hard water does matter is in its practical effects on your home and the things in it. The most significant is energy efficiency. Limescale deposits on
            heating elements act as an insulator: a study by the Water Quality Research Foundation found that just 1.6mm of scale on a heating element increases energy
            consumption by around 12 percent. Over the lifetime of a boiler or hot water cylinder, scale accumulation in a hard water area can add hundreds of pounds to
            energy bills and significantly shorten the life of the appliance.
          </p>
          <p>
            Beyond energy, the everyday effects include: soap and shampoo lathering less effectively (because calcium ions react with fatty acid components of soap to form
            scum), laundry requiring more detergent to achieve the same result, and shower screens and taps requiring more frequent cleaning. Some people report that very
            hard water leaves their skin feeling dry, though whether this is a direct effect of the mineral content or a consequence of using more soap to compensate is
            debated.
          </p>
          <p>
            It is worth noting that soft water has its own mild disadvantage: it is slightly more corrosive than hard water, and in areas with old lead or copper pipework, very
            soft acidic water can leach more metal from pipes than hard water would. Water companies in soft water areas typically adjust pH during treatment to reduce
            this risk.
          </p>

          <h2 className="wt-h2" style={{ marginTop: 56 }}>Solutions for hard water</h2>
          <p style={{ marginTop: 20 }}>If you live in a hard water area, you have several options, ranging from targeted descaling to whole-house softening.</p>
          <p>
            <strong>Ion exchange water softeners</strong> are the most effective solution for whole-house hardness removal. They work by passing water through a resin bed
            that exchanges calcium and magnesium ions for sodium ions. The result is genuinely soft water throughout the house. Installation costs typically run from £400 to
            £800 for a standard domestic unit, with ongoing costs for salt refills (roughly £5–£10 per month for an average household). The technology is mature and
            reliable; units from reputable manufacturers routinely last 15 to 20 years.
          </p>
          <p>
            One important caveat: water softened by ion exchange should not be used as drinking water from the cold tap. The sodium content of softened water is elevated,
            which is a concern for people on sodium-restricted diets, for infants, and for those preparing baby formula. British Water, the industry trade association,
            recommends maintaining an unsoftened cold tap in the kitchen for drinking and cooking.
          </p>
          <p>
            <strong>Scale inhibitors</strong> (also called physical water conditioners or electromagnetic conditioners) are considerably cheaper and easier to install,
            typically costing £100–£300. They do not remove hardness minerals from the water but alter the form in which calcium carbonate deposits, producing a softer,
            more easily removed powder rather than the hard crystalline scale. Independent evidence for their effectiveness is more limited than for ion exchange softeners,
            and performance varies significantly between products and water conditions.
          </p>
          <p>
            For targeted solutions, appliance-level approaches are often more practical. Using a water filter jug reduces scale in kettles. Adding dishwasher salt to your
            dishwasher (and setting the hardness level correctly for your area) protects the machine and improves wash results significantly. Descaling products applied
            regularly to showers, taps, and kettles are inexpensive and effective at removing existing scale.
          </p>
          <p className="wt-note">
            Related: <Link href="/guides/best-kettle-for-hard-water-uk">best kettle for hard water</Link> and <Link href="/guides/best-boiling-water-tap-uk">best boiling water tap</Link>.
          </p>
        </div>
      </section>

      <section className="wt-chalk">
        <div className="wt-inner">
          <h2 className="wt-h2">In the amber on the map?</h2>
          <p className="wt-sub">
            If you want something you can buy today rather than have fitted, these are the two we point hard-water readers to most. Neither reduces hardness itself: one deals
            with the chlorine that makes hard water rough on skin and hair, the other gives you soft, mineral-free drinking water from a unit that plugs in.
          </p>
          <div className="wt-do-grid" style={{ marginTop: 32 }}>
            <SoftenerPanel hardness={220} heading="Anything over 180 mg/L is softener territory" intro="Get free quotes from installers covering your postcode and compare at least two before you buy." />
            <div className="wt-side">
              <div className="wt-second">
                <h3>Best water softeners compared</h3>
                <p>Harvey, Kinetico and the rest, on price, salt use and what they are like to live with.</p>
                <p><GuideLink href="/guides/best-water-softener-uk">Read the comparison</GuideLink></p>
              </div>
            </div>
          </div>
          <Picks pageType="guide" placement="guide-solutions" reason="hard-water" />
          <div className="wt-form">
            <SoftenerLeadForm hardnessValue={220} hardnessLabel="hard" source="hardness_map" heading="In the amber on the map?" intro="Anything over 180 mg/L is softener territory. Get free quotes from installers covering your postcode and compare at least two before you buy." />
          </div>
        </div>
      </section>

      <section className="wt-band wt-band--foam">
        <div className="wt-inner">
          <CheckPostcode heading="Check your water hardness" intro="Enter your postcode to see the hardness reading and other quality data for your supply zone, sourced from your water company's published compliance data." />
          <h2 className="wt-h2" style={{ marginTop: 56 }}>Sources</h2>
          <ul className="wt-sources" style={{ marginTop: 16 }}>
            <li>Drinking Water Inspectorate, <em>Drinking Water 2024: A report by the Chief Inspector of Drinking Water</em>, DWI, 2025.</li>
            <li>Water Quality Research Foundation, <em>Scale and Energy Use in Water Heaters</em>, WQRF Technical Report, 2009.</li>
            <li>British Water, <em>Code of Practice for the Installation of Water Softeners</em>, British Water, 2023.</li>
            <li>World Health Organisation, <em>Hardness in Drinking Water: Background document for development of WHO Guidelines for Drinking-water Quality</em>, WHO, 2011.</li>
            <li>Water company annual compliance reports: Thames Water, Anglian Water, Severn Trent, Yorkshire Water, United Utilities, Dwr Cymru, Scottish Water, 2024–25.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
