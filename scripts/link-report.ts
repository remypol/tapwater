/**
 * Every outbound shop link on the site, with the traffic it gets and what it can earn.
 *
 *   npx tsx scripts/link-report.ts [days]     default 90; writes docs/business/link-report-<date>.md
 *
 * Three sources, joined by product: our click log (affiliate_clicks), Search
 * Console (how many search visits each page gets) and Awin's own report (what
 * was actually recorded and paid). Amazon and Osmio earnings are not available
 * to this script; their columns are estimates and say so.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PRODUCTS, estimatedEarningsGbp } from "../src/lib/products";
import { getAccessToken, gscConfigured, query } from "./gsc-weekly";

config({ path: ".env.local" });

const DAYS = Number(process.argv[2] ?? 90);
const AWIN_PUBLISHER = Number(process.env.AWIN_PUBLISHER_ID ?? 2996923);
/** Brands whose own shop pays us through Awin today. A product of theirs on Amazon is a link to move. */
const JOINED_DIRECT: Record<string, { advertiser: number; rate: number; shop: string }> = {
  Waterdrop: { advertiser: 117649, rate: 0.07, shop: "waterdropfilter.co.uk" },
  Frizzlife: { advertiser: 117015, rate: 0.1, shop: "frizzlife.co.uk" },
  Doulton: { advertiser: 69790, rate: 0.05, shop: "doulton.com" },
};
/** Hosts that are data sources or infrastructure, not shops. */
const NOT_SHOPS = /tapwater\.uk|gov\.uk|schema\.org|w3\.org|localhost|supabase|google|gstatic|vercel|example\.com|water\.co\.uk|stwater|scottishwater|unitedutilities|yorkshirewater|nwl\.co\.uk|dwrcymru|niwater|eswater|water\.com|arcgis|opengis|sitemaps|postcodes\.io|stripe|cdc\.gov|ukas\.com|x\.com|x\.y|evilawin|notamazon|media-amazon|sentry|mapbox|resend|awin\.com|eastmidlandswater/;

interface Click { product_slug: string; partner: string; page: string; placement: string | null }

const group = (page: string) => (page.startsWith("/postcode/") ? "/postcode/*" : page.startsWith("/hardness/") ? "/hardness/*" : page.startsWith("/city/") ? "/city/*" : page.split("?")[0]);
const gbp = (n: number) => `£${n.toFixed(2)}`;

async function clicks(): Promise<Click[]> {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const since = new Date(Date.now() - DAYS * 86_400_000).toISOString();
  const rows: Click[] = [];
  for (let o = 0; ; o += 1000) {
    const { data, error } = await sb.from("affiliate_clicks").select("product_slug, partner, page, placement").gte("clicked_at", since).range(o, o + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data as Click[]));
    if (data.length < 1000) break;
  }
  return rows.filter((r) => !r.product_slug.startsWith("full-report"));
}

async function searchVisits(): Promise<Map<string, { clicks: number; impressions: number }>> {
  const out = new Map<string, { clicks: number; impressions: number }>();
  if (!gscConfigured()) return out;
  const token = await getAccessToken();
  const end = new Date(Date.now() - 2 * 86_400_000);
  const start = new Date(end.getTime() - DAYS * 86_400_000);
  for (let startRow = 0; startRow < 25_000; startRow += 5000) {
    const rows = await query(token, { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10), dimensions: ["page"], rowLimit: 5000, startRow });
    for (const r of rows) {
      const g = group(new URL(r.keys[0]).pathname);
      const cur = out.get(g) ?? { clicks: 0, impressions: 0 };
      out.set(g, { clicks: cur.clicks + r.clicks, impressions: cur.impressions + r.impressions });
    }
    if (rows.length < 5000) break;
  }
  return out;
}

