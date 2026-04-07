import type { Metadata } from "next"
import Link from "next/link"
import { FileText, AlertTriangle } from "lucide-react"
import { ArticleSchema } from "@/components/json-ld"

export function generateMetadata(): Metadata {
  const year = new Date().getFullYear()
  return {
    title: `Understanding Your Water Supplier (${year})`,
    description:
      "How to read your water company's compliance report. What the DWI measures, compliance rates, and how to check your supplier.",
    openGraph: {
      title: `Understanding Your Water Supplier (${year})`,
      description:
        "How to read your water company's compliance report. What the DWI measures, compliance rates, and how to check your supplier.",
      url: "https://www.tapwater.uk/guides/understanding-your-water-supplier",
      type: "article",
    },
  }
}

const SUPPLIERS = [
  { name: "Thames Water", slug: "thames-water", region: "London and the Thames Valley" },
  { name: "Anglian Water", slug: "anglian-water", region: "East Anglia and Lincolnshire" },
  { name: "Severn Trent", slug: "severn-trent", region: "Midlands and Mid-Wales" },
  { name: "United Utilities", slug: "united-utilities", region: "Northwest England" },
  { name: "Yorkshire Water", slug: "yorkshire-water", region: "Yorkshire" },
  { name: "Southern Water", slug: "southern-water", region: "Kent, Sussex, Hampshire" },
  { name: "South West Water", slug: "south-west-water", region: "Devon and Cornwall" },
  { name: "Affinity Water", slug: "affinity-water", region: "East of England and Southeast" },
  { name: "Dwr Cymru (Welsh Water)", slug: "welsh-water", region: "Wales" },
  { name: "Wessex Water", slug: "wessex-water", region: "Dorset, Somerset, Wiltshire" },
  { name: "South East Water", slug: "south-east-water", region: "Kent and Sussex" },
  { name: "Portsmouth Water", slug: "portsmouth-water", region: "Hampshire" },
  { name: "Bristol Water", slug: "bristol-water", region: "Bristol and North Somerset" },
  { name: "Northumbrian Water", slug: "northumbrian-water", region: "Northeast England" },
  { name: "Scottish Water", slug: "scottish-water", region: "Scotland" },
  { name: "NI Water", slug: "ni-water", region: "Northern Ireland" },
]

export default function UnderstandingYourWaterSupplierPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-14">
      <div className="max-w-3xl mx-auto">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted mb-8">
          <Link href="/" className="hover:text-ink transition-colors">Home</Link>
          <span>/</span>
          <Link href="/guides" className="hover:text-ink transition-colors">Guides</Link>
          <span>/</span>
          <span className="text-body">Understanding Your Water Supplier</span>
        </nav>

        <ArticleSchema
          headline={`Understanding Your Water Company's Quality Report (${new Date().getFullYear()})`}
          description="How to read your water company's compliance report. What the DWI measures, what compliance rates mean, and how to check if your supplier is meeting standards."
          url="https://www.tapwater.uk/guides/understanding-your-water-supplier"
          datePublished="2026-04-01"
          dateModified={new Date().toISOString().split("T")[0]}
          authorName="Remy"
          authorUrl="https://www.tapwater.uk/about"
        />

        <h1 className="font-display text-3xl lg:text-4xl italic text-ink mb-4 leading-tight">
          Understanding Your Water Company&apos;s Quality Report ({new Date().getFullYear()})
        </h1>
        <div className="flex items-center gap-2 mt-3 mb-8 text-sm text-muted">
          <span>By <span className="text-ink font-medium">Remy</span></span>
          <span>·</span>
          <time dateTime={new Date().toISOString().split("T")[0]}>Updated {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</time>
          <span>·</span>
          <span>Independent research</span>
        </div>

        <p className="text-base text-body leading-relaxed mb-4">
          Every year, every water company in England and Wales is required to publish a detailed
          compliance report showing how its water performed against 48 regulated parameters.
          These reports exist because of a legal framework built on the 1989 Water Act, the
          2000 Water Supply (Water Quality) Regulations, and their subsequent amendments &mdash;
          a framework designed to give the public a right to know what is in their water. In
          practice, the data is published in formats that require some effort to interpret.
          This guide explains how the regulatory system works, what the numbers mean, and how
          to use TapWater.uk to find the information that matters for your area.
        </p>
        <p className="text-base text-body leading-relaxed mb-8">
          In Scotland, drinking water quality is regulated by the Drinking Water Quality Regulator
          for Scotland (DWQR), operating under broadly similar principles to the DWI but with
          its own reporting structure. In Northern Ireland, the Drinking Water Inspectorate
          for Northern Ireland (DWI-NI) performs the equivalent function. The data that
          TapWater.uk presents covers England and Wales via the DWI; we are working to expand
          coverage to Scotland and Northern Ireland.
        </p>

        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">Who regulates UK drinking water?</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          The Drinking Water Inspectorate was established in 1990, shortly after the privatisation
          of water companies in England and Wales, specifically to provide independent oversight of
          the new commercial operators. It sits within the Department for Environment, Food and
          Rural Affairs (Defra) but operates independently. Its core functions are to inspect
          water companies, investigate failures and consumer complaints, prosecute where legal
          standards have been breached, and publish the annual Chief Inspector&apos;s report on
          drinking water quality across England and Wales.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The DWI does not set the regulatory standards itself &mdash; those come from EU-derived
          legislation now retained in domestic law via the Water Supply (Water Quality) Regulations
          2016. What the DWI does is enforce them. It employs a team of qualified water quality
          professionals who carry out on-site inspections of treatment works and distribution
          infrastructure, review the testing data that water companies are legally required to
          submit, and have the power to issue Notices of Intention requiring companies to improve
          their performance.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          In Scotland, DWQR performs the same oversight role for Scottish Water, the publicly
          owned utility that serves the entire country. DWI-NI operates similarly for NI Water
          in Northern Ireland. All three regulators publish annual reports, and their data
          ultimately underpins what you see on TapWater.uk.
        </p>

        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">What gets tested?</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          The regulations specify 48 parameters that must be monitored at the tap. They fall
          into three broad groups.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          <strong className="text-ink">Microbiological parameters</strong> are the most
          immediately safety-critical. The primary indicators are <em>E. coli</em> and total
          coliform bacteria. Their presence in treated drinking water is a regulatory failure
          with a prescribed concentration or value (PCV) of zero: any detection requires
          immediate investigation and, if confirmed, remedial action. Intestinal enterococci
          and <em>Clostridium perfringens</em> are also monitored as additional indicators
          of potential faecal contamination. The frequency of microbiological testing is
          proportional to the size of the supply zone and typically involves multiple samples
          per zone per month.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          <strong className="text-ink">Chemical parameters</strong> cover the widest range of
          substances and are where most of the technical complexity lies. The regulated list
          includes lead (a PCV of 10 micrograms per litre, tightened from 25 &mu;g/L in 2013),
          nitrate (50 mg/L, primarily a concern in agricultural areas), pesticides (individual
          substances at 0.1 &mu;g/L, aggregate at 0.5 &mu;g/L), trihalomethanes (total at 100
          &mu;g/L, a by-product of chlorination), arsenic, fluoride, copper, and polycyclic
          aromatic hydrocarbons. PFAS &mdash; per- and polyfluoroalkyl substances &mdash; have recently
          been added as regulated parameters under updated guidance, reflecting growing concern
          about their presence in source water catchments.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          <strong className="text-ink">Physical and indicator parameters</strong> include
          turbidity (cloudiness, measured in nephelometric turbidity units), colour, odour,
          taste, pH, and conductivity. These are not primarily health parameters but are important
          for treatment efficiency and consumer confidence. Very high turbidity, for example, can
          protect pathogens from disinfection by chlorine.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          A PCV (Prescribed Concentration or Value) is the legal maximum for each parameter.
          For some parameters, such as hardness, colour, and temperature, the regulations specify
          an acceptable range or target rather than an absolute maximum. Where no PCV exists,
          the regulations may still require that water is &ldquo;wholesome&rdquo; &mdash; a somewhat elastic
          legal standard that the DWI interprets on a case-by-case basis.
        </p>

        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">What compliance rates mean</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          The headline compliance figure published by the DWI for England and Wales is typically
          around 99.96 percent. This number appears reassuring, and in the context of what it
          represents &mdash; the proportion of individual test results that fall within their legal
          limit &mdash; it is genuinely impressive. But it requires careful interpretation.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          Water companies collectively carry out several million individual regulatory tests each
          year. At 99.96 percent compliance, that leaves roughly 4,000 test failures annually
          across England and Wales. Most of these failures are minor, short-lived, and caught
          quickly by the testing regime. A test failure does not automatically mean consumers
          were exposed to unsafe water; in many cases, the water company identifies and resolves
          the cause before the supply is affected. But the raw compliance percentage obscures
          the actual number and nature of individual failures.
        </p>

        <div className="card p-5 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-ink mb-1">Putting the numbers in context</p>
              <p className="text-sm text-body leading-relaxed">
                A 99.96% compliance rate across 10 million tests equals approximately 4,000
                individual test failures. The significance of each failure depends on the
                parameter, the concentration, and how quickly it was identified and remedied.
                A single turbidity exceedance during a storm event is very different from
                persistent lead exceedances across a supply zone.
              </p>
            </div>
          </div>
        </div>

        <p className="text-base text-body leading-relaxed mb-4">
          The DWI&apos;s annual report breaks down compliance by parameter and by water company,
          which gives a more useful picture than the headline aggregate. Parameters with
          the most frequent failures in recent years have been lead (driven by legacy lead
          service pipes in older properties), coliform bacteria (typically isolated incidents
          associated with distribution system disturbance), and certain pesticides in
          agricultural catchments. A company with 99.99 percent compliance may be performing
          significantly better than one at 99.90 percent, even though both numbers look
          high in isolation.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          Compliance figures are also averaged across large supply zones. A zone covering
          a million people will have far more tests than a small rural zone, and failures
          in a small zone may be statistically invisible in the aggregate. This is why
          postcode-level data &mdash; where available &mdash; is more informative than regional
          or company-wide averages.
        </p>

        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">How to read your area&apos;s data</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          TapWater.uk maps your postcode to a DWI supply zone and presents the compliance
          data for that zone alongside the water company&apos;s published readings for each
          regulated parameter. Here is what you are looking at on a typical postcode page.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The safety score at the top summarises how far each measured parameter sits from
          its regulatory limit, weighted by the health significance of the parameter. A score
          of 9 or above means all measured parameters are well within their limits; a score
          below 7 flags that one or more parameters are closer to their PCV than the national
          average. The score is a signal, not a verdict &mdash; you should read the parameter
          table below it to understand which substances are driving the result.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The parameter table shows each regulated substance alongside its measured concentration,
          the legal limit, and a simple visual indicator of the margin. Lead, bacteria, nitrate,
          and PFAS are highlighted separately because they carry the highest health weighting
          in our scoring model. If a parameter shows a reading close to its PCV, the table
          will flag it.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          To find your area&apos;s data, enter your postcode on the{" "}
          <Link href="/" className="text-accent underline hover:text-accent-hover transition-colors">
            TapWater.uk homepage
          </Link>
          {" "}or go directly to a postcode such as{" "}
          <Link href="/postcode/SW1" className="text-accent underline hover:text-accent-hover transition-colors">
            SW1 (central London)
          </Link>
          {" "}or{" "}
          <Link href="/postcode/M1" className="text-accent underline hover:text-accent-hover transition-colors">
            M1 (central Manchester)
          </Link>
          {" "}to see how the data is structured.
        </p>

        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">When to be concerned</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Persistent failures in a single parameter, particularly lead, bacteria, or
          nitrate, merit attention. A one-off exceedance followed by a return to compliance
          is typically the result of a transient issue &mdash; a distribution disturbance,
          a sampling error, or a brief treatment anomaly. Repeated failures in the same
          zone over multiple reporting periods suggest a structural problem that the water
          company has not resolved.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The DWI publishes a list of formal enforcement actions taken against water companies,
          which includes Notices of Intention (essentially formal warnings), Undertakings
          (legally binding improvement commitments), and prosecutions. These are relatively
          rare &mdash; the regulator estimates that around 99 percent of supply zone non-compliances
          are resolved informally without formal action &mdash; but they represent the most serious
          end of the compliance spectrum. The DWI&apos;s enforcement register is publicly accessible
          on its website.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          If you have noticed a change in the taste, smell, or appearance of your tap water,
          or if you have received a notice from your water company about a boil water advisory
          or supply interruption, report it directly to your water company. For incidents that
          your water company has not resolved satisfactorily, you can escalate to the DWI directly
          by contacting its consumer team.
        </p>

        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">Your rights as a consumer</h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Under the Water Industry Act 1991 and the Water Supply (Water Quality) Regulations 2016,
          you have a statutory right to receive water that is wholesome and compliant with all
          prescribed concentrations and values. You also have a right to information: water companies
          must provide details of water quality in your supply zone on request, free of charge.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          The Consumer Council for Water (CCW) is the independent consumer body for the water
          sector in England and Wales. If you are dissatisfied with your water company&apos;s response
          to a complaint about quality, you can escalate to CCW, which has powers to investigate
          and make recommendations. CCW also publishes annual reports on water company customer
          service performance, which include quality complaint data.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          In Scotland, Consumer Scotland handles water-related consumer complaints alongside
          its broader remit. In Northern Ireland, the Consumer Council for Northern Ireland
          performs an equivalent function for NI Water customers.
        </p>
        <p className="text-base text-body leading-relaxed mb-4">
          If you have old lead pipes in your property &mdash; most common in homes built before 1970 &mdash;
          your water company is required to have a policy for replacing lead communication pipes
          (the section of pipe between the water main and your property boundary). The replacement
          of supply pipes within your property is your responsibility, though some companies offer
          subsidised replacement schemes. Contact your water company directly to find out whether
          your street has lead communication pipes and whether a replacement programme is active
          in your area.
        </p>

        <h2 className="font-display text-xl italic mt-10 mb-4 text-ink">Find your supplier</h2>
        <p className="text-base text-body leading-relaxed mb-6">
          The United Kingdom has around 20 licensed water supply companies, ranging from
          the very large (Thames Water serves approximately 15 million customers) to the
          very small (Portsmouth Water serves around 700,000). Your supplier depends on
          your address &mdash; unlike energy, you cannot switch water companies. The links
          below go to each supplier&apos;s page on TapWater.uk, where you can see its
          compliance summary and find the supply zones it operates.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SUPPLIERS.map((supplier) => (
            <Link
              key={supplier.slug}
              href={`/supplier/${supplier.slug}`}
              className="card p-4 flex items-start gap-3 group no-underline"
            >
              <FileText className="w-4 h-4 text-muted mt-0.5 shrink-0 group-hover:text-accent transition-colors" />
              <div>
                <p className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
                  {supplier.name}
                </p>
                <p className="text-xs text-muted mt-0.5">{supplier.region}</p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
