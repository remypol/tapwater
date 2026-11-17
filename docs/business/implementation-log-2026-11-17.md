# What shipped on 17 November 2026

Follows `competitor-analysis-2026-11.md`. Commit d298bbf, live and checked on production. Numbers to compare against are in `docs/numbers/baseline-2026-11-17.md`.

| Change from the ranking | What is live | Checked on production |
|---|---|---|
| 1. Installer offer | `/partners` says leads never expire and no VAT is added | Both questions present |
| 2. Business enquiries | Entry plans now £199 and £499 a month; replies drafted in `emails-to-send-2026-11-17.md` | Prices present, old £99 gone. Emails not sent |
| 3. Town pages | 336 pages at `/hardness/{town}` for hard-water post towns; linked from each area page; in the sitemap; quote requests recorded with source `hardness_town` | Wokingham page renders with form and price; 336 in sitemap; the API accepts the new source |
| 4. Softener prices | Cost guide rebuilt with 10 sourced prices; the installed range sits beside every quote form | Guide shows Harvey's £1,195 and City Plumbing links |
| 5. Paid report test | "See the full report" on every postcode page leads to `/full-report` (not indexed), which says it is not on sale and takes an email | Button and page present; a test click was logged, then deleted |
| 8. Testing guide | Rewritten: what 14 water companies offer, home kits, labs, private supplies | New title live |
| 9. Alert signup | Signup sits straight after the action block; subscribers are emailed when an incident is published for their district | Form present, old bottom-of-page form gone. No real incident has fired yet |
| 6. Our Taap | Comparison block written, hidden | Confirmed hidden |

Also fixed: `/unsubscribe` did not exist, so the link in every drip email returned 404. It now shows a confirmation page.

## Decisions made along the way

- Town pages are limited to hard-water towns (median 180 mg/L or more). 848 towns had a measured district; 336 are hard. Soft-town pages would add little beyond the area page, and some "soft" readings look wrong (below).
- The town a postcode area is named after (Reading for RG) has no town page, because `/hardness/rg` already answers that search. London has none either.
- The next business plan went from £249 to £499 so the ladder made sense beside £199.
- Incident alerts are sent once, when an incident is first published, to confirmed subscribers in its districts, capped at 200 per incident.

## Not done, or needs you

- **Send the two business replies** (drafts ready; mint the LPRS key first).
- **Harvey:** no email address is published, so nothing was sent. Message drafted for its trade form or 01483 753404.
- **Our Taap:** apply on Awin (merchant 122454). When it shows on the Joined tab, set `NEXT_PUBLIC_OUR_TAAP_JOINED=1` in Vercel and redeploy. Re-check its prices first.
- **VAT wording:** `/partners` says no UK VAT is added because the business is run from the Netherlands. Confirm with your accountant.
- **Installer outreach** (`installer-outreach-2026-11.md`) is still the first money.

## Problems noticed, not fixed

- **Possible unit error in some hardness readings.** Epsom (KT17 to KT19) shows 75 to 138 mg/L and Woking 138 to 204. Both are known hard-water places, so these may be stored as calcium, not calcium carbonate (a factor of 2.5). Not confirmed. It affects the existing postcode pages too.
- **Two hardness scales** are still in use: the legend calls 200 and above "very hard", the sentences use 250.
- **Kit guide links:** the researcher on the testing guide reports that two Amazon product codes in `src/lib/products.ts` (SimplexHealth 17-in-1 and the SJ WAVE kit) open different products from the ones named. Not checked by me.
- **Cost guide gaps:** no published price could be read for Kinetico, Water2Buy or EcoWater; eight of ten rows are from one merchant; the Harvey Crown row came from a listing page only.
- **Testing guide gaps:** 5 of 14 water companies could not be confirmed and say "Contact them to ask"; Southern Water's page could not be opened at all.
- `src/app/rankings/page.tsx` has an unused variable that fails lint (it was there before today).