async function awinReport(): Promise<Map<number, { name: string; clicks: number; sales: number; commission: number }>> {
  const out = new Map<number, { name: string; clicks: number; sales: number; commission: number }>();
  const token = (process.env.AWIN_API_TOKEN ?? "").trim();
  if (!token) return out;
  const end = new Date();
  const start = new Date(end.getTime() - DAYS * 86_400_000);
  const res = await fetch(`https://api.awin.com/publishers/${AWIN_PUBLISHER}/reports/advertiser?startDate=${start.toISOString().slice(0, 10)}&endDate=${end.toISOString().slice(0, 10)}&region=GB&timezone=UTC`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return out;
  for (const r of (await res.json()) as Record<string, number | string>[]) {
    out.set(Number(r.advertiserId), { name: String(r.advertiserName), clicks: Number(r.clicks), sales: Number(r.totalNo), commission: Number(r.totalComm) });
  }
  return out;
}

/** Shop links written straight into pages, outside the product list. */
function inlineShopLinks(): Map<string, Map<string, number>> {
  const hosts = new Map<string, Map<string, number>>();
  const walk = (dir: string) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) { if (f !== "__tests__") walk(p); continue; }
      if (!/\.tsx?$/.test(f) || p.endsWith("lib/products.ts") || p.endsWith("mock-data.ts")) continue;
      for (const m of readFileSync(p, "utf8").matchAll(/https?:\/\/([a-zA-Z0-9.-]+)[^\s"'`)]*/g)) {
        const host = m[1].replace(/^www\./, "");
        if (NOT_SHOPS.test(host)) continue;
        const files = hosts.get(host) ?? new Map<string, number>();
        const rel = p.replace(/^src\//, "").replace(/\/page\.tsx$/, "").replace(/^app/, "");
        files.set(rel, (files.get(rel) ?? 0) + 1);
        hosts.set(host, files);
      }
    }
  };
  walk("src");
  return hosts;
}

async function main() {
  const [log, visits, awin] = await Promise.all([clicks(), searchVisits(), awinReport()]);
  const lines: string[] = [];
  const today = new Date().toISOString().slice(0, 10);
  lines.push(`# Outbound shop links, last ${DAYS} days (to ${today})`, "");
  lines.push(`Made by \`npx tsx scripts/link-report.ts ${DAYS}\`. Clicks are from our own log, which counts bots too. Search visits are Search Console clicks. "Estimated per sale" is price times the programme's rate; for Amazon and Osmio nothing here is measured income.`, "");

  // ── Programmes ──
  const byPartner = new Map<string, number>();
  for (const c of log) byPartner.set(c.partner, (byPartner.get(c.partner) ?? 0) + 1);
  lines.push("## By programme", "", "| Programme | Our clicks | Recorded by the programme | Sales | Commission |", "|---|---|---|---|---|");
  const awinTotals = [...awin.values()].reduce((a, r) => ({ clicks: a.clicks + r.clicks, sales: a.sales + r.sales, commission: a.commission + r.commission }), { clicks: 0, sales: 0, commission: 0 });
  for (const [partner, n] of [...byPartner].sort((a, b) => b[1] - a[1])) {
    lines.push(partner === "awin" ? `| Awin | ${n} | ${awinTotals.clicks} | ${awinTotals.sales} | ${gbp(awinTotals.commission)} |` : `| ${partner} | ${n} | not available here | not available here | not available here |`);
  }
  lines.push("");
  if (awin.size) {
    lines.push("Awin by advertiser: " + [...awin.values()].map((r) => `${r.name} ${r.clicks} clicks, ${r.sales} sales, ${gbp(r.commission)}`).join("; ") + ".", "");
  }

  // ── Products ──
  const perProduct = new Map<string, { n: number; pages: Map<string, number> }>();
  for (const c of log) {
    const e = perProduct.get(c.product_slug) ?? { n: 0, pages: new Map() };
    e.n++;
    e.pages.set(group(c.page), (e.pages.get(group(c.page)) ?? 0) + 1);
    perProduct.set(c.product_slug, e);
  }
  lines.push("## Every product link", "", "| Product | Clicks | Where the clicks come from | Paid through | Rate | Price | Estimated per sale | Better link we already have |", "|---|---|---|---|---|---|---|---|");
  const rows = PRODUCTS.map((p) => ({ p, e: perProduct.get(p.slug) ?? perProduct.get(p.id) ?? { n: 0, pages: new Map<string, number>() } })).sort((a, b) => b.e.n - a.e.n);
  for (const { p, e } of rows) {
    const where = [...e.pages].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([pg, n]) => `${pg.replace("/guides/", "")} ${n}`).join(", ") || "none";
    const rate = p.commission?.type === "percent" ? `${Math.round(p.commission.rate * 100)}%` : p.affiliateProgram === "direct" ? "own programme" : "?";
    const est = estimatedEarningsGbp(p);
    const direct = JOINED_DIRECT[p.brand];
    const better = direct && p.affiliateProgram === "amazon" ? `${direct.shop} through Awin at ${Math.round(direct.rate * 100)}%` : "";
    lines.push(`| ${p.brand} ${p.model} | ${e.n} | ${where} | ${p.affiliateProgram} | ${rate} | ${p.priceGbp ? `£${p.priceGbp}` : "not set"} | ${est != null ? gbp(est) : "unknown"} | ${better} |`);
  }
  lines.push("");

  // ── Pages ──
  const perPage = new Map<string, number>();
  for (const c of log) perPage.set(group(c.page), (perPage.get(group(c.page)) ?? 0) + 1);
  lines.push("## Pages that send clicks to shops", "", "| Page | Search visits | Shop clicks | Clicks per 100 visits |", "|---|---|---|---|");
  for (const [pg, n] of [...perPage].sort((a, b) => b[1] - a[1]).slice(0, 30)) {
    const v = visits.get(pg);
    lines.push(`| ${pg} | ${v ? v.clicks : "no data"} | ${n} | ${v && v.clicks ? ((n / v.clicks) * 100).toFixed(1) : "n/a"} |`);
  }
  lines.push("");
  const silent = [...visits].filter(([pg, v]) => v.clicks >= 30 && !(perPage.get(pg) ?? 0)).sort((a, b) => b[1].clicks - a[1].clicks).slice(0, 15);
  if (silent.length) {
    lines.push("Pages with 30 or more search visits and no shop clicks at all: " + silent.map(([pg, v]) => `${pg} (${v.clicks})`).join(", ") + ".", "");
  }

  // ── Inline links ──
  lines.push("## Shop links written into pages that pay nothing", "", "| Shop | Links | Pages |", "|---|---|---|");
  for (const [host, files] of [...inlineShopLinks()].sort((a, b) => [...b[1].values()].reduce((x, y) => x + y, 0) - [...a[1].values()].reduce((x, y) => x + y, 0))) {
    if (/amazon\.co\.uk|awin1\.com|osmiowater/.test(host)) continue;
    lines.push(`| ${host} | ${[...files.values()].reduce((x, y) => x + y, 0)} | ${[...files.keys()].join(", ")} |`);
  }
  lines.push("");

  const file = `docs/business/link-report-${today}.md`;
  writeFileSync(file, lines.join("\n"));
  console.log(lines.join("\n"));
  console.log(`\nwritten ${file}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
