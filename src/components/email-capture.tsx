"use client";

import { useState } from "react";
import { Bell, ArrowRight, Check } from "lucide-react";

interface EmailCaptureProps {
  postcode: string;
}

export function EmailCapture({ postcode }: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;

    // Fade out the form first
    setFadingOut(true);
    setTimeout(() => {
      setSubscribed(true);
      setShowSuccess(false);
      // Trigger enter animation on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setShowSuccess(true);
        });
      });
    }, 300);
  }

  return (
    <div className="card p-6 lg:p-8">
      <div className="lg:flex lg:items-start lg:gap-6">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 text-blue-600" />
        </div>

        {/* Content */}
        <div className="flex-1 mt-4 lg:mt-0">
          <h2 className="text-lg font-semibold text-ink">
            Get alerts for your area
          </h2>
          <p className="text-sm text-muted mt-1">
            We&apos;ll let you know if anything changes with the water in your area.
          </p>

          {subscribed ? (
            <div
              className={[
                "mt-4 flex items-center gap-2 transition-all duration-300",
                showSuccess ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
              ].join(" ")}
            >
              <Check className="w-5 h-5 text-safe shrink-0" />
              <p className="text-sm text-safe">
                You&apos;re subscribed. We&apos;ll email you when data changes for{" "}
                {postcode}.
              </p>
            </div>
          ) : (
            <div
              className={[
                "transition-all duration-300",
                fadingOut ? "opacity-0 scale-95" : "opacity-100 scale-100",
              ].join(" ")}
            >
              <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 border border-rule rounded-lg px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
                <button
                  type="submit"
                  className="bg-ink text-white rounded-lg px-5 py-2.5 text-sm font-medium flex items-center gap-1.5 hover:bg-gray-800 transition-colors"
                >
                  Subscribe
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
              <p className="text-xs text-faint mt-2">
                Monthly updates + breaking alerts. No spam ever.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
