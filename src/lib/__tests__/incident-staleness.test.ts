import { describe, it, expect } from "vitest";
import {
  isCheckableSourceUrl,
  getSourceIncidentId,
  outcomeFromFeedBody,
  isStale,
  partitionStale,
} from "@/lib/incident-staleness";

const NOW = new Date("2026-09-07T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 60 * 60 * 1000).toISOString();

describe("isCheckableSourceUrl", () => {
  it("accepts absolute http(s) URLs", () => {
    expect(isCheckableSourceUrl("https://www.stwater.co.uk/in-my-area/incidents/")).toBe(true);
    expect(isCheckableSourceUrl("http://example.com/feed.xml")).toBe(true);
  });

  it("rejects the Severn Trent fragment that broke auto-resolve", () => {
    expect(isCheckableSourceUrl("#incident-tab-panel-0")).toBe(false);
  });

  it("rejects empty, null, relative and non-http values", () => {
    expect(isCheckableSourceUrl("")).toBe(false);
    expect(isCheckableSourceUrl(null)).toBe(false);
    expect(isCheckableSourceUrl(undefined)).toBe(false);
    expect(isCheckableSourceUrl("/in-my-area/incidents/")).toBe(false);
    expect(isCheckableSourceUrl("mailto:someone@example.com")).toBe(false);
  });
});

describe("getSourceIncidentId", () => {
  it("prefers id, then incidentId", () => {
    expect(getSourceIncidentId({ id: 42 })).toBe("42");
    expect(getSourceIncidentId({ incidentId: "abc" })).toBe("abc");
    expect(getSourceIncidentId({ id: "x", incidentId: "y" })).toBe("x");
  });

  it("returns empty string when there is nothing to match on", () => {
    expect(getSourceIncidentId({ link: "#incident-tab-panel-0", title: "t" })).toBe("");
    expect(getSourceIncidentId(null)).toBe("");
    expect(getSourceIncidentId(undefined)).toBe("");
  });
});

describe("outcomeFromFeedBody", () => {
  it("is active when the id is still in the feed", () => {
    expect(outcomeFromFeedBody("<item><id>123</id></item>", "123")).toBe("active");
  });

  it("is gone when the feed no longer contains the id", () => {
    expect(outcomeFromFeedBody("<item><id>999</id></item>", "123")).toBe("gone");
  });

  it("is unknown, never gone, when there is no id to look for", () => {
    expect(outcomeFromFeedBody("<item>anything</item>", "")).toBe("unknown");
  });
});

describe("isStale", () => {
  it("is stale once last_checked is at least the threshold old", () => {
    expect(isStale({ id: "a", last_checked: hoursAgo(168) }, 168, NOW)).toBe(true);
    expect(isStale({ id: "a", last_checked: hoursAgo(200) }, 168, NOW)).toBe(true);
  });

  it("is not stale when seen more recently than the threshold", () => {
    expect(isStale({ id: "a", last_checked: hoursAgo(167) }, 168, NOW)).toBe(false);
    expect(isStale({ id: "a", last_checked: hoursAgo(0) }, 48, NOW)).toBe(false);
  });

  it("treats an unparseable timestamp as stale", () => {
    expect(isStale({ id: "a", last_checked: "garbage" }, 48, NOW)).toBe(true);
  });
});

describe("partitionStale", () => {
  const incidents = [
    { id: "fresh", last_checked: hoursAgo(1) },
    { id: "alert", last_checked: hoursAgo(49) },
    { id: "boundary", last_checked: hoursAgo(168) },
    { id: "ancient", last_checked: hoursAgo(24 * 150) },
  ];

  it("resolves 7-day-stale incidents and alerts on 48h-stale ones", () => {
    const { toResolve, toAlert } = partitionStale(
      incidents,
      { alertHours: 48, autoResolveHours: 168 },
      NOW,
    );
    expect(toResolve.map((i) => i.id)).toEqual(["boundary", "ancient"]);
    expect(toAlert.map((i) => i.id)).toEqual(["alert"]);
  });

  it("never puts an incident in both buckets", () => {
    const { toResolve, toAlert } = partitionStale(
      incidents,
      { alertHours: 48, autoResolveHours: 168 },
      NOW,
    );
    const overlap = toResolve.filter((i) => toAlert.includes(i));
    expect(overlap).toEqual([]);
  });

  it("returns empty buckets when everything is fresh", () => {
    const { toResolve, toAlert } = partitionStale(
      [{ id: "a", last_checked: hoursAgo(2) }],
      { alertHours: 48, autoResolveHours: 168 },
      NOW,
    );
    expect(toResolve).toEqual([]);
    expect(toAlert).toEqual([]);
  });
});
