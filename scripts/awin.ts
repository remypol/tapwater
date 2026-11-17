/**
 * Awin, from the command line: which programmes we are really joined to, what
 * they have paid, and tracking links built by Awin itself.
 *
 * Why this exists: we own two Awin publisher accounts, 2996923 (CCC Impact B.V.,
 * joined to Waterdrop, Frizzlife and Doulton) and 3091503 (CCC Impact BV, joined
 * to nothing). On 22 September 2026 every link was moved to 3091503 on a reading
 * of the dashboard. Awin redirects any live id, so the links "worked", and for
 * eight weeks Awin recorded no clicks and no sales. The only proof a link earns
 * is what Awin's API says about the account in the link, and that is what `check`
 * reads: it asks Awin which of our accounts has joined each programme and whether
 * Awin is recording the clicks we log. AWIN_PUBLISHER_ID picks the account for
 * the other commands.
 *
 * Setup: create a token at https://ui.awin.com/awin-api (signed in as the
 * publisher account) and add it to .env.local as AWIN_API_TOKEN. Read access is
 * enough. Nothing here applies to a programme or changes the account; Awin's
 * API has no call for that.
 *
 *   npx tsx scripts/awin.ts programmes [joined|pending|rejected|notjoined]
 *   npx tsx scripts/awin.ts check            every Awin link in products.ts against the joined list
 *   npx tsx scripts/awin.ts earnings [days]  transactions, set against our own click log (default 90)
 *   npx tsx scripts/awin.ts report [days]    Awin's own clicks, sales and commission per advertiser
 *   npx tsx scripts/awin.ts link <advertiserId> <url>   a tracking link from Awin's link builder
 *
 * Paths and parameters follow help.awin.com/apidocs as read on 17 November 2026:
 * base https://api.awin.com, Bearer token, 20 calls a minute, transactions in
 * windows of at most 31 days. The response field names have not been seen against
 * a live account yet, so the output prints what it finds and says when a field
 * it expected is missing.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PRODUCTS } from "../src/lib/products";

config({ path: ".env.local" });

const BASE = "https://api.awin.com";
/** The account that holds the approvals (CCC Impact B.V.). Also the awinaffid in every link. */
const PUBLISHER_ID = Number(process.env.AWIN_PUBLISHER_ID ?? 2996923);
const TOKEN = (process.env.AWIN_API_TOKEN ?? "").trim();
const PAUSE_MS = 3200; // 20 calls a minute

type Json = Record<string, unknown>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;

