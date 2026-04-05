import { describe, it, expect } from "vitest";
import { getNextEmail, shouldSendEmail, buildEmailHtml } from "../email-sequences";
import type { SubscriberSequenceState } from "../types";

const baseSubscriber: SubscriberSequenceState = {
  email: "test@example.com",
  postcodeDistrict: "SE15",
  waterDataSnapshot: {
    safetyScore: 6.5,
    scoreGrade: "fair",
    contaminantsFlagged: 2,
    topConcerns: ["Lead", "PFAS (total)"],
    pfasDetected: true,
  },
  subscribedAt: "2026-04-01T10:00:00Z",
  lastEmailSent: null,
  lastEmailSentAt: null,
};

describe("getNextEmail", () => {
  it("returns day-0 email for new subscriber", () => {
    const email = getNextEmail(baseSubscriber);
    expect(email).toBeDefined();
    expect(email!.step).toBe(0);
    expect(email!.subject).toContain("SE15");
    expect(email!.subject).toContain("scored");
  });

  it("returns day-3 email after day-0", () => {
    const sub = { ...baseSubscriber, lastEmailSent: 0 as const, lastEmailSentAt: "2026-04-01T10:00:00Z" };
    const email = getNextEmail(sub);
    expect(email).toBeDefined();
    expect(email!.step).toBe(3);
  });

  it("returns day-7 after day-3", () => {
    const sub = { ...baseSubscriber, lastEmailSent: 3 as const, lastEmailSentAt: "2026-04-04T10:00:00Z" };
    const email = getNextEmail(sub);
    expect(email!.step).toBe(7);
  });

  it("returns null after all emails sent", () => {
    const sub = { ...baseSubscriber, lastEmailSent: 30 as const, lastEmailSentAt: "2026-05-01T10:00:00Z" };
    const email = getNextEmail(sub);
    expect(email).toBeNull();
  });
});

describe("shouldSendEmail", () => {
  it("sends day-0 immediately", () => {
    expect(shouldSendEmail(baseSubscriber, 0, new Date("2026-04-01T10:01:00Z"))).toBe(true);
  });

  it("waits 3 days for day-3 email", () => {
    const sub = { ...baseSubscriber, lastEmailSent: 0 as const, lastEmailSentAt: "2026-04-01T10:00:00Z" };
    expect(shouldSendEmail(sub, 3, new Date("2026-04-03T09:00:00Z"))).toBe(false);
    expect(shouldSendEmail(sub, 3, new Date("2026-04-04T11:00:00Z"))).toBe(true);
  });

  it("waits 4 days for day-7 email (7-3=4)", () => {
    const sub = { ...baseSubscriber, lastEmailSent: 3 as const, lastEmailSentAt: "2026-04-04T10:00:00Z" };
    expect(shouldSendEmail(sub, 7, new Date("2026-04-07T09:00:00Z"))).toBe(false);
    expect(shouldSendEmail(sub, 7, new Date("2026-04-08T11:00:00Z"))).toBe(true);
  });
});

describe("buildEmailHtml", () => {
  it("day-0 contains score, postcode, and 'scored'", () => {
    const html = buildEmailHtml(baseSubscriber, 0);
    expect(html).toContain("SE15");
    expect(html).toContain("6.5");
  });

  it("day-3 contains contaminant name and 'found in'", () => {
    const html = buildEmailHtml(baseSubscriber, 3);
    expect(html).toContain("Lead");
    expect(html).toContain("Found in");
  });

  it("day-7 contains affiliate URLs and product names", () => {
    const html = buildEmailHtml(baseSubscriber, 7);
    expect(html).toContain("SE15");
    expect(html).toContain("https://");
    // Should contain product recommendations
    expect(html).toContain("Our pick for");
  });

  it("day-14 contains 'test' and 'pipes'", () => {
    const html = buildEmailHtml(baseSubscriber, 14);
    expect(html).toContain("test");
    expect(html).toContain("pipes");
  });

  it("day-30 contains postcode and 'update'", () => {
    const html = buildEmailHtml(baseSubscriber, 30);
    expect(html).toContain("SE15");
    expect(html).toContain("update");
  });

  it("subject lines match new format", () => {
    const day0 = getNextEmail(baseSubscriber);
    expect(day0!.subject).toContain("scored 6.5");
    expect(day0!.subject).toContain("2 contaminants flagged");

    const sub3 = { ...baseSubscriber, lastEmailSent: 0 as const, lastEmailSentAt: "2026-04-01T10:00:00Z" };
    const day3 = getNextEmail(sub3);
    expect(day3!.subject).toContain("Lead was found in");

    const sub7 = { ...baseSubscriber, lastEmailSent: 3 as const, lastEmailSentAt: "2026-04-04T10:00:00Z" };
    const day7 = getNextEmail(sub7);
    expect(day7!.subject).toContain("filter");

    const sub14 = { ...baseSubscriber, lastEmailSent: 7 as const, lastEmailSentAt: "2026-04-08T10:00:00Z" };
    const day14 = getNextEmail(sub14);
    expect(day14!.subject).toContain("pipes");
    expect(day14!.subject).toContain("test");

    const sub30 = { ...baseSubscriber, lastEmailSent: 14 as const, lastEmailSentAt: "2026-04-15T10:00:00Z" };
    const day30 = getNextEmail(sub30);
    expect(day30!.subject).toContain("SE15");
    expect(day30!.subject).toContain("changed");
  });

  it("handles subscriber with no concerns", () => {
    const sub = {
      ...baseSubscriber,
      waterDataSnapshot: {
        ...baseSubscriber.waterDataSnapshot,
        contaminantsFlagged: 0,
        topConcerns: [],
        pfasDetected: false,
      },
    };
    const html = buildEmailHtml(sub, 3);
    expect(html).toContain("SE15");
    // Should have fallback content
    expect(html).toContain("looks good");
  });
});
