import { describe, it, expect } from "vitest";
import {
  countWords,
  hasThinFiller,
  isSubstantive,
  isIncidentIndexable,
  isNewsSitemapEligible,
  getIncidentLastModified,
  type IndexableIncidentFields,
} from "@/lib/incident-indexing";

const NOW = new Date("2026-09-07T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const iso = (daysAgo: number, hours = 0) =>
  new Date(NOW.getTime() - daysAgo * DAY - hours * 60 * 60 * 1000).toISOString();

// 300 distinct-ish words, no filler.
const SUBSTANTIVE = Array.from({ length: 300 }, (_, i) => `word${i}`).join(" ");
const SHORT = Array.from({ length: 249 }, (_, i) => `word${i}`).join(" ");

function incident(
  overrides: Partial<IndexableIncidentFields> = {},
): IndexableIncidentFields {
  return {
    status: "active",
    detected_at: iso(1),
    resolved_at: null,
    last_checked: iso(0, 1),
    article_markdown: SUBSTANTIVE,
    ...overrides,
  };
}

describe("countWords", () => {
  it("counts plain words", () => {
    expect(countWords("one two three")).toBe(3);
  });

  it("ignores markdown syntax", () => {
    expect(countWords("## Heading\n\n- **bold** item\n- [link](https://x.y) here")).toBe(5);
  });

  it("returns 0 for empty input", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
  });
});

describe("hasThinFiller", () => {
  it.each([
    "Further details are limited at this time.",
    "At present, DETAILS ARE LIMITED.",
    "The cause has not yet been confirmed by the supplier.",
    "There are no further details available.",
  ])("flags %j", (text) => {
    expect(hasThinFiller(text)).toBe(true);
  });

  it("passes text without filler", () => {
    expect(hasThinFiller("Severn Trent confirmed a burst main on Alcester Road.")).toBe(false);
  });
});

describe("isSubstantive", () => {
  it("requires at least 250 words", () => {
    expect(isSubstantive(SHORT)).toBe(false);
    expect(isSubstantive(SUBSTANTIVE)).toBe(true);
  });

  it("rejects long articles that still contain filler", () => {
    expect(isSubstantive(`${SUBSTANTIVE} Further details are limited.`)).toBe(false);
  });
});

describe("isIncidentIndexable — active", () => {
  it("indexes a fresh, substantive active incident", () => {
    expect(isIncidentIndexable(incident(), NOW)).toBe(true);
  });

  it("indexes right up to the 14-day boundary", () => {
    expect(isIncidentIndexable(incident({ detected_at: iso(14) }), NOW)).toBe(true);
  });

  it("drops active incidents detected more than 14 days ago", () => {
    expect(isIncidentIndexable(incident({ detected_at: iso(14, 1) }), NOW)).toBe(false);
    expect(isIncidentIndexable(incident({ detected_at: iso(90) }), NOW)).toBe(false);
  });

  it("drops active incidents with a short article", () => {
    expect(isIncidentIndexable(incident({ article_markdown: SHORT }), NOW)).toBe(false);
  });

  it("drops active incidents with filler", () => {
    expect(
      isIncidentIndexable(
        incident({ article_markdown: `${SUBSTANTIVE} No further details have been released.` }),
        NOW,
      ),
    ).toBe(false);
  });

  it("does not index an incident dated in the future", () => {
    expect(isIncidentIndexable(incident({ detected_at: iso(-1) }), NOW)).toBe(false);
  });

  it("does not index an incident with an unparseable date", () => {
    expect(isIncidentIndexable(incident({ detected_at: "not a date" }), NOW)).toBe(false);
  });
});

describe("isIncidentIndexable — resolved", () => {
  it("keeps a resolved incident indexable for 7 days after resolution", () => {
    expect(
      isIncidentIndexable(
        incident({ status: "resolved", detected_at: iso(20), resolved_at: iso(3) }),
        NOW,
      ),
    ).toBe(true);
    expect(
      isIncidentIndexable(
        incident({ status: "resolved", detected_at: iso(20), resolved_at: iso(7) }),
        NOW,
      ),
    ).toBe(true);
  });

  it("drops resolved incidents more than 7 days after resolution", () => {
    expect(
      isIncidentIndexable(
        incident({ status: "resolved", detected_at: iso(20), resolved_at: iso(7, 1) }),
        NOW,
      ),
    ).toBe(false);
  });

  it("uses resolved_at, not detected_at, for resolved incidents", () => {
    // Detected yesterday but somehow resolved 10 days ago: resolved_at wins.
    expect(
      isIncidentIndexable(
        incident({ status: "resolved", detected_at: iso(1), resolved_at: iso(10) }),
        NOW,
      ),
    ).toBe(false);
  });

  it("drops resolved incidents with no resolved_at", () => {
    expect(
      isIncidentIndexable(incident({ status: "resolved", resolved_at: null }), NOW),
    ).toBe(false);
  });

  it("still applies the word and filler tests to resolved incidents", () => {
    expect(
      isIncidentIndexable(
        incident({ status: "resolved", resolved_at: iso(1), article_markdown: SHORT }),
        NOW,
      ),
    ).toBe(false);
    expect(
      isIncidentIndexable(
        incident({
          status: "resolved",
          resolved_at: iso(1),
          article_markdown: `${SUBSTANTIVE} Details are limited.`,
        }),
        NOW,
      ),
    ).toBe(false);
  });
});

describe("isNewsSitemapEligible", () => {
  it("lists indexable articles published within 48 hours", () => {
    expect(isNewsSitemapEligible(incident({ detected_at: iso(1, 23) }), NOW)).toBe(true);
  });

  it("excludes articles older than 48 hours even when indexable", () => {
    expect(isNewsSitemapEligible(incident({ detected_at: iso(2, 1) }), NOW)).toBe(false);
  });

  it("excludes fresh but non-indexable articles", () => {
    expect(
      isNewsSitemapEligible(incident({ detected_at: iso(0, 2), article_markdown: SHORT }), NOW),
    ).toBe(false);
  });
});

describe("getIncidentLastModified", () => {
  it("returns last_checked when it is the newest timestamp", () => {
    const i = incident({ detected_at: iso(5), last_checked: iso(0, 1) });
    expect(getIncidentLastModified(i).toISOString()).toBe(iso(0, 1));
  });

  it("returns resolved_at when it is newer than last_checked", () => {
    const i = incident({ detected_at: iso(5), last_checked: iso(2), resolved_at: iso(1) });
    expect(getIncidentLastModified(i).toISOString()).toBe(iso(1));
  });

  it("falls back to detected_at when other timestamps are older or missing", () => {
    const i = incident({ detected_at: iso(0), last_checked: iso(3), resolved_at: null });
    expect(getIncidentLastModified(i).toISOString()).toBe(iso(0));
  });
});
