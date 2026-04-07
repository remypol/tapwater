"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, AlertCircle } from "lucide-react";

interface PartnerSignupFormProps {
  regionNames: string[];
}

const VOLUME_OPTIONS = [
  "5-10 leads",
  "10-25 leads",
  "25-50 leads",
  "50+ leads",
];

export function PartnerSignupForm({ regionNames }: PartnerSignupFormProps) {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [coverageRegions, setCoverageRegions] = useState<string[]>([]);
  const [monthlyVolume, setMonthlyVolume] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function toggleRegion(region: string) {
    setCoverageRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!companyName || !contactName || !email || !phone) return;

    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          contactName,
          email,
          phone,
          website: website || undefined,
          coverageRegions,
          monthlyVolume,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to submit");
    }
  }

  if (status === "success") {
    return (
      <div className="card p-6 lg:p-8 bg-[var(--color-surface-raised)]">
        <div className="flex items-start gap-3 animate-fade-up">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 text-safe" />
          </div>
          <div>
            <p className="text-lg font-semibold text-ink">
              Application received
            </p>
            <p className="text-sm text-muted mt-1">
              Thanks {contactName}, we&apos;ve received your partner application
              for <span className="font-medium text-ink">{companyName}</span>.
              We&apos;ll review your details and get back to you within 48 hours
              at <span className="font-medium text-ink">{email}</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 lg:p-8 bg-[var(--color-surface-raised)]">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="ps-company" className="block text-xs font-semibold text-muted mb-1">
              Company name
            </label>
            <input
              id="ps-company"
              type="text"
              required
              placeholder="Your company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={status === "submitting"}
              className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="ps-contact" className="block text-xs font-semibold text-muted mb-1">
              Contact name
            </label>
            <input
              id="ps-contact"
              type="text"
              required
              placeholder="Your name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              disabled={status === "submitting"}
              className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div>
            <label htmlFor="ps-email" className="block text-xs font-semibold text-muted mb-1">
              Email
            </label>
            <input
              id="ps-email"
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "submitting"}
              className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="ps-phone" className="block text-xs font-semibold text-muted mb-1">
              Phone
            </label>
            <input
              id="ps-phone"
              type="tel"
              required
              placeholder="07XXX XXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={status === "submitting"}
              className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:opacity-50"
            />
          </div>
        </div>

        <div className="mt-3">
          <label htmlFor="ps-website" className="block text-xs font-semibold text-muted mb-1">
            Website <span className="font-normal text-faint">(optional)</span>
          </label>
          <input
            id="ps-website"
            type="url"
            placeholder="https://www.yourcompany.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            disabled={status === "submitting"}
            className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:opacity-50"
          />
        </div>

        <fieldset className="mt-4">
          <legend className="block text-xs font-semibold text-muted mb-2">
            Coverage regions
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {regionNames.map((region) => (
              <label
                key={region}
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={coverageRegions.includes(region)}
                  onChange={() => toggleRegion(region)}
                  disabled={status === "submitting"}
                  className="rounded border-rule text-accent focus:ring-accent/20"
                />
                <span className="text-sm text-body">{region}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-4">
          <label htmlFor="ps-volume" className="block text-xs font-semibold text-muted mb-1">
            Desired monthly volume
          </label>
          <select
            id="ps-volume"
            value={monthlyVolume}
            onChange={(e) => setMonthlyVolume(e.target.value)}
            disabled={status === "submitting"}
            className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm text-body focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:opacity-50 bg-[var(--color-surface)]"
          >
            <option value="">Select volume...</option>
            {VOLUME_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full mt-5 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "Sending\u2026" : "Apply to become a partner"}
        </button>

        {status === "error" && (
          <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-danger)]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {errorMsg || "Something went wrong. Please try again."}
          </div>
        )}
      </form>

      <div className="mt-5 pt-4 border-t border-rule">
        <p className="text-xs text-muted text-center leading-relaxed">
          By submitting, you agree to our{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-2 hover:text-ink"
          >
            privacy policy
          </Link>
          . We&apos;ll only use your details to process your partner application.
        </p>
      </div>
    </div>
  );
}