async function awin(path: string, init: RequestInit = {}): Promise<unknown> {
  if (!TOKEN) {
    console.error(
      "AWIN_API_TOKEN is not set.\nCreate a token at https://ui.awin.com/awin-api while signed in to publisher " +
        `${PUBLISHER_ID}, then add this line to .env.local:\n\n  AWIN_API_TOKEN=<the token>\n`,
    );
    process.exit(1);
  }
  const wait = lastCall + PAUSE_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastCall = Date.now();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json", "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Awin ${res.status} on ${path.split("?")[0]}: ${text.slice(0, 300)}`);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const num = (v: unknown): number => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)) ? Number(v) : 0);
const amount = (v: unknown): number => (v && typeof v === "object" ? num((v as Json).amount) : num(v));
const pick = (o: Json, ...keys: string[]): unknown => keys.map((k) => o[k]).find((v) => v !== undefined && v !== null);
const isoNoZone = (d: Date) => d.toISOString().slice(0, 19);

export interface AwinProductLink {
  id: string;
  advertiserId: number;
  publisherId: number;
  destination: string;
}

/** Every Awin link in the product list, with the advertiser and publisher ids it carries. */
export function awinLinksInProducts(): AwinProductLink[] {
  const out: AwinProductLink[] = [];
  for (const p of PRODUCTS) {
    if (!/awin1\.com/.test(p.affiliateUrl)) continue;
    const url = new URL(p.affiliateUrl);
    out.push({
      id: p.id,
      advertiserId: Number(url.searchParams.get("awinmid") ?? url.searchParams.get("mid") ?? 0),
      publisherId: Number(url.searchParams.get("awinaffid") ?? url.searchParams.get("id") ?? 0),
      destination: url.searchParams.get("ued") ?? url.searchParams.get("p") ?? "",
    });
  }
  return out;
}

async function programmes(relationship: string): Promise<Json[]> {
  // No country filter: Frizzlife, Jolie and Hello Klean are registered in the US and sell in the UK.
  const data = await awin(`/publishers/${PUBLISHER_ID}/programmes?relationship=${encodeURIComponent(relationship)}`);
  return Array.isArray(data) ? (data as Json[]) : [];
}

async function cmdProgrammes(relationship: string) {
  const list = await programmes(relationship);
  console.log(`${list.length} programmes with relationship "${relationship}":\n`);
  for (const p of list.sort((a, b) => String(a.name).localeCompare(String(b.name)))) {
    console.log(`${String(pick(p, "id", "advertiserId")).padEnd(8)} ${String(p.name ?? "?").padEnd(42)} ${String(pick(p, "primarySector", "sector") ?? "")}`);
  }
  if (list[0]) console.log(`\nFields returned: ${Object.keys(list[0]).join(", ")}`);
}

async function joinedOn(publisherId: number): Promise<Map<number, string>> {
  // No country filter: Frizzlife is registered in the US and also covers frizzlife.co.uk.
  const data = await awin(`/publishers/${publisherId}/programmes?relationship=joined`);
  return new Map((Array.isArray(data) ? (data as Json[]) : []).map((p) => [num(pick(p, "id", "advertiserId")), String(p.name ?? "")]));
}

/**
 * Three questions per link, all answered by Awin and none by a constant in this
 * file: has the account in the link joined the programme, would another of our
 * accounts have been the right one, and is Awin recording the clicks we log.
 * The last one is what catches a link that redirects fine and pays nobody.
 */
async function cmdCheck() {
  const links = awinLinksInProducts();
  const accounts = (((await awin("/accounts")) as Json).accounts as Json[] | undefined ?? []).filter((a) => a.accountType === "publisher");
  const ours = new Map<number, Map<number, string>>();
  for (const a of accounts) ours.set(num(a.accountId), await joinedOn(num(a.accountId)));
  console.log(`${links.length} Awin links in products.ts. Our publisher accounts: ${[...ours].map(([id, j]) => `${id} (${j.size} joined)`).join(", ")}.\n`);

  let bad = 0;
  for (const l of links) {
    const problems: string[] = [];
    const joined = ours.get(l.publisherId);
    if (!joined) problems.push(`publisher ${l.publisherId} is not one of our accounts`);
    else if (!joined.has(l.advertiserId)) {
      const right = [...ours].find(([, j]) => j.has(l.advertiserId))?.[0];
      problems.push(right ? `account ${l.publisherId} has NOT joined this programme; account ${right} has. Clicks earn nothing until the link carries ${right}` : `none of our accounts has joined advertiser ${l.advertiserId}: clicks earn nothing`);
    }
    if (problems.length > 0) bad++;
    const name = [...ours.values()].map((j) => j.get(l.advertiserId)).find(Boolean) ?? "";
    console.log(`${problems.length ? "PROBLEM" : "ok     "} ${l.id.padEnd(26)} publisher ${l.publisherId}  advertiser ${l.advertiserId} ${name}${problems.length ? "\n         <- " + problems.join("; ") : ""}`);
  }

  // Is Awin seeing the clicks? Our log counts every click on a link, bots included,
  // so the numbers never match; what matters is Awin recording none at all.
  const DAYS = 14;
  const end = new Date();
  const start = new Date(end.getTime() - DAYS * 86_400_000);
  const logged = new Map<number, number>();
  for (const row of await clickLog(DAYS)) {
    const link = links.find((l) => l.id === row.product_slug);
    if (link) logged.set(link.advertiserId, (logged.get(link.advertiserId) ?? 0) + 1);
  }
  const seen = new Map<number, number>();
  for (const pub of new Set(links.map((l) => l.publisherId))) {
    if (!ours.has(pub)) continue;
    const data = await awin(`/publishers/${pub}/reports/advertiser?startDate=${start.toISOString().slice(0, 10)}&endDate=${end.toISOString().slice(0, 10)}&region=GB&timezone=UTC`);
    for (const r of Array.isArray(data) ? (data as Json[]) : []) seen.set(num(r.advertiserId), (seen.get(num(r.advertiserId)) ?? 0) + num(r.clicks));
  }
  console.log(`\nClicks in the last ${DAYS} days, our log against Awin's count:`);
  for (const [adv, n] of logged) {
    const awinClicks = seen.get(adv) ?? 0;
    const silent = n >= 20 && awinClicks === 0;
    if (silent) bad++;
    console.log(`${silent ? "PROBLEM" : "ok     "} advertiser ${adv}: we logged ${n}, Awin recorded ${awinClicks}${silent ? "  <- Awin is not recording these clicks" : ""}`);
  }
  console.log(bad === 0 ? "\nEvery Awin link carries an account that has joined its programme." : `\n${bad} problem(s) need fixing.`);
  process.exitCode = bad === 0 ? 0 : 2;
}

async function transactions(days: number): Promise<Json[]> {
  const all: Json[] = [];
  const end = new Date();
  for (let offset = 0; offset < days; offset += 31) {
    const to = new Date(end.getTime() - offset * 86_400_000);
    const from = new Date(to.getTime() - Math.min(31, days - offset) * 86_400_000);
    const data = await awin(
      `/publishers/${PUBLISHER_ID}/transactions/?startDate=${encodeURIComponent(isoNoZone(from))}&endDate=${encodeURIComponent(isoNoZone(to))}&timezone=UTC&dateType=transaction`,
    );
    if (Array.isArray(data)) all.push(...(data as Json[]));
  }
  return all;
}

