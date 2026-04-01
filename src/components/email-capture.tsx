"use client";

import { useState } from "react";
import { Bell, ArrowRight, Check } from "lucide-react";

interface EmailCaptureProps {
  postcode: string;
}

export function EmailCapture({ postcode }: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
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
            Stay informed about {postcode}
          </h2>
          <p className="text-sm text-muted mt-1">
            Get notified when water quality data changes in your area or when
            incidents affect your supply.
          </p>

          {subscribed ? (
            <div className="mt-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-safe shrink-0" />
              <p className="text-sm text-safe">
                You're subscribed. We'll email you when data changes for{" "}
                {postcode}.
              </p>
            </div>
          ) : (
            <>
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
                Monthly digest + breaking alerts. No spam, unsubscribe anytime.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
