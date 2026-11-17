import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbSchema } from "@/components/json-ld";
import { PartnerSignupForm, type PartnerArea } from "@/components/partner-signup-form";
import { getHardnessMap } from "@/lib/data";
import { HARD_WATER_THRESHOLD } from "@/lib/filters";
import { waitingByArea } from "@/lib/lead-delivery";
import { OG_IMAGE } from "@/lib/og";
import { FREE_LEADS, MAX_INSTALLERS_PER_LEAD, PACK_LEADS, PACK_PRICE_GBP, PRICE_PER_LEAD_GBP, formatGbp } from "@/lib/partner-offer";
import { postcodeAreaName } from "@/lib/postcode-areas";
import { supabase } from "@/lib/supabase";
import "@/components/tank/tank.css";

export const revalidate = 3600;

const TITLE = "Water Softener Leads for Installers";
const DESCRIPTION = `Homeowners who have just checked how hard their water is, asking for softener quotes in your postcode areas. First ${FREE_LEADS} leads free, then ${formatGbp(PRICE_PER_LEAD_GBP)} each. No contract.`;

export function generateMetadata(): Metadata {
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: "https://www.tapwater.uk/partners" },
    openGraph: { images: OG_IMAGE, title: TITLE, description: DESCRIPTION, url: "https://www.tapwater.uk/partners", type: "website" },
    twitter: { images: OG_IMAGE, card: "summary", title: TITLE, description: DESCRIPTION },
  };
}

const WINDOW_DAYS = 90;

async function loadAreas(): Promise<{ areas: PartnerArea[]; total: number }> {
  const [{ areas }, counts] = await Promise.all([
    getHardnessMap(),
    supabase ? waitingByArea(supabase, WINDOW_DAYS) : Promise.resolve(new Map<string, number>()),
  ]);
  const hard = areas
    .filter((a) => a.median >= HARD_WATER_THRESHOLD)
    .map((a) => ({ area: a.area, town: postcodeAreaName(a.area), median: Math.round(a.median), requests: counts.get(a.area) ?? 0 }))
    .sort((a, b) => b.requests - a.requests || b.median - a.median);
  let total = 0;
  for (const n of counts.values()) total += n;
  return { areas: hard, total };
}

const FAQS = [
  {
    q: "What is in a lead?",
    a: "The homeowner's name, phone number, email address, postcode district and the water hardness we measured for it, sent to you by email the moment they ask. Every one has ticked a box agreeing to be contacted by local installers about softener quotes.",
  },
  {
    q: "How many installers get the same lead?",
    a: `At most ${MAX_INSTALLERS_PER_LEAD}. Installers who joined an area first are served first.`,
  },
  {
    q: "What if the phone number is wrong?",
    a: "Reply to the lead email within seven days and we put the lead back on your account.",
  },
  {
    q: "Do leads I have paid for expire?",
    a: "No. Leads stay on your account until they are used, however long that takes.",
  },
  {
    q: "Is VAT added to the price?",
    a: `No. ${formatGbp(PRICE_PER_LEAD_GBP)} a lead is what you pay. TapWater.uk is run from the Netherlands, so the invoice carries no UK VAT.`,
  },
  {
    q: "Is there a contract or a monthly fee?",
    a: `No. After your ${FREE_LEADS} free leads you buy ${PACK_LEADS} at a time by card, and they stay on your account until they are used. Stop whenever you like by not topping up.`,
  },
  {
    q: "Why do you check installers first?",
    a: "We are passing on people's phone numbers, so we confirm every applicant is a real softener installer before anything is shared. It usually takes one working day.",
  },
];

export default async function PartnersPage() {
  const { areas, total } = await loadAreas();
  const busiest = areas.filter((a) => a.requests > 0).slice(0, 3);

  return (
    <div className="wt">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "For installers", url: "https://www.tapwater.uk/partners" },
        ]}
      />
      <div className="wt-top">
        <div className="wt-inner">
          <nav aria-label="Breadcrumb" className="wt-crumbs">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">For installers</span>
          </nav>
        </div>
      </div>

      <section className="wt-chalk">
        <div className="wt-inner">
          <div className="wt-chalk-grid">
            <p className="wt-n wt-nums">
              {total}
              <small>homeowners asked us for water softener quotes in the last {WINDOW_DAYS} days</small>
            </p>
            <div>
              <h1 className="wt-h2">They looked up their water, saw the limescale number, and asked for an installer.</h1>
              <p>
                TapWater.uk shows people the measured hardness of their own tap water. Where it is hard, they can ask for softener quotes. Those requests
                go to installers who cover the postcode area{busiest.length > 0 ? `; the busiest right now are ${busiest.map((a) => a.town).join(", ")}` : ""}.
              </p>
              <p>
                <strong>Your first {FREE_LEADS} leads are free.</strong> After that they are {formatGbp(PRICE_PER_LEAD_GBP)} each, with no contract, no VAT added and no expiry date on what you have bought.
              </p>
              <p style={{ marginTop: 28 }}>
                <a href="#join" className="wt-btn wt-btn--ink">Pick your areas</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="wt-band wt-band--white" id="join">
        <div className="wt-inner">
          <h2 className="wt-h2">Pick your areas</h2>
          <p className="wt-sub">Choose where you install. We check your details, switch your account on, and requests in those areas start arriving by email.</p>
          <PartnerSignupForm areas={areas} />
        </div>
      </section>

      <section className="wt-band wt-band--foam">
        <div className="wt-inner">
          <h2 className="wt-h2">What happens after you apply</h2>
          <ol className="wt-seq">
            <li>
              <h3>We check you are an installer</h3>
              <p>Usually within one working day. You get an email when your account is live.</p>
            </li>
            <li>
              <h3>Recent requests reach you first</h3>
              <p>Anything asked for in your areas in the last 30 days that is still open is sent straight away, as part of your {FREE_LEADS} free leads.</p>
            </li>
            <li>
              <h3>New requests arrive as they happen</h3>
              <p>Name, phone, email, district and measured hardness, by email, to at most {MAX_INSTALLERS_PER_LEAD} installers.</p>
            </li>
            <li>
              <h3>Top up when you want more</h3>
              <p>
                {PACK_LEADS} leads for {formatGbp(PACK_PRICE_GBP)}, paid by card. When your account is empty we tell you a request is waiting, without the
                homeowner&rsquo;s details, and send it as soon as you top up.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section className="wt-faq">
        <div className="wt-inner">
          <h2 className="wt-h2">Questions installers ask</h2>
          {FAQS.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
          <p style={{ marginTop: 32 }}>
            Something else? Email <a className="wt-link" href="mailto:partners@tapwater.uk">partners@tapwater.uk</a>.
          </p>
        </div>
      </section>
    </div>
  );
}
