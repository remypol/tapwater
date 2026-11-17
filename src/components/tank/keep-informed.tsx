"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { events } from "@/lib/analytics";

/** Counts interest in the paid report in the existing click log. No visitor data is stored. */
function logReportEvent(slug: "full-report-interest" | "full-report-waitlist", placement: string) {
  try {
    void fetch("/api/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        productSlug: slug,
        partner: "other",
        page: window.location.pathname,
        placement,
        campaign: "full-report-test",
      }),
    });
  } catch {
    // Counting must never get in the way of the click.
  }
}

interface SignupProps {
  district: string;
  /** "alerts": incident emails for the district. "report": tell me when the paid report is on sale. */
  purpose: "alerts" | "report";
}

/**
 * One email field and one button. Used under the verdict on the postcode page
 * (alerts) and on the full-report page (waiting list). Both go to the same
 * subscriber list with the same double opt-in; the report version also counts
 * the signup so we can see whether anyone wants to pay for it.
 */
export function TankSignup({ district, purpose }: SignupProps) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const id = `wt-signup-${purpose}`;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    events.subscribeAttempt(district);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, postcode: district }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "That did not go through. Try again in a minute.");
      }
      setStatus("success");
      events.subscribeSuccess(district);
      if (purpose === "report") logReportEvent("full-report-waitlist", "waitlist-form");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "That did not go through. Try again in a minute.");
    }
  }

  if (status === "success") {
    return (
      <p className="wt-signup-done" role="status">
        <strong>Check your inbox.</strong> We sent a confirmation link to {email}.{" "}
        {purpose === "alerts"
          ? `Click it and we will email you when something happens to the water in ${district}.`
          : `Click it and we will email you when the full report for ${district} is ready.`}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="wt-signup">
      <label htmlFor={id} className="wt-sr">Your email address</label>
      <div className="wt-signup-row">
        <input
          id={id}
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "submitting"}
        />
        <button type="submit" className="wt-btn wt-btn--ink" disabled={status === "submitting"}>
          {status === "submitting" ? "Sending" : purpose === "alerts" ? "Email me alerts" : "Tell me when it is ready"}
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
      <label className="wt-signup-consent">
        <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          {purpose === "alerts"
            ? `I agree to get emails about the water in ${district}.`
            : `I agree to get an email when the report is ready, and emails about the water in ${district}.`}{" "}
          Unsubscribe any time. <Link href="/privacy" className="wt-link">Privacy policy</Link>
        </span>
      </label>
      {status === "error" ? (
        <p className="wt-signup-error" role="alert">{errorMsg}</p>
      ) : null}
    </form>
  );
}

/** Link to the full-report page that counts the click first. */
export function ReportLink({ district, placement, children }: { district: string; placement: string; children: React.ReactNode }) {
  return (
    <Link
      href={`/full-report?postcode=${encodeURIComponent(district)}`}
      className="wt-btn wt-btn--ghost"
      onClick={() => logReportEvent("full-report-interest", placement)}
    >
      {children}
      <ArrowRight aria-hidden="true" />
    </Link>
  );
}
