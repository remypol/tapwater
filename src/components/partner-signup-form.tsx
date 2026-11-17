"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FREE_LEADS } from "@/lib/partner-offer";

export interface PartnerArea {
  /** "RG" */
  area: string;
  /** "Reading" */
  town: string;
  /** Median hardness across the area, mg/L. */
  median: number;
  /** Quote requests from the area in the last 90 days. */
  requests: number;
}

const MAX_AREAS = 12;

/**
 * The installer application. The areas are the form: each one shows how hard the
 * water is and how many homeowners asked for quotes there recently, so an
 * installer picks territory by looking at demand, not by reading a pitch.
 */
export function PartnerSignupForm({ areas }: { areas: PartnerArea[] }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const busy = status === "submitting";
  const visible = showAll ? areas : areas.slice(0, 24);
  const pickedRequests = areas.filter((a) => picked.includes(a.area)).reduce((sum, a) => sum + a.requests, 0);

  function toggle(area: string) {
    setErrorMsg("");
    setPicked((prev) => {
      if (prev.includes(area)) return prev.filter((a) => a !== area);
      if (prev.length >= MAX_AREAS) {
        setErrorMsg(`Pick up to ${MAX_AREAS} areas. Remove one to add another.`);
        return prev;
      }
      return [...prev, area];
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (picked.length === 0) {
      setStatus("error");
      setErrorMsg("Pick at least one postcode area you cover.");
      return;
    }
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, contactName, email, phone, website: website || undefined, areas: picked }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "The application was not sent. Try again in a minute.");
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "The application was not sent. Try again in a minute.");
    }
  }

  if (status === "success") {
    return (
      <div className="wt-join-done" role="status">
        <h3>Application sent</h3>
        <p>
          We have {companyName} down for {picked.join(", ")}. We check every installer before sharing homeowners&rsquo; details, usually within one
          working day, and email {email} the moment your account is live. Your first {FREE_LEADS} leads are free.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="wt-join" noValidate={false}>
      <fieldset disabled={busy}>
        <legend>Which postcode areas do you cover?</legend>
        <p className="wt-join-hint">
          Hard-water areas only, busiest first. The number is how many homeowners asked us for softener quotes there in the last 90 days.
        </p>
        <div className="wt-areas">
          {visible.map((a) => {
            const on = picked.includes(a.area);
            return (
              <button key={a.area} type="button" className="wt-area" aria-pressed={on} onClick={() => toggle(a.area)}>
                <b>{a.area}</b>
                <span>{a.town}</span>
                <small className="wt-nums">{a.median} mg/L</small>
                {a.requests > 0 ? (
                  <em className="wt-nums">
                    {a.requests} request{a.requests === 1 ? "" : "s"}
                  </em>
                ) : null}
              </button>
            );
          })}
        </div>
        {areas.length > 24 && !showAll ? (
          <button type="button" className="wt-link wt-join-more" onClick={() => setShowAll(true)}>
            Show all {areas.length} hard-water areas
          </button>
        ) : null}
        <p className="wt-join-tally wt-nums" aria-live="polite">
          {picked.length === 0
            ? "No areas picked yet."
            : `${picked.length} area${picked.length === 1 ? "" : "s"} picked: ${picked.join(", ")}. ${pickedRequests} request${pickedRequests === 1 ? "" : "s"} there in the last 90 days.`}
        </p>
      </fieldset>

      <fieldset disabled={busy}>
        <legend>Who are you?</legend>
        <div className="wt-fields">
          <label>
            Company name
            <input type="text" required maxLength={200} autoComplete="organization" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </label>
          <label>
            Your name
            <input type="text" required maxLength={100} autoComplete="name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          </label>
          <label>
            Email for leads
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Phone
            <input type="tel" required autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="wt-fields-wide">
            Website, if you have one
            <input type="text" maxLength={200} autoComplete="url" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>
        </div>
      </fieldset>

      {errorMsg ? (
        <p className="wt-join-error" role="alert">
          {errorMsg}
        </p>
      ) : null}

      <button type="submit" className="wt-btn wt-btn--ink" disabled={busy}>
        {busy ? "Sending application" : "Apply for these areas"}
        <ArrowRight aria-hidden="true" />
      </button>
      <p className="wt-join-small">
        No card needed to apply. By applying you agree to contact homeowners only about the quote they asked for.{" "}
        <Link href="/privacy" className="wt-link">
          Privacy policy
        </Link>
      </p>
    </form>
  );
}
