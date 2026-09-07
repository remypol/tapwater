import { getAllIncidents } from "@/lib/incidents";
import { isNewsSitemapEligible } from "@/lib/incident-indexing";

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
  const { incidents } = await getAllIncidents(100);

  const baseUrl = "https://www.tapwater.uk";

  // Google News requires articles from the last 48 hours; we additionally
  // require the article to pass the site's indexability rule, so a thin
  // auto-generated stub never reaches News even when it is brand new.
  const now = new Date();
  const recentIncidents = incidents.filter((incident) =>
    isNewsSitemapEligible(incident, now),
  );

  const urlEntries = recentIncidents
    .map((incident) => {
      const loc = `${baseUrl}/news/${xmlEscape(incident.slug)}`;
      const pubDate = new Date(incident.detected_at)
        .toISOString()
        .replace(".000Z", "+00:00");
      const title = xmlEscape(incident.title);

      return `  <url>
    <loc>${loc}</loc>
    <news:news>
      <news:publication>
        <news:name>TapWater.uk</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
>
${urlEntries}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
