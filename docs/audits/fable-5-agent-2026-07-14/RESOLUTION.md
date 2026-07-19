# TapWater first-sales loop — review resolution

Date: 2026-07-15
Branch: `feat/tapwater-first-sales-loop`

## Review coverage

Five independent reviews were run with the actual `claude-fable-5` model:

1. conversion and recommendation honesty;
2. analytics and affiliate attribution;
3. trust, security, privacy and UK affiliate compliance;
4. Next.js 16, React 19, SEO and performance;
5. mobile, accessibility and release QA.

The raw reports in this directory are point-in-time review snapshots. Their `FIX` findings were reviewed and the launch-blocking findings below were resolved before the final release gates.

## Resolved before PR

- Recommendation heading no longer says “Best fit” when the product matches nothing.
- Partial contaminant coverage is disclosed explicitly.
- Safe-water copy is optional and non-alarmist.
- Unspaced full postcodes are reduced to the outward district before analytics.
- Non-HTTP(S) catalogue links are blocked.
- Amazon Special Links are no longer decorated with extra UTM parameters; the Associate tag is preserved.
- Affiliate disclosure is shown adjacent to postcode and product-card CTAs.
- The exact Amazon Associates disclosure was added to `/affiliate-disclosure`.
- Static catalogue prices are labelled “Typical price”; CTAs say “Check current price”.
- Recommendation impressions use a mobile-safe visibility threshold.
- Guide quick-picks now emit matching recommendation impressions.
- Product-card links visibly use an external-link affordance and announce new tabs to assistive technology.
- Optional safe-water recommendations remain below the unique postcode water data, reducing top-heavy boilerplate risk across programmatic SEO pages.
- Water score band and campaign context are present on recommendation impressions and clicks.
- Malformed catalogue URLs cannot crash static generation.

## Verified evidence

- `npm test`: 81/81 tests passed.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed; 3,281 static/generated pages completed.
- Staged added-line security scan: zero hardcoded-secret, eval/exec, shell-injection or unsafe-HTML findings.

## Existing follow-up, not introduced by this branch

The site currently loads Google Analytics unconditionally via the root layout. A future site-wide consent-management change should gate analytics where required under PECR/UK GDPR. This branch does not add a new analytics vendor or cookie; it adds events to the existing GA setup.
