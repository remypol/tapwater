import { getAllIncidents } from "@/lib/incidents";
import { INCIDENT_TYPE_LABELS } from "@/lib/incidents-types";

export const revalidate = 300;

function xmlEscape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const { incidents } = await getAllIncidents(50);

  const baseUrl = "https://www.tapwater.uk";
  const feedUrl = `${baseUrl}/news/rss.xml`;
  const now = new Date().toUTCString();

  const items = incidents
    .map((incident) => {
      const link = `${baseUrl}/news/${xmlEscape(incident.slug)}`;
      const pubDate = new Date(incident.detected_at).toUTCString();
      const description = xmlEscape(incident.summary);
      const title = xmlEscape(incident.title);
      const category = xmlEscape(INCIDENT_TYPE_LABELS[incident.type]);
      const guid = link;

      return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${guid}</guid>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${category}</category>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TapWater.uk — UK Water Incident News</title>
    <link>${baseUrl}/news</link>
    <description>Live UK water incidents, boil notices, supply interruptions, and pollution alerts from official sources.</description>
    <language>en-gb</language>
    <lastBuildDate>${now}</lastBuildDate>
    <ttl>5</ttl>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
