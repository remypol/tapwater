import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * The page a click happened on must come from the router, never from a value
 * typed into a component.
 *
 * This is a guard against a bug that cost us a week of blind measurement:
 * ProductCard took an optional `pathname` prop defaulting to "/filters", and
 * fifteen of its seventeen render sites did not pass one. Clicks from the PFAS
 * pages, the contaminant pages, the category pages and the brand comparisons
 * all arrived in the click log as "/filters" — a page that carries no affiliate
 * links at all. Twenty of twenty-nine logged clicks pointed at a page that
 * cannot produce a click. Nothing failed, nothing warned; the number was simply
 * wrong, and every conclusion drawn from "which page earns" was wrong with it.
 *
 * AffiliateLink and RecommendationTracker now read `usePathname()` themselves.
 * These assertions stop a future caller from reintroducing the hand-written
 * version, which would look perfectly reasonable in review.
 */

const SRC = path.resolve(__dirname, "../..");

/**
 * Assigning a string literal to pathname: `pathname="/filters"`, `pathname: "/x"`.
 * The lookbehind keeps `url.pathname = ...` out of it, which is a URL being
 * rewritten (middleware does this legitimately), not a click being labelled.
 */
const LITERAL_PATHNAME = /(?<![.\w])pathname\s*[=:]\s*["'`]/;
/** Passing pathname as a prop or object value at all: `pathname={x}`, `pathname: x,`. */
const PASSED_PATHNAME = /(?<![.\w])pathname\s*=\s*\{|(?<![.\w])pathname\s*:\s*[a-zA-Z_$]/;

/**
 * The two components that log clicks. They are the only place the pathname is
 * allowed to enter the system, and they take it from the router.
 */
const RESOLVERS = ["components/affiliate-link.tsx", "components/conversion-tracker.tsx"];

/**
 * Plus the payload builder, which is the sink: it declares `pathname` on the
 * context type and copies it into the event. It never chooses a value.
 */
const ALLOWED = [...RESOLVERS, "lib/affiliate.ts"];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      return entry === "__tests__" ? [] : sourceFiles(full);
    }
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

function offenders(pattern: RegExp): string[] {
  return sourceFiles(SRC)
    .map((file) => ({ rel: path.relative(SRC, file), body: readFileSync(file, "utf8") }))
    .filter(({ rel }) => !ALLOWED.includes(rel))
    .flatMap(({ rel, body }) =>
      body
        .split("\n")
        .map((line, i) => ({ line: line.trim(), n: i + 1 }))
        .filter(({ line }) => pattern.test(line))
        .map(({ line, n }) => `${rel}:${n} → ${line}`),
    );
}

describe("click attribution", () => {
  it("never hardcodes the page a click came from", () => {
    expect(offenders(LITERAL_PATHNAME)).toEqual([]);
  });

  it("never threads the page through props either", () => {
    // Even a correct value passed by hand is one copy-paste away from being
    // wrong, and it goes stale silently when a route is renamed.
    expect(offenders(PASSED_PATHNAME)).toEqual([]);
  });

  it("resolves the pathname from the router in the components that log clicks", () => {
    for (const rel of RESOLVERS) {
      const body = readFileSync(path.join(SRC, rel), "utf8");
      expect(body, `${rel} should call usePathname()`).toMatch(/usePathname\(\)/);
    }
  });
});
