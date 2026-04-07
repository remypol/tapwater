# Water Softener Lead Generation

**Date:** 2026-04-07
**Status:** Approved design, pending implementation

## Goal

Capture water softener installation leads from users with hard water (≥180 mg/L), monetised via lead gen networks (Bark, Checkatrade, MyBuilder) at £15-50 per qualified lead. Target: 20-30 leads/month = £400-1,200/mo.

## Strategy

**Lead delivery:** Route leads to existing lead gen networks (Bark, Checkatrade, MyBuilder). No direct installer partnerships initially — switch to direct once volume justifies negotiation.

**Form fields:** Name, email, phone, postcode (auto-filled). Phone number is non-negotiable — installers won't pay for email-only leads.

**Value proposition:** Blend of financial urgency + low-pressure assessment framing. "Hard water is costing your home money. Get a free assessment — we'll tell you if a softener is worth it and connect you with trusted local installers."

**Trigger condition:** Only show on pages where hardness ≥ 180 mg/L (classified as "hard" or "very hard"). This is roughly 60% of UK postcodes.

## Pages

### Postcode pages (`/postcode/[district]`)

Two-touch CTA pattern when hardness ≥ 180 mg/L:

**Touch 1 — Light banner** immediately after the hardness card:
- Warm amber colour scheme (distinct from blue email capture and green safety scores)
- Single line: "Hard water is costing your home money" + "Find out if a softener is worth it — free assessment"
- CTA button: "Get free quotes →" — anchor links to `#softener-quotes` (the full form below)
- Non-intrusive: doesn't interrupt the data flow, just plants the seed

**Touch 2 — Full lead capture form** after the filter recommendations section, before related guides:
- Headline: "Hard water is costing your home money"
- Subtext: "Limescale reduces boiler efficiency and shortens appliance life. Based on your water hardness (X mg/L — hard), a softener could save you £200+/year."
- Secondary: "Get a free assessment — we'll tell you if it's worth it and connect you with trusted local installers."
- Form fields:
  - Name (text, required)
  - Phone (tel, required, placeholder "07XXX XXXXXX")
  - Email (email, required)
  - Postcode (read-only, auto-filled from page data, shown as a grey badge)
- CTA button: "Get my free assessment →"
- Consent checkbox: "I agree to be contacted by up to 3 local installers with quotes. No obligation. You can opt out any time. Privacy policy link."
- Trust signals row: postcodes tested count, "100% free, no obligation", "Trusted vetted installers only"

### Hardness page (`/hardness`)

Full lead capture form (same as Touch 2 above) placed after the "How to deal with hard water" section, before the regional hardness breakdown. On this page the postcode field is editable (not auto-filled since users may not have searched a specific postcode yet).

## Component Architecture

### `<SoftenerLeadBanner />`

Light inline banner component. Props:
- `hardnessValue: number` — displayed in the copy
- `hardnessLabel: string` — "hard" or "very hard"

Renders an anchor link to `#softener-quotes`. Only rendered when hardness ≥ 180.

### `<SoftenerLeadForm />`

Full lead capture form component. Props:
- `postcode?: string` — auto-fill postcode (undefined on hardness page = editable field)
- `hardnessValue: number` — displayed in personalised copy
- `hardnessLabel: string` — "hard" or "very hard"
- `source: "postcode_page" | "hardness_page"` — tracks where the lead came from

Renders with `id="softener-quotes"` for anchor linking.

## API

### `POST /api/softener-leads`

**Request body:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "postcode": "string",
  "hardnessValue": 245,
  "hardnessLabel": "hard",
  "source": "postcode_page"
}
```

**Validation:**
- Name: non-empty, max 100 chars
- Email: valid email format
- Phone: UK phone format (starts with 0 or +44, 10-11 digits after normalisation)
- Postcode: valid UK postcode district format
- Rate limit: 3 submissions per IP per hour

**On success:**
1. Store lead in `softener_leads` Supabase table
2. Send confirmation email to user via Resend: "We've received your request. Local installers will contact you within 24 hours."
3. Forward lead to Bark/Checkatrade API (or initially: email notification to admin for manual forwarding)
4. Return `{ success: true }`

**On error:** Return `{ success: false, error: "message" }`

## Database

### `softener_leads` table

```sql
CREATE TABLE softener_leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT NOT NULL,
  postcode_district TEXT NOT NULL,
  hardness_value   REAL,
  hardness_label   TEXT,
  source           TEXT NOT NULL DEFAULT 'postcode_page',
  status           TEXT NOT NULL DEFAULT 'new',
  forwarded_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_softener_leads_status ON softener_leads (status);
CREATE INDEX idx_softener_leads_created ON softener_leads (created_at DESC);
```

Status values: `new` → `forwarded` → `converted` (tracking pipeline)

## Email

### Confirmation email to user

Sent immediately via Resend on form submission. Branded TapWater.uk template (reuse existing email styling from `src/lib/email-sequences.ts`).

Subject: "Your water softener assessment request"
Body:
- "Thanks [name], we've received your request for [postcode]."
- "Your area has [hardnessLabel] water ([hardnessValue] mg/L). A water softener can reduce limescale and protect your appliances."
- "Up to 3 local installers will contact you within 24-48 hours with free, no-obligation quotes."
- "In the meantime, learn more about water hardness" (link to /hardness/)

### Admin notification

Email to admin (configurable) when a new lead comes in, with all lead details. This is the initial monetisation path — manually forward to Bark/Checkatrade until API integration is built.

## Design

- Warm amber/orange colour scheme (#e67e22 accent) — distinct from blue email capture and green safety scores
- No emoji as icons — use lucide-react icons (Droplets for water, ShieldCheck for trust)
- Matches existing card/form styling patterns in the codebase
- Mobile-responsive: form fields stack to single column on mobile
- Success state: form replaced with confirmation message + checkmark
- Error state: inline field validation + toast for API errors

## Analytics

Track via existing Google Analytics (gtag):
- `softener_banner_view` — banner was rendered (user has hard water)
- `softener_banner_click` — user clicked the banner CTA
- `softener_form_view` — form was scrolled into viewport
- `softener_form_submit` — form submitted successfully
- `softener_form_error` — form submission failed

Conversion funnel: banner views → banner clicks → form views → form submits.

## Out of Scope

- Direct Bark/Checkatrade API integration (manual forwarding initially)
- A/B testing framework
- CTA on city pages (add later if postcode + hardness pages perform)
- SMS verification
- Lead scoring/qualification beyond hardness threshold
- Installer dashboard/portal
