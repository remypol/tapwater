import { ArrowUpRight } from "lucide-react";
import { AffiliateLink } from "@/components/affiliate-link";

/**
 * Our Taap (the former Virgin Pure) pays a fixed fee per subscription through
 * Awin, merchant 122454. Awin redirects for any publisher id whether or not the
 * programme has approved it, so a working link proves nothing: this block stays
 * off until NEXT_PUBLIC_OUR_TAAP_JOINED is set to "1" in Vercel, which should
 * only happen once the programme shows on the account's Joined tab.
 *
 * Prices read from ourtaap.com/plans on 17 November 2026. Check them before
 * switching this on; they run promotions that change the first months.
 */
export const OUR_TAAP_ENABLED = process.env.NEXT_PUBLIC_OUR_TAAP_JOINED === "1";

const MONTHLY_GBP = 35.99;
const MONTHS = 24;
const OUTRIGHT_GBP = 499.98;
const URL =
  "https://www.awin1.com/cread.php?awinmid=122454&awinaffid=3091503&ued=https%3A%2F%2Fourtaap.com%2Fsubscription-home-water-system-ii";

/** Shown on districts where hardness is not the problem, so taste is what a filter is for. */
export function OurTaapOffer({ district }: { district: string }) {
  if (!OUR_TAAP_ENABLED) return null;
  const total = (MONTHLY_GBP * MONTHS).toLocaleString("en-GB", { minimumFractionDigits: 2 });
  return (
    <section className="wt-band wt-band--white" aria-labelledby="wt-taap-h">
      <div className="wt-inner">
        <h2 className="wt-h2" id="wt-taap-h">Chilled, filtered and boiling water from one tap</h2>
        <p className="wt-sub">
          If it is the taste you want to change, the other route is a plumbed-in system on a monthly plan. Our Taap fits it, replaces the filters twice
          a year and covers call-outs.
        </p>
        <ul className="wt-compare">
          <li>
            <b>Our Taap Home Water System</b>
            <span className="wt-nums">£{MONTHLY_GBP} a month for {MONTHS} months, £{total} in all. Or £{OUTRIGHT_GBP} to buy it.</span>
            <small>It is a hire agreement: a credit check applies, and leaving early means paying the rest of the term.</small>
          </li>
          <li>
            <b>An under-sink filter you fit yourself</b>
            <span className="wt-nums">About £45 to £90 once, plus a cartridge every six to twelve months.</span>
            <small>Filtered cold water only. No chilling, no boiling.</small>
          </li>
        </ul>
        <div className="wt-acts" style={{ marginTop: 24 }}>
          <AffiliateLink
            href={URL}
            pageType="postcode"
            postcodeArea={district}
            recommendationReason="taste-subscription"
            productCategory="water-system"
            productSlug="our-taap-home-water-system"
            placement="tank-taap"
            campaign="postcode"
            className="wt-btn wt-btn--ghost"
          >
            See the plans at Our Taap
            <ArrowUpRight aria-hidden="true" />
          </AffiliateLink>
        </div>
        <p className="wt-fine" style={{ marginTop: 16 }}>We are paid a fixed fee if you take a plan. Prices checked November 2026.</p>
      </div>
    </section>
  );
}
