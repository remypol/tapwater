import type { Metadata } from "next";
import Link from "next/link";
import { TankSignup } from "@/components/tank/keep-informed";

export const dynamic = "force-dynamic";

const FULL_REPORT_PRICE_GBP = 19.99;

export const metadata: Metadata = {
  title: "Full Water Report for Your Postcode",
  description: "A printable report on the tap water at your postcode: every test result against its legal limit, hardness, river health and what to do about each finding.",
  robots: { index: false, follow: true },
};

interface Props {
  searchParams: Promise<{ postcode?: string }>;
}

const CONTENTS = [
  ["Every test result", "Each substance the water company measured, the reading, the legal limit and how close it came."],
  ["Hardness and what it costs", "The measured hardness, what it does to a boiler and kettle, and whether a softener would pay for itself."],
  ["Lead and older pipes", "What the readings say and how to get a free check from your water company."],
  ["Rivers and incidents nearby", "The health rating of the nearest river and any supply incidents in the last twelve months."],
  ["What to do, in order", "The one or two actions worth taking for this water, and what you can safely ignore."],
  ["Sources and dates", "Where every figure came from and when it was sampled, so a buyer, landlord or solicitor can rely on it."],
];

export default async function FullReportPage({ searchParams }: Props) {
  const { postcode = "" } = await searchParams;
  const district = /^[A-Za-z]{1,2}[0-9][0-9A-Za-z]?$/.test(postcode.trim()) ? postcode.trim().toUpperCase() : "";

  return (
    <div className="wt">
      <section className="wt-chalk wt-chalk--soft">
        <div className="wt-inner">
          <div className="wt-chalk-grid">
            <p className="wt-n wt-nums" style={{ fontSize: "clamp(3.6rem, 10vw, 7rem)" }}>
              £{FULL_REPORT_PRICE_GBP}
              <small style={{ fontSize: "1rem", marginTop: "0.6rem" }}>One payment, one PDF by email. Not on sale yet.</small>
            </p>
            <div>
              <h1 className="wt-h2">The full water report{district ? ` for ${district}` : ""}</h1>
              <p>
                Everything on the free page, set out as a document you can print, keep with the house papers or send to someone: a buyer, a landlord, a
                solicitor.
              </p>
              <p>
                <strong>We have not started selling it.</strong> Leave your email and we will write to you the day it is ready. You pay nothing now, and
                nothing unless you decide to buy it then.
              </p>
              {district ? (
                <TankSignup district={district} purpose="report" />
              ) : (
                <p style={{ marginTop: 24 }}>
                  <Link href="/" className="wt-btn wt-btn--ink">Check your postcode first</Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="wt-band wt-band--white">
        <div className="wt-inner">
          <h2 className="wt-h2">What will be in it</h2>
          <dl className="wt-contents">
            {CONTENTS.map(([title, text]) => (
              <div key={title}>
                <dt>{title}</dt>
                <dd>{text}</dd>
              </div>
            ))}
          </dl>
          <p style={{ marginTop: 40 }}>
            {district ? (
              <Link href={`/postcode/${district}`} className="wt-link">Back to the free results for {district}</Link>
            ) : (
              <Link href="/" className="wt-link">Back to the postcode check</Link>
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
