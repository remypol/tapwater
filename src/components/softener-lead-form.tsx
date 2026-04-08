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
            <div className="w-10 h-10 rounded-xl bg-[var(--color-warning-light)] flex items-center justify-center shrink-0">
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
              <p className="text-xs text-muted">free, no obligation</p>
            </div>
            <div className="text-center">
              <ShieldCheck className="w-4 h-4 text-muted mx-auto mb-0.5" />
              <p className="text-xs text-muted">vetted installers</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-ink">24h</p>
              <p className="text-xs text-muted">response time</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
