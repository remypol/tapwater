import { describe, expect, it } from "vitest";
import { incidentAlertEmail, subscribersForIncident, unsubscribeUrl, type AlertSubscriber } from "../incident-alerts";

const sub = (over: Partial<AlertSubscriber> = {}): AlertSubscriber => ({
  id: 1,
  email: "jo@example.com",
  postcode_district: "RG1",
  verified: true,
  unsubscribed: false,
  unsubscribe_token: "tok123",
  ...over,
});

describe("subscribersForIncident", () => {
  const incident = { affected_postcodes: ["rg1", "RG2"] };
  it("matches confirmed subscribers in an affected district", () => {
    expect(subscribersForIncident(incident, [sub(), sub({ id: 2, email: "al@example.com", postcode_district: "rg2" })])).toHaveLength(2);
  });
  it("leaves out other districts, unconfirmed addresses and people who unsubscribed", () => {
    const got = subscribersForIncident(incident, [
      sub({ postcode_district: "RG10" }),
      sub({ verified: false }),
      sub({ unsubscribed: true }),
      sub({ postcode_district: null }),
    ]);
    expect(got).toEqual([]);
  });
  it("emails each address once", () => {
    expect(subscribersForIncident(incident, [sub(), sub({ id: 9, email: "JO@example.com", postcode_district: "RG2" })])).toHaveLength(1);
  });
  it("sends nothing when the incident names no districts", () => {
    expect(subscribersForIncident({ affected_postcodes: [] }, [sub()])).toEqual([]);
  });
});

describe("incidentAlertEmail", () => {
  const incident = {
    title: "Burst main in <Reading>",
    slug: "burst-main-reading",
    type: "supply_interruption" as const,
    summary: "No water in parts of RG1.",
    action_required: "Use bottled water.",
    source_url: "https://example.com/incident",
  };
  it("names the district, links the article and escapes the title", () => {
    const mail = incidentAlertEmail(incident, sub());
    expect(mail.subject).toContain("RG1");
    expect(mail.html).toContain("https://www.tapwater.uk/news/burst-main-reading");
    expect(mail.html).toContain("&lt;Reading&gt;");
    expect(mail.html).toContain("Use bottled water.");
  });
  it("always carries a working unsubscribe link", () => {
    expect(incidentAlertEmail(incident, sub()).html).toContain("/unsubscribe?t=tok123");
    expect(unsubscribeUrl(sub({ unsubscribe_token: null }))).toBe("https://www.tapwater.uk/unsubscribe?email=jo%40example.com");
  });
});
