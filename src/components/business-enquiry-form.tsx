"use client";

import { useState } from "react";

/** Pilot request form for /for-business. Posts to /api/business-enquiries. */
export function BusinessEnquiryForm() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError("");
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      const res = await fetch("/api/business-enquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="card p-6">
        <p className="font-medium text-ink">Request received.</p>
        <p className="text-sm text-body mt-2">
          We reply within one working day with a pilot key. Check your inbox for a confirmation.
        </p>
      </div>
    );
  }

  const field = "w-full rounded-lg border border-rule bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent";

  return (
    <form onSubmit={onSubmit} className="card p-6 grid gap-4" aria-label="Request a pilot key">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm text-body">
          Company
          <input id="biz-company" name="company" required maxLength={200} className={field} autoComplete="organization" />
        </label>
        <label className="grid gap-1.5 text-sm text-body">
          Your name
          <input id="biz-name" name="contactName" required maxLength={100} className={field} autoComplete="name" />
        </label>
        <label className="grid gap-1.5 text-sm text-body">
          Work email
          <input id="biz-email" name="email" type="email" required className={field} autoComplete="email" />
        </label>
        <label className="grid gap-1.5 text-sm text-body">
          Website
          <input id="biz-website" name="website" type="url" placeholder="https://" className={field} autoComplete="url" />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm text-body">
        What do you want to build with it?
        <textarea id="biz-usecase" name="useCase" required maxLength={2000} rows={4} className={field} placeholder="For example: show water hardness and quality on every listing page, or add a water section to our home-buyer report." />
      </label>
      <label className="grid gap-1.5 text-sm text-body">
        Roughly how many lookups a month?
        <select id="biz-volume" name="expectedVolume" className={field} defaultValue="">
          <option value="">Not sure yet</option>
          <option value="under-1k">Under 1,000</option>
          <option value="1k-10k">1,000 to 10,000</option>
          <option value="10k-50k">10,000 to 50,000</option>
          <option value="50k-plus">More than 50,000</option>
        </select>
      </label>
      {error && <p className="text-sm text-danger" role="alert">{error}</p>}
      <button
        type="submit"
        disabled={state === "sending"}
        className="justify-self-start inline-flex items-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60 transition-colors"
      >
        {state === "sending" ? "Sending…" : "Request a pilot key"}
      </button>
    </form>
  );
}