async function clickLog(days: number): Promise<{ product_slug: string; partner: string }[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const sb = createClient(url, key);
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const rows: { product_slug: string; partner: string }[] = [];
  for (let o = 0; ; o += 1000) {
    const { data } = await sb.from("affiliate_clicks").select("product_slug, partner").eq("partner", "awin").gte("clicked_at", since).range(o, o + 999);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

async function cmdEarnings(days: number) {
  const [tx, clicks] = await Promise.all([transactions(days), clickLog(days)]);
  const byAdv = new Map<string, { n: number; sale: number; commission: number; status: Record<string, number> }>();
  for (const t of tx) {
    const name = String(pick(t, "advertiserName", "advertiserId") ?? "?");
    const e = byAdv.get(name) ?? { n: 0, sale: 0, commission: 0, status: {} };
    e.n++;
    e.sale += amount(pick(t, "saleAmount"));
    e.commission += amount(pick(t, "commissionAmount"));
    const st = String(pick(t, "commissionStatus", "status") ?? "?");
    e.status[st] = (e.status[st] ?? 0) + 1;
    byAdv.set(name, e);
  }
  console.log(`Awin transactions, last ${days} days, publisher ${PUBLISHER_ID}: ${tx.length}\n`);
  let total = 0;
  for (const [name, e] of [...byAdv].sort((a, b) => b[1].commission - a[1].commission)) {
    total += e.commission;
    console.log(`${name.padEnd(34)} ${String(e.n).padStart(4)} sales  £${e.sale.toFixed(2).padStart(9)} sold  £${e.commission.toFixed(2).padStart(8)} commission  ${JSON.stringify(e.status)}`);
  }
  console.log(`\nCommission in the period (all statuses): £${total.toFixed(2)}`);
  console.log(`Our click log, same period: ${clicks.length} Awin clicks.`);
  if (clicks.length > 0) {
    console.log(`Per click: £${(total / clicks.length).toFixed(3)}. Sales per 100 clicks: ${((tx.length / clicks.length) * 100).toFixed(1)}.`);
    const byProduct = new Map<string, number>();
    for (const c of clicks) byProduct.set(c.product_slug, (byProduct.get(c.product_slug) ?? 0) + 1);
    console.log("\nClicks by product:");
    for (const [slug, n] of [...byProduct].sort((a, b) => b[1] - a[1])) console.log(`  ${slug.padEnd(34)} ${n}`);
  }
  if (tx[0]) console.log(`\nFields returned per transaction: ${Object.keys(tx[0]).join(", ")}`);
  if (tx.length === 0 && clicks.length > 20) console.log("\nNo transactions against real clicks: check `awin.ts check` before anything else.");
}

async function cmdReport(days: number) {
  const end = new Date();
  const start = new Date(end.getTime() - Math.min(days, 365) * 86_400_000);
  const data = await awin(
    `/publishers/${PUBLISHER_ID}/reports/advertiser?startDate=${start.toISOString().slice(0, 10)}&endDate=${end.toISOString().slice(0, 10)}&region=GB&timezone=UTC`,
  );
  const rows = Array.isArray(data) ? (data as Json[]) : [];
  console.log(`Awin's own report, last ${days} days: ${rows.length} advertisers\n`);
  for (const r of rows.sort((a, b) => num(b.clicks) - num(a.clicks))) {
    console.log(
      `${String(r.advertiserName ?? r.advertiserId).padEnd(34)} clicks ${String(num(r.clicks)).padStart(5)}  sales ${String(num(pick(r, "totalNo", "confirmedNo"))).padStart(4)}  commission £${num(pick(r, "totalComm", "confirmedComm")).toFixed(2)}`,
    );
  }
  if (rows[0]) console.log(`\nFields returned: ${Object.keys(rows[0]).join(", ")}`);
}

async function cmdLink(advertiserId: number, destinationUrl: string) {
  const data = (await awin(`/publishers/${PUBLISHER_ID}/linkbuilder/generate`, {
    method: "POST",
    body: JSON.stringify({ advertiserId, destinationUrl }),
  })) as Json;
  console.log(data.url ?? data);
}

async function main() {
  const [cmd, a, b] = process.argv.slice(2);
  if (cmd === "programmes") return cmdProgrammes(a ?? "joined");
  if (cmd === "check") return cmdCheck();
  if (cmd === "earnings") return cmdEarnings(Number(a ?? 90));
  if (cmd === "report") return cmdReport(Number(a ?? 90));
  if (cmd === "link" && a && b) return cmdLink(Number(a), b);
  console.log("Usage: awin.ts programmes [relationship] | check | earnings [days] | report [days] | link <advertiserId> <url>");
}

// Only run when called directly, so tests can import awinLinksInProducts.
if (process.argv[1]?.endsWith("awin.ts")) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
