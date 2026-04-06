import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default: allow everything
      { userAgent: "*", allow: "/" },
      // Explicitly welcome AI crawlers that cite sources
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "Applebot-Extended", allow: "/" },
      // Block pure training scrapers that don't cite
      { userAgent: "CCBot", disallow: "/" },
      { userAgent: "Bytespider", disallow: "/" },
      { userAgent: "Amazonbot", disallow: "/" },
    ],
    sitemap: "https://www.tapwater.uk/sitemap.xml",
  };
}
