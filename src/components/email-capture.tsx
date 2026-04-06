"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, ArrowRight, Check, AlertCircle } from "lucide-react";

interface EmailCaptureProps {
  postcode: string;
}

export function EmailCapture({ postcode }: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !consent) return;

    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, postcode }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to subscribe");
    }
  }

  return (
    <div className="card p-6 lg:p-8">
      <div className="lg:flex lg:items-start lg:gap-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 text-blue-600" />
        </div>

        <div className="flex-1 mt-4 lg:mt-0">
          <h2 className="text-lg font-semibold text-ink">
            Get alerts for your area
          </h2>
          <p className="text-sm text-muted mt-1">
            We&apos;ll email you when water quality data changes for {postcode}.
          </p>

          {status === "success" ? (
            <div className="mt-4 flex items-start gap-2 animate-fade-up">
              <Check className="w-5 h-5 text-safe shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-safe font-medium">
                  Check your inbox
                </p>
                <p className="text-xs text-muted mt-1">
                  We&apos;ve sent a confirmation email to <span className="font-medium text-ink">{email}</span>.
                  Click the link to activate your alerts for {postcode}.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === "submitting"}
                  className="flex-1 border border-rule rounded-lg px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={status === "submitting" || !consent}
                  className="bg-btn text-white rounded-lg px-5 py-2.5 text-sm font-medium flex items-center gap-1.5 hover:bg-btn-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {status === "submitting" ? "Sending\u2026" : "Subscribe"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              <label className="flex items-start gap-2 mt-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 rounded border-rule text-accent focus:ring-accent/20"
                />
                <span className="text-xs text-muted leading-relaxed">
                  I agree to receive water quality alerts by email. You can
                  unsubscribe at any time. See our{" "}
                  <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
                    privacy policy
                  </Link>.
                </span>
              </label>

              {status === "error" && (
                <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-danger)]">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errorMsg || "Something went wrong. Please try again."}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
