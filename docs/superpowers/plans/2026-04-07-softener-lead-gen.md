# Water Softener Lead Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture water softener installation leads from hard-water postcode pages and the hardness checker page, storing them in Supabase and notifying admin for manual forwarding to lead gen networks.

**Architecture:** Two new React components (banner + form), one new API route, one new Supabase table, one confirmation email. Components are conditionally rendered when hardness ≥ 180 mg/L. Form submits to `/api/softener-leads`, which validates, stores in Supabase, sends confirmation email via Resend, and emails admin.

**Tech Stack:** Next.js App Router, Supabase (Postgres), Resend (email), Upstash Redis (rate limiting), TypeScript

**Spec:** `docs/superpowers/specs/2026-04-07-softener-lead-gen-design.md`

---

## Task 1: Create `softener_leads` Supabase table

**Files:**
- Create: `supabase/migrations/004_softener_leads.sql`

- [ ] **Step 1: Create migration file**

```sql
-- 004_softener_leads.sql
CREATE TABLE IF NOT EXISTS softener_leads (
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

CREATE INDEX IF NOT EXISTS idx_softener_leads_status ON softener_leads (status);
CREATE INDEX IF NOT EXISTS idx_softener_leads_created ON softener_leads (created_at DESC);
```

- [ ] **Step 2: Apply migration to Supabase**

