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
  it("includes postcode in day-0 email", () => {
    const html = buildEmailHtml(baseSubscriber, 0);
    expect(html).toContain("SE15");
    expect(html).toContain("6.5");
  });

  it("includes top concern in day-3 email", () => {
    const html = buildEmailHtml(baseSubscriber, 3);
    expect(html).toContain("SE15");
    expect(html).toContain("Lead");
  });

  it("includes affiliate links in day-7 email", () => {
    const html = buildEmailHtml(baseSubscriber, 7);
    expect(html).toContain("SE15");
    // Should contain product recommendations with affiliate URLs
    expect(html).toContain("https://");
  });

  it("includes testing kit link in day-14 email", () => {
    const html = buildEmailHtml(baseSubscriber, 14);
    expect(html).toContain("testing");
  });

  it("includes postcode link in day-30 email", () => {
    const html = buildEmailHtml(baseSubscriber, 30);
    expect(html).toContain("SE15");
    expect(html).toContain("/postcode/SE15/");
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
    // Should not crash, should have fallback content
  });
});
