# Phase 0 checklist (to 15 October 2026)

Four things only Remy can do, in the order they unblock the most. Each one is a few minutes. Everything on Claude's side is built and waiting.

## 1. Search Console access — DONE 14 September

Done differently from the original plan: the cc-community.com Google Workspace forbids service-account keys, so the script reads Search Console with Remy's own Google login instead. `gcloud auth application-default login` produced a refresh token, stored base64-encoded as `GSC_OAUTH_JSON` in `.env.local`, with `GSC_SITE_URL=sc-domain:tapwater.uk`. The Cloud project `tapwater-reporting` exists only to carry API quota.

If the token ever stops working (Google revokes it after long inactivity or a password change), re-run:

```bash
gcloud auth application-default login --scopes=https://www.googleapis.com/auth/webmasters.readonly,https://www.googleapis.com/auth/cloud-platform
```

then re-encode the file into `.env.local` (Claude can do this).

## 2. Disavow upload — DONE 14 September

Uploaded to the URL-prefix property `https://www.tapwater.uk/` (the disavow tool does not accept domain properties, so that property was added alongside the domain one). File: `docs/seo/disavow-2026-09-07.txt`, 255 domains. Re-export from Ahrefs monthly and append; re-upload replaces the list, so always upload the full file.

## 3. Earnings exports for July and August (10 minutes, gives the real baseline)

The click log says ~450 clicks a month. Nobody has checked what they earned. Put the exports in `data/revenue/` (ignored by git, never committed):

- **Amazon Associates**: https://affiliate-program.amazon.co.uk → Reports → Earnings → date range 1 July to 31 August 2026 → Download (CSV). Save as `data/revenue/amazon-2026-07-08.csv`.
- **Awin** (Hugo's publisher account 2996923): Reports → Transactions → same date range → Export CSV. Save as `data/revenue/awin-2026-07-08.csv`.
- **Osmio**: whatever their affiliate dashboard exports, or a screenshot of sales attributed to us. If Osmio has no tracking at all, say so, because then the £50 to £75 per sale is currently unpaid.

Claude reconciles these against `affiliate_clicks` and writes the true July and August revenue into the plan.

## 4. Bark link — APPLIED 14 September, pending

Remy applied to the Bark UK programme from a new Awin publisher account in his own name (not Hugo's 2996923), promotional type Content, sectors Lead Gen + Utilities (+ Home & Garden), with a message describing the hard-water quote funnel. Bark typically answers within 3 to 7 working days.

When approved:

1. In Awin → Links & Tools → Link Builder → advertiser Bark UK → destination URL `https://www.bark.com/en/gb/water-treatment-system-install/` → generate.
2. Send Claude the generated `awin1.com` link.

Claude then sets `NEXT_PUBLIC_SOFTENER_PARTNER_URL` and `NEXT_PUBLIC_SOFTENER_PARTNER_NAME=Bark` on Vercel, redeploys, runs `npm run leads:recover -- --send` to email the 12 waiting leads, and starts reporting leads and Bark commission in the Monday numbers.

If refused again: ask Awin support for the reason (they forward the advertiser's note), fix that one thing, and reapply. The fallback is a direct approach to KindWater or a regional Kinetico dealer at £40 to £60 a lead, which skips Awin entirely.

## Optional, not blocking

- **GA4 admin** on property `G-XB7714S0QN`. Our security policy was silently blocking GA4 until 14 September, so historical data is useless anyway, but from now on it would give real page-level behaviour. Only worth doing if the account is reachable.

## What Claude runs every Monday

```bash
npm run numbers
```

Writes `docs/numbers/week-<monday>.md`: Search Console clicks and positions, affiliate clicks by partner, leads, subscribers, and where last week's clicks came from. The first one, for w/c 7 September, is already in `docs/numbers/`.
