import type { Metadata } from "next"
import Link from "next/link"
import { FlaskConical } from "lucide-react"
import { PostcodeSearch } from "@/components/postcode-search"
import { ArticleSchema } from "@/components/json-ld"

export const metadata: Metadata = {
  title: "How to Test Your Tap Water at Home (2026 Guide)",
  description:
    "Want to know exactly what's in your tap water? Here's how to test it yourself — from DIY test strips to professional lab analysis.",
  openGraph: {
    title: "How to Test Your Tap Water at Home (2026 Guide)",
    description:
      "Want to know exactly what's in your tap water? Here's how to test it yourself — from DIY test strips to professional lab analysis.",
    url: "https://tapwater.uk/guides/how-to-test-your-water/",
    type: "article",
  },
}

export default function HowToTestYourWaterPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-14">
      <div className="max-w-3xl mx-auto">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted mb-8">
          <Link href="/" className="hover:text-ink transition-colors">Home</Link>
          <span>/</span>
          <Link href="/guides" className="hover:text-ink transition-colors">Guides</Link>
          <span>/</span>
          <span className="text-body">How to Test Your Water</span>
        </nav>

        <ArticleSchema
          headline="How to Test Your Tap Water at Home (2026 Guide)"
          description="Want to know exactly what's in your tap water? Here's how to test it yourself — from DIY test strips to professional lab analysis."
          url="https://tapwater.uk/guides/how-to-test-your-water/"
          datePublished="2026-04-01"
          dateModified="2026-04-02"
          authorName="Remy"
          authorUrl="https://tapwater.uk/about"
        />

        <h1 className="font-display text-3xl lg:text-4xl italic text-ink mb-4 leading-tight">
          How to Test Your Tap Water at Home (2026 Guide)
        </h1>
        <div className="flex items-center gap-2 mt-3 mb-8 text-sm text-muted">
          <span>By <span className="text-ink font-medium">Remy</span></span>
          <span>·</span>
          <time dateTime="2026-04-02">April 2026</time>
          <span>·</span>
          <span>Independent research</span>
        </div>

        <p className="text-base text-body leading-relaxed mb-4">
          The Drinking Water Inspectorate monitors tap water quality at thousands of points across
          England and Wales every year. Water companies carry out millions of individual tests
          on their supplies. The data is comprehensive by any international standard, and the vast
          majority of it is publicly available &mdash; which is the premise that TapWater.uk is
          built on.
        </p>
        <p className="text-base text-body leading-relaxed mb-8">
          But regulatory monitoring has a structural limitation: it measures water quality within
          supply zones and at treatment works, not necessarily at your specific tap. Water travels
          through kilometres of distribution mains, then through smaller communication pipes, then
          through your property&apos;s own internal plumbing, before it reaches you. What happens
          along that last stretch &mdash; particularly in older buildings with old pipes &mdash;
          is largely invisible to the regulatory data. If you want to know what is actually
          coming out of your kitchen tap, rather than what is leaving the treatment works serving
          your area, independent testing is the only way to find out.
        </p>

        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">Why test your own water?</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          There are four main situations where home water testing makes practical sense.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          <strong className="text-ink">Old pipework and lead risk.</strong> Lead water pipes were
          commonly used in UK domestic plumbing until they were phased out in the 1970s. Properties
          built before around 1970 may still have lead supply pipes, lead solder on copper joints,
          or lead in the internal plumbing. The DWI&apos;s own data shows that lead exceedances in
          England and Wales are almost entirely a plumbing problem, not a treatment problem &mdash;
          the water leaves the treatment works compliant, but picks up lead on the way to the tap
          in properties with old pipes. If you live in a pre-1970 home and have never had your
          water tested for lead, this is the most evidence-based reason to do so.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          <strong className="text-ink">Private water supplies.</strong> Approximately 1.7 percent
          of properties in England and Wales &mdash; around 600,000 people &mdash; are served by
          private water supplies: boreholes, springs, streams, and wells. These are not covered
          by DWI regulation in the same way as mains supplies. Local authorities are responsible
          for inspecting private supplies, but the intervals between inspections can be long, and
          many private supply owners have no recent quality data at all. If you rely on a private
          supply, regular testing is not optional &mdash; it is the only way to know whether
          your water is safe.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          <strong className="text-ink">Taste, smell, or appearance concerns.</strong> If your
          water has developed a noticeable taste, smell, or discolouration that you have not
          been able to resolve with your water company, testing can help diagnose the cause.
          Chlorine taste is usually a treatment or distribution issue; a metallic taste might
          indicate elevated copper or zinc from pipework; an earthy or musty smell can suggest
          microbial activity or organic compounds. A water test will not always identify the
          source of the problem, but it narrows down the possibilities.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          <strong className="text-ink">Reassurance after an incident.</strong> If your area has
          recently experienced a boil water notice, a supply contamination event, or major
          maintenance work on local infrastructure, and you want confirmation that your tap
          water is back to normal before you stop boiling, a post-incident test provides
          documented evidence rather than just a water company&apos;s assurance.
        </p>

        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">Types of water testing</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Home water testing spans a wide range of methods, from inexpensive dip-and-read
          strips to full laboratory analysis with certified results. Understanding what each
          tier can and cannot tell you is essential before you spend money on testing.
        </p>

        <div className="space-y-4 mb-8">

          <div className="card p-5">
            <div className="flex items-start gap-3">
              <FlaskConical className="w-5 h-5 text-muted mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-sans font-semibold text-ink">DIY test strips</h3>
                  <span className="text-xs font-data text-muted bg-wash border border-rule rounded px-2 py-0.5">&pound;10&ndash;&pound;20</span>
                </div>
                <p className="text-base text-body leading-relaxed">
                  Colour-change indicator strips that you dip in a water sample and read
                  against a colour chart. The better consumer kits test for pH, total hardness,
                  chlorine, nitrate, nitrite, and sometimes iron or lead. They are quick,
                  require no equipment, and give a rough answer in two minutes. The major
                  limitation is precision: the colour gradations are broad, the sensitivity
                  thresholds are not fine enough to detect, say, 8 &mu;g/L lead versus 3 &mu;g/L
                  lead, and results are highly dependent on lighting conditions and user
                  interpretation. For a quick sanity check &mdash; confirming that chlorine is
                  present, that pH is in a normal range, that hardness is broadly as expected
                  &mdash; test strips are adequate. For identifying a potential health concern,
                  they are not.
                </p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-start gap-3">
              <FlaskConical className="w-5 h-5 text-muted mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-sans font-semibold text-ink">Mail-in home test kits</h3>
                  <span className="text-xs font-data text-muted bg-wash border border-rule rounded px-2 py-0.5">&pound;25&ndash;&pound;50</span>
                </div>
                <p className="text-base text-body leading-relaxed">
                  These kits provide a pre-labelled sample container and return packaging.
                  You collect the sample following the included instructions, post it to the
                  company&apos;s laboratory, and receive results by email within a few days.
                  A typical mid-range kit analyses five to ten parameters: commonly lead,
                  bacteria (total and coliform), pH, hardness, nitrate, and chlorine. The
                  results are laboratory-measured rather than colour-chart estimates, and the
                  precision is sufficient to identify a lead problem. The limitation is scope:
                  a kit testing ten parameters will not tell you about pesticides, PFAS,
                  arsenic, or the other 38 regulated parameters unless you select a broader
                  panel. Most providers offer multiple tiers at different price points.
                </p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-start gap-3">
              <FlaskConical className="w-5 h-5 text-muted mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-sans font-semibold text-ink">Professional laboratory analysis</h3>
                  <span className="text-xs font-data text-muted bg-wash border border-rule rounded px-2 py-0.5">&pound;50&ndash;&pound;150+</span>
                </div>
                <p className="text-base text-body leading-relaxed">
                  UKAS-accredited laboratory testing covers the full range of regulated parameters
                  and beyond, typically including 20 or more substances tested by inductively
                  coupled plasma mass spectrometry (ICP-MS) for metals, ion chromatography for
                  anions, and microbiological culture for bacteria. The results carry documentary
                  weight: they can be used in a property transaction, a landlord-tenant dispute,
                  or as evidence in a complaint to a water company or regulator. For private supply
                  owners, UKAS-accredited results are often required by local authorities as part
                  of compliance obligations. Professional testing is also the only way to get a
                  reliable private measurement for PFAS, which requires specialist analytical
                  equipment and is not available from most consumer-facing test providers.
                </p>
              </div>
            </div>
          </div>

        </div>

        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">What to test for</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          The right test panel depends on what you are trying to find out. Rather than defaulting
          to the most comprehensive (and most expensive) option, it is worth matching the test
          to the specific concern.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          <strong className="text-ink">For lead:</strong> any mail-in kit that includes ICP-MS
          metal analysis will give you a reliable lead measurement. Ensure the kit instructions
          tell you whether to collect a first-flush sample (the water that has been sitting in
          your pipes, which will show the highest potential lead concentration) or a flushed
          sample (after running the tap, which shows what you would normally drink). Both are
          informative but measure different things.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          <strong className="text-ink">For bacteria:</strong> microbiological testing requires
          a sterile sample container and prompt dispatch &mdash; samples must typically reach the
          lab within 12 to 24 hours of collection. A basic test covers <em>E. coli</em> and total
          coliforms; more comprehensive panels add Enterococcus and heterotrophic plate counts.
          This is essential for private supply owners and relevant for anyone investigating an
          unexplained gastrointestinal illness.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          <strong className="text-ink">For hardness:</strong> DIY test strips or a basic mail-in
          kit are sufficient. Hardness is easy and cheap to measure accurately. If your concern
          is limescale and appliance protection, there is no need for a comprehensive multi-parameter
          analysis.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          <strong className="text-ink">For PFAS:</strong> this is expensive to test privately
          (typically &pound;100 or above as a standalone panel) because it requires liquid
          chromatography-tandem mass spectrometry (LC-MS/MS) analysis, which is not available
          from most consumer-facing providers. For most mains water users, the better approach
          is to check the TapWater.uk PFAS data for your supply zone, which is based on
          monitoring carried out under the DWI&apos;s national PFAS programme. Private
          testing for PFAS makes most sense for private supply owners near known
          contamination sites &mdash; military airfields, fire training sites, or industrial
          facilities that used AFFF firefighting foam.
        </p>

        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">How to take a sample</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Sample quality is as important as the quality of the analysis. A poorly collected
          sample can produce misleading results regardless of how good the laboratory is.
          Follow the instructions supplied with your test kit carefully; the guidance below
          applies as general principles.
        </p>

        <ol className="list-decimal pl-6 space-y-3 text-base text-body leading-relaxed mb-6">
          <li>
            <strong className="text-ink">Decide whether you want a first-flush or flushed
            sample.</strong> A first-flush sample is collected without running the tap first
            and represents the water that has been sitting in your pipes, potentially leaching
            lead or other metals from plumbing materials. This gives the worst-case picture. A
            flushed sample &mdash; collected after running the tap for 30 to 60 seconds &mdash; is
            more representative of what you normally drink. Most health-focused tests for lead
            recommend the first-flush approach.
          </li>
          <li>
            <strong className="text-ink">Use the container provided with your kit.</strong> Do not
            substitute your own bottle, even a clean one. Test containers are pre-treated for the
            specific analysis: microbiological containers are sterilised and may contain sodium
            thiosulphate to neutralise residual chlorine; metal analysis containers may be
            acid-washed to prevent contamination. Using the wrong container invalidates the result.
          </li>
          <li>
            <strong className="text-ink">Do not touch the inside of the container or lid.</strong>
            Hold the container from the outside, and collect the sample by holding it directly
            under the flowing tap rather than pouring it in from another vessel. Even trace amounts
            of contaminant from your hands can affect microbiological results.
          </li>
          <li>
            <strong className="text-ink">Fill to the correct level.</strong> Some analyses require
            an exact volume; most containers are marked with a fill line. Overfilling a
            microbiological container can displace the preservative agent.
          </li>
          <li>
            <strong className="text-ink">Label and dispatch promptly.</strong> Most kits include
            a pre-addressed return envelope or courier bag. For microbiological samples, post
            on the same day, preferably on a day when the sample will arrive at the lab within
            24 hours. Avoid posting on a Friday if the lab is closed over the weekend.
          </li>
          <li>
            <strong className="text-ink">Note the conditions.</strong> Record the date, time,
            whether the water had been standing in the pipes, whether you flushed the tap first,
            and anything unusual about the water (colour, smell, taste). This context is useful
            when interpreting results and when discussing them with the testing company.
          </li>
        </ol>

        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">UK water testing services</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Two broad categories of provider offer water testing services to UK households and
          businesses. Independent consumer-facing services offer packaged kits at set price
          points, typically with simple result interpretation and customer support. They are
          well suited to first-time testers, lead checks in domestic properties, and routine
          private supply monitoring.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          UKAS-accredited analytical laboratories offer the highest standard of precision and
          produce results that carry formal documentary weight. They are the right choice for
          private supply compliance testing, landlord obligations, property transactions, or
          any situation where the results may need to be presented to a local authority,
          regulator, or court. UKAS (the United Kingdom Accreditation Service) maintains
          a publicly searchable register of accredited laboratories at ukas.com, where you
          can search for providers accredited for drinking water analysis under ISO 17025.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          When selecting a provider, confirm which parameters are included in your chosen
          panel, whether the laboratory holds UKAS accreditation for those specific tests,
          and what the turnaround time is. Also check whether the kit includes sampling
          containers for all the analyses you need: metal and chemical analysis, microbiological
          analysis, and physical parameters often require separate containers with different
          preservation requirements.
        </p>

        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">Check what we already know</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Before commissioning a test, it is worth checking whether the data you need already
          exists. TapWater.uk aggregates DWI compliance data, Environment Agency monitoring
          results, and water company zone-level readings. For many concerns &mdash; especially
          for households on mains supplies in modern properties without old pipework &mdash;
          the existing regulatory data is sufficient to answer the question.
        </p>
        <p className="text-base text-body leading-relaxed mb-6">
          Enter your postcode below to see the most recent quality data for your supply zone.
          If the data shows a parameter of concern, or if your property has characteristics
          that the zone-level data cannot capture &mdash; old pipework, a private supply,
          a recent incident nearby &mdash; that is the point at which personal testing
          adds genuine value.
        </p>

        <PostcodeSearch size="sm" />

        <div className="card p-5 mt-8">
          <p className="text-sm text-body leading-relaxed">
            <strong className="text-ink">Note:</strong> TapWater.uk presents regulatory monitoring data
            collected by the Drinking Water Inspectorate, Environment Agency, and water companies.
            This data covers supply zones, not individual properties. It is informative but not a
            substitute for tap-level testing in properties with old lead plumbing or private water
            supplies. Nothing on this site constitutes health advice. If you have specific concerns,
            contact your water company or a qualified water testing laboratory.
          </p>
        </div>

      </div>
    </div>
  )
}
