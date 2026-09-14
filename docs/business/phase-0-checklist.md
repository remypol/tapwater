# Phase 0 checklist (to 15 October 2026)

Four things only Remy can do, in the order they unblock the most. Each one is a few minutes. Everything on Claude's side is built and waiting.

## 1. Search Console access (10 minutes, unblocks all measurement)

Claude needs a Google service account that can read the Search Console property.

1. Go to https://console.cloud.google.com/ and pick or create a project (any name, e.g. `tapwater-reporting`).
2. APIs & Services → Library → search "Google Search Console API" → Enable.
3. IAM & Admin → Service Accounts → Create service account. Name it `tapwater-gsc`. No roles needed. Create.
4. Open the new account → Keys → Add key → Create new key → JSON. A file downloads.
5. Copy the `client_email` from that file (it looks like `tapwater-gsc@tapwater-reporting.iam.gserviceaccount.com`).
6. Go to https://search.google.com/search-console → the tapwater.uk property → Settings → Users and permissions → Add user → paste that email → permission **Restricted** → Add.
7. Put the key in `.env.local` as one line:

   ```bash
   echo "GSC_SERVICE_ACCOUNT_JSON=$(base64 -i ~/Downloads/tapwater-reporting-*.json | tr -d '\n')" >> .env.local
   echo "GSC_SITE_URL=sc-domain:tapwater.uk" >> .env.local
   ```

   If the property in Search Console is shown as `https://www.tapwater.uk/` rather than `tapwater.uk`, use that as `GSC_SITE_URL` instead.
8. Test:

   ```bash
   npm run gsc
   ```

   It prints 12 weeks of clicks and the watch-list positions. From then on `npm run numbers` includes Search Console automatically.

## 2. Disavow upload (3 minutes, starts the penalty clock)

1. Go to https://search.google.com/search-console/disavow-links
2. Select the tapwater.uk property.
3. Upload `docs/seo/disavow-2026-09-07.txt` (255 spam domains).

Google re-evaluates over weeks, not days. It has to be in before any ranking recovery can be attributed.

## 3. Earnings exports for July and August (10 minutes, gives the real baseline)

The click log says ~450 clicks a month. Nobody has checked what they earned. Put the exports in `data/revenue/` (ignored by git, never committed):

- **Amazon Associates**: https://affiliate-program.amazon.co.uk → Reports → Earnings → date range 1 July to 31 August 2026 → Download (CSV). Save as `data/revenue/amazon-2026-07-08.csv`.
- **Awin** (Hugo's publisher account 2996923): Reports → Transactions → same date range → Export CSV. Save as `data/revenue/awin-2026-07-08.csv`.
- **Osmio**: whatever their affiliate dashboard exports, or a screenshot of sales attributed to us. If Osmio has no tracking at all, say so, because then the £50 to £75 per sale is currently unpaid.

Claude reconciles these against `affiliate_clicks` and writes the true July and August revenue into the plan.

## 4. Bark link (waiting on Hugo)

When Awin shows the Bark UK programme as approved on Hugo's account:

1. In Awin → Links & Tools → Link Builder → advertiser Bark UK → destination URL `https://www.bark.com/en/gb/water-treatment-system-install/` → generate.
2. Send Claude the generated `awin1.com` link.

Claude then sets `NEXT_PUBLIC_SOFTENER_PARTNER_URL` and `NEXT_PUBLIC_SOFTENER_PARTNER_NAME=Bark` on Vercel, redeploys, runs `npm run leads:recover -- --send` to email the 12 waiting leads, and starts reporting leads and Bark commission in the Monday numbers.

If Hugo's application was rejected or never actioned: apply again from Awin → Advertisers → search "Bark" → Join programme. Approval usually takes a few days.

## Optional, not blocking

- **GA4 admin** on property `G-XB7714S0QN`. Our security policy was silently blocking GA4 until 14 September, so historical data is useless anyway, but from now on it would give real page-level behaviour. Only worth doing if the account is reachable.

## What Claude runs every Monday

```bash
npm run numbers
```

Writes `docs/numbers/week-<monday>.md`: Search Console clicks and positions, affiliate clicks by partner, leads, subscribers, and where last week's clicks came from. The first one, for w/c 7 September, is already in `docs/numbers/`.
