import { describe, it, expect } from "vitest";
import {
  summariseSoftenerLeadBacklog,
  describeSoftenerLeadBacklog,
} from "../pipeline-health";

const NOW = new Date("2026-09-07T12:00:00Z");

describe("summariseSoftenerLeadBacklog", () => {
  it("reports no backlog when there are no new leads", () => {
    expect(summariseSoftenerLeadBacklog(0, null, NOW)).toEqual({
      newCount: 0,
      oldestAgeDays: null,
    });
  });

  it("measures the oldest lead's age in whole days", () => {
    const backlog = summariseSoftenerLeadBacklog(3, "2026-09-02T09:30:00Z", NOW);
    expect(backlog).toEqual({ newCount: 3, oldestAgeDays: 5 });
  });

  it("rounds a lead created earlier today down to zero days", () => {
    expect(summariseSoftenerLeadBacklog(1, "2026-09-07T08:00:00Z", NOW).oldestAgeDays).toBe(0);
  });

  it("never reports a negative age for a clock-skewed timestamp", () => {
    expect(summariseSoftenerLeadBacklog(1, "2026-09-08T08:00:00Z", NOW).oldestAgeDays).toBe(0);
  });

  it("keeps the count but drops the age when the timestamp is unreadable", () => {
    expect(summariseSoftenerLeadBacklog(2, "not-a-date", NOW)).toEqual({
      newCount: 2,
      oldestAgeDays: null,
    });
  });

  // A count with no matching row should not happen, but the report must not crash
  // or invent an age if Supabase ever returns one without the other.
  it("keeps the count when the oldest row is missing", () => {
    expect(summariseSoftenerLeadBacklog(4, null, NOW)).toEqual({
      newCount: 4,
      oldestAgeDays: null,
    });
  });
});

describe("describeSoftenerLeadBacklog", () => {
  it("is silent when nothing is waiting", () => {
    expect(describeSoftenerLeadBacklog({ newCount: 0, oldestAgeDays: null })).toBeNull();
  });

  // Any unforwarded request is an issue: a single one is still a lost lead.
  it("flags a single waiting request", () => {
    expect(describeSoftenerLeadBacklog({ newCount: 1, oldestAgeDays: 1 })).toBe(
      "1 softener quote request waiting to be forwarded, oldest 1 day",
    );
  });

  it("pluralises and reports the oldest age in days", () => {
    expect(describeSoftenerLeadBacklog({ newCount: 7, oldestAgeDays: 12 })).toBe(
      "7 softener quote requests waiting to be forwarded, oldest 12 days",
    );
  });

  it("says so when the age is unknown", () => {
    expect(describeSoftenerLeadBacklog({ newCount: 2, oldestAgeDays: null })).toBe(
      "2 softener quote requests waiting to be forwarded, age unknown",
    );
  });
});