Run the migration against your Supabase project. Use the Supabase MCP `apply_migration` tool or run via the Supabase dashboard SQL editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/004_softener_leads.sql
git commit -m "feat: add softener_leads table for lead gen storage"
```

---

## Task 2: Create the API route `/api/softener-leads`

**Files:**
- Create: `src/app/api/softener-leads/route.ts`

- [ ] **Step 1: Create the API route**

```tsx
import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";
import { subscribeLimiter, isMemoryRateLimited } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UK_PHONE_RE = /^(?:0|\+?44)\d{9,10}$/;

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Rate limit: reuse subscribe limiter (3 per 60s per IP)
  const limited = subscribeLimiter
    ? !(await subscribeLimiter.limit(`softener:${ip}`)).success
    : isMemoryRateLimited(`softener:${ip}`, 3, 3_600_000);

  if (limited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: {
    name?: string;
    email?: string;
    phone?: string;
    postcode?: string;
    hardnessValue?: number;
    hardnessLabel?: string;
    source?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const phone = body.phone?.replace(/[\s\-()]/g, "");
  const postcode = body.postcode?.trim().toUpperCase();
  const hardnessValue = body.hardnessValue ?? null;
  const hardnessLabel = body.hardnessLabel ?? null;
  const source = body.source ?? "postcode_page";

  // Validation
  if (!name || name.length > 100) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (!phone || !UK_PHONE_RE.test(phone)) {
    return NextResponse.json(
      { error: "Valid UK phone number is required" },
      { status: 400 }
    );
  }
  if (!postcode || !/^[A-Z]{1,2}[0-9][0-9A-Z]?$/.test(postcode)) {
    return NextResponse.json(
      { error: "Invalid postcode district" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // Store lead
  const { error: dbError } = await supabase.from("softener_leads").insert({
    name,
    email,
    phone,
    postcode_district: postcode,
    hardness_value: hardnessValue,
    hardness_label: hardnessLabel,
    source,
  });

  if (dbError) {
    console.error("[softener-leads] DB error:", dbError);
    return NextResponse.json(
      { error: "Failed to save your request" },
      { status: 500 }
    );
  }

  // Send confirmation email + admin notification
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);

      // Confirmation to user
      await resend.emails.send({
        from: "TapWater.uk <alerts@tapwater.uk>",
        to: email,
        subject: "Your water softener assessment request",
        html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">tap</span><span style="font-size:22px;font-weight:700;color:#0891b2;letter-spacing:-0.02em;">water</span><span style="font-size:14px;color:#0891b2;">.uk</span>
    </div>
    <div style="background:#1e293b;border-radius:16px;padding:32px 28px;border:1px solid #334155;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
        We've received your request
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#94a3b8;line-height:1.6;">
        Thanks ${name}, we've got your water softener assessment request for <strong style="color:#ffffff;">${postcode}</strong>.
      </p>
      ${hardnessValue ? `<p style="margin:0 0 16px;font-size:15px;color:#94a3b8;line-height:1.6;">Your area has <strong style="color:#f59e0b;">${hardnessLabel} water (${Math.round(hardnessValue)} mg/L)</strong>. A water softener can reduce limescale and protect your appliances.</p>` : ""}
      <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.6;">
        Up to 3 local installers will contact you within 24–48 hours with free, no-obligation quotes.
      </p>
      <div style="border-top:1px solid #334155;padding-top:20px;margin-top:8px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">In the meantime</p>
        <a href="https://www.tapwater.uk/hardness" style="display:inline-block;padding:10px 20px;background:#0891b2;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
          Learn more about water hardness
        </a>
      </div>
    </div>
    <div style="text-align:center;margin-top:28px;">
      <p style="font-size:12px;color:#334155;margin:0;">
        <a href="https://www.tapwater.uk" style="color:#0891b2;text-decoration:none;">tapwater.uk</a>
        &nbsp;&middot;&nbsp;
        <a href="https://www.tapwater.uk/privacy" style="color:#475569;text-decoration:none;">Privacy</a>
      </p>
    </div>
  </div>
</body>
</html>`,
      });

      // Admin notification
      const adminEmail = process.env.ADMIN_EMAIL || "remy@tapwater.uk";
      await resend.emails.send({
        from: "TapWater.uk <alerts@tapwater.uk>",
        to: adminEmail,
        subject: `New softener lead: ${name} (${postcode})`,
        html: `
<h2>New Water Softener Lead</h2>
<table style="border-collapse:collapse;">
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Name:</td><td>${name}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Email:</td><td>${email}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Phone:</td><td>${phone}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Postcode:</td><td>${postcode}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Hardness:</td><td>${hardnessValue ? `${Math.round(hardnessValue)} mg/L (${hardnessLabel})` : "Unknown"}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Source:</td><td>${source}</td></tr>
</table>
<p>Forward this lead to Bark/Checkatrade/MyBuilder.</p>`,
      });
    } catch (err) {
      console.error("[softener-leads] Email error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build 2>&1 | tail -10`
Expected: Build succeeds with new API route

- [ ] **Step 3: Commit**

```bash
git add src/app/api/softener-leads/route.ts
git commit -m "feat: add /api/softener-leads endpoint with validation, storage, and email notifications"
```

---

## Task 3: Add analytics events for softener lead gen

**Files:**
- Modify: `src/lib/analytics.ts`

- [ ] **Step 1: Add softener events**

Add these events to the `events` object in `src/lib/analytics.ts` (after the existing `regionSelect` event):

```tsx
  softenerBannerView: (postcode: string) =>
    trackEvent("softener_banner_view", { postcode }),

  softenerBannerClick: (postcode: string) =>
    trackEvent("softener_banner_click", { postcode }),

  softenerFormView: (postcode: string, source: string) =>
    trackEvent("softener_form_view", { postcode, source }),

  softenerFormSubmit: (postcode: string, source: string) =>
    trackEvent("softener_form_submit", { postcode, source }),

  softenerFormError: (postcode: string, error: string) =>
    trackEvent("softener_form_error", { postcode, error }),
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/analytics.ts
git commit -m "feat: add GA4 events for softener lead gen funnel tracking"
```

---

## Task 4: Create `<SoftenerLeadBanner />` component

**Files:**
- Create: `src/components/softener-lead-banner.tsx`

- [ ] **Step 1: Create the banner component**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { Droplets } from "lucide-react";
import { events } from "@/lib/analytics";

interface SoftenerLeadBannerProps {
  postcode: string;
  hardnessValue: number;
  hardnessLabel: string;
}

export function SoftenerLeadBanner({
  postcode,
  hardnessValue,
  hardnessLabel,
}: SoftenerLeadBannerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      events.softenerBannerView(postcode);
      tracked.current = true;
    }
  }, [postcode]);

  return (
    <div className="mt-4 rounded-lg border-l-[3px] border-amber-500 bg-amber-50/60 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        <Droplets className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">
            Hard water is costing your home money
          </p>
          <p className="text-xs text-muted mt-0.5">
            Your water is {hardnessLabel} ({Math.round(hardnessValue)} mg/L) — find out if a softener is worth it
          </p>
        </div>
      </div>
      <a
        href="#softener-quotes"
        onClick={() => events.softenerBannerClick(postcode)}
        className="shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
      >
        Get free quotes&nbsp;&rarr;
      </a>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build 2>&1 | tail -10`

- [ ] **Step 3: Commit**

```bash
git add src/components/softener-lead-banner.tsx
git commit -m "feat: add SoftenerLeadBanner component for hard water CTAs"
```

---

## Task 5: Create `<SoftenerLeadForm />` component

**Files:**
- Create: `src/components/softener-lead-form.tsx`

- [ ] **Step 1: Create the form component**

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Droplets, ShieldCheck, Check, AlertCircle, MapPin } from "lucide-react";
import { events } from "@/lib/analytics";

interface SoftenerLeadFormProps {
  postcode?: string;
  hardnessValue: number;
  hardnessLabel: string;
  source: "postcode_page" | "hardness_page";
}

export function SoftenerLeadForm({
  postcode: initialPostcode,
  hardnessValue,
  hardnessLabel,
  source,
}: SoftenerLeadFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [postcode, setPostcode] = useState(initialPostcode ?? "");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const tracked = useRef(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tracked.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !tracked.current) {
          events.softenerFormView(postcode || "unknown", source);
          tracked.current = true;
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (formRef.current) observer.observe(formRef.current);
    return () => observer.disconnect();
  }, [postcode, source]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name || !email || !phone || !postcode || !consent) return;

    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/softener-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          postcode,
          hardnessValue,
          hardnessLabel,
          source,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }

      setStatus("success");
      events.softenerFormSubmit(postcode, source);
    } catch (err) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Failed to submit";
      setErrorMsg(msg);
      events.softenerFormError(postcode, msg);
    }
  }

  return (
    <div ref={formRef} id="softener-quotes" className="card p-6 lg:p-8 border-l-[3px] border-amber-500 scroll-mt-24">
      {status === "success" ? (
        <div className="flex items-start gap-3 animate-fade-up">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 text-safe" />
          </div>
          <div>
            <p className="text-lg font-semibold text-ink">We&apos;ve received your request</p>
            <p className="text-sm text-muted mt-1">
              Up to 3 local installers will contact you within 24–48 hours with free, no-obligation quotes for <span className="font-medium text-ink">{postcode}</span>.
            </p>
            <p className="text-sm text-muted mt-2">
              Check your email at <span className="font-medium text-ink">{email}</span> for confirmation.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <Droplets className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink">
                Hard water is costing your home money
              </h2>
              <p className="text-sm text-body mt-1 leading-relaxed">
                Limescale reduces boiler efficiency and shortens appliance life.
                Based on your water hardness{" "}
                <strong className="text-ink">
                  ({Math.round(hardnessValue)} mg/L — {hardnessLabel})
                </strong>
                , a softener could save you £200+/year.
              </p>
              <p className="text-xs text-muted mt-1">
                Get a free assessment — we&apos;ll tell you if it&apos;s worth it and connect you with trusted local installers.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="sl-name" className="block text-xs font-semibold text-muted mb-1">
                  Name
                </label>
                <input
                  id="sl-name"
                  type="text"
                  required
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={status === "submitting"}
                  className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="sl-phone" className="block text-xs font-semibold text-muted mb-1">
                  Phone
                </label>
                <input
                  id="sl-phone"
                  type="tel"
                  required
                  placeholder="07XXX XXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={status === "submitting"}
                  className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="mt-3">
              <label htmlFor="sl-email" className="block text-xs font-semibold text-muted mb-1">
                Email
              </label>
              <input
                id="sl-email"
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "submitting"}
                className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:opacity-50"
              />
            </div>

            {initialPostcode ? (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface-raised px-3 py-2.5">
                <MapPin className="w-3.5 h-3.5 text-muted" />
                <span className="text-sm font-medium text-ink">{initialPostcode}</span>
                <span className="text-xs text-muted">— auto-detected from your search</span>
              </div>
            ) : (
              <div className="mt-3">
                <label htmlFor="sl-postcode" className="block text-xs font-semibold text-muted mb-1">
                  Postcode
                </label>
                <input
                  id="sl-postcode"
                  type="text"
                  required
                  placeholder="e.g. SW1A"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                  disabled={status === "submitting"}
                  className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:opacity-50"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={status === "submitting" || !consent}
              className="w-full mt-4 rounded-lg bg-amber-500 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {status === "submitting" ? "Sending\u2026" : "Get my free assessment \u2192"}
            </button>

            <label className="flex items-start gap-2 mt-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 rounded border-rule text-amber-500 focus:ring-amber-500/20"
              />
              <span className="text-xs text-muted leading-relaxed">
                I agree to be contacted by up to 3 local installers with quotes.
                No obligation. You can opt out any time.{" "}
                <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
                  Privacy policy
                </Link>.
              </span>
            </label>

            {status === "error" && (
              <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-danger)]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errorMsg || "Something went wrong. Please try again."}
              </div>
            )}
          </form>

          <div className="mt-5 flex gap-6 justify-center pt-4 border-t border-rule">
            <div className="text-center">
              <p className="text-base font-bold text-ink">100%</p>
              <p className="text-[11px] text-muted">free, no obligation</p>
            </div>
            <div className="text-center">
              <ShieldCheck className="w-4 h-4 text-muted mx-auto mb-0.5" />
              <p className="text-[11px] text-muted">vetted installers</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-ink">24h</p>
              <p className="text-[11px] text-muted">response time</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build 2>&1 | tail -10`

- [ ] **Step 3: Commit**

```bash
git add src/components/softener-lead-form.tsx
git commit -m "feat: add SoftenerLeadForm component with validation, submission, and analytics"
```

---

## Task 6: Wire components into postcode page

**Files:**
- Modify: `src/app/postcode/[district]/page.tsx`

- [ ] **Step 1: Add imports**

Add to the imports section at the top of the file:

```tsx
import { SoftenerLeadBanner } from "@/components/softener-lead-banner";
import { SoftenerLeadForm } from "@/components/softener-lead-form";
```

- [ ] **Step 2: Add the banner after the hardness card**

Find the hardness card block (around line 268-283, starts with `{hardnessValue != null && (`). Immediately AFTER the closing `)}` of that block, add:

```tsx
            {hardnessValue != null && hardnessValue >= 180 && (
              <SoftenerLeadBanner
                postcode={data.district}
                hardnessValue={hardnessValue}
                hardnessLabel={hardnessLabel!}
              />
            )}
```

- [ ] **Step 3: Add the form after FilterRecommendations**

Find the `<FilterRecommendations>` section (around line 385-400, wrapped in `<ScrollReveal>`). After the closing `</ScrollReveal>` for filter recs, add:

```tsx
            {hardnessValue != null && hardnessValue >= 180 && (
              <div className="mt-8">
                <SoftenerLeadForm
                  postcode={data.district}
                  hardnessValue={hardnessValue}
                  hardnessLabel={hardnessLabel!}
                  source="postcode_page"
                />
              </div>
            )}
```

- [ ] **Step 4: Verify build passes**

Run: `npm run build 2>&1 | tail -10`

- [ ] **Step 5: Commit**

```bash
git add "src/app/postcode/[district]/page.tsx"
git commit -m "feat: add softener lead gen banner + form to hard water postcode pages"
```

---

## Task 7: Wire form into hardness page

**Files:**
- Modify: `src/app/hardness/page.tsx`

- [ ] **Step 1: Read the hardness page**

Read `src/app/hardness/page.tsx` in full to understand the current layout. Find the "How to deal with hard water" section — the form goes after it.

- [ ] **Step 2: Add import and form**

Add the import:

```tsx
import { SoftenerLeadForm } from "@/components/softener-lead-form";
```

After the "How to deal with hard water" section (the section with softener/filter/descaling cards), add:

```tsx
        <div className="mt-10">
          <SoftenerLeadForm
            hardnessValue={220}
            hardnessLabel="hard"
            source="hardness_page"
          />
        </div>
```

Note: On the hardness page, we use a representative hardness value (220 = middle of "hard" range) since there's no specific postcode context. The postcode field will be editable (no `postcode` prop passed).

- [ ] **Step 3: Verify build passes**

Run: `npm run build 2>&1 | tail -10`

- [ ] **Step 4: Commit**

```bash
git add src/app/hardness/page.tsx
git commit -m "feat: add softener lead gen form to hardness checker page"
```

---

## Task 8: Final verification and deploy

- [ ] **Step 1: Full build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 2: Test the form flow manually**

1. Visit a hard water postcode page (e.g., `/postcode/SW1A`) — verify the amber banner appears after hardness card and the form appears after filter recs
2. Visit `/hardness` — verify the form appears with an editable postcode field
3. Submit the form with test data — verify success state shows
4. Check Supabase `softener_leads` table for the new row
5. Check email inbox for confirmation + admin notification

- [ ] **Step 3: Push and deploy**

```bash
git push origin main
```

Verify Vercel deployment succeeds.
