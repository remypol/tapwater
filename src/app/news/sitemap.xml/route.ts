import { getAllIncidents } from "@/lib/incidents";

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
  const cutoff = Date.now() - 48 * 60 * 60 * 1000; // 48 hours — Google News requirement

  const recentIncidents = incidents.filter(
    (incident) => new Date(incident.detected_at).getTime() > cutoff,
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
