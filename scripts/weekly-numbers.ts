/**
 * The Monday numbers. One command, one markdown block, saved to docs/numbers.
 *
 * Reads the first-party tables (affiliate clicks, softener leads, subscribers,
 * incidents, PFAS rows) and, when GSC_SERVICE_ACCOUNT_JSON is set, Search
 * Console clicks and the watch-list positions. Every number is per ISO week so
 * this week can be read against the same week last month.
 *
 * Usage:
 *   npx tsx scripts/weekly-numbers.ts          # prints and writes docs/numbers/week-<monday>.md
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";
import { config } from "dotenv";
import { pullGsc, type GscReport } from "./gsc-weekly";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const WEEKS = 8;

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monday(d: Date): Date {
  const m = new Date(d);
  m.setUTCHours(0, 0, 0, 0);
  m.setUTCDate(m.getUTCDate() - ((m.getUTCDay() + 6) % 7));
  return m;
}

function weekOf(ts: string): string {
  return iso(monday(new Date(ts)));
}

async function all<T>(table: string, select: string, tsCol: string, since: string): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .gte(tsCol, since)
      .order(tsCol, { ascending: true })
      .range(offset, offset + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

interface Click { clicked_at: string; partner: string; page: string; product_slug: string }
interface Lead { created_at: string; status: string; postcode_district: string; forwarded_at: string | null }
interface Sub { created_at: string }

async function main() {
  const now = new Date();
  const thisMonday = monday(now);
  const since = new Date(thisMonday);
  since.setUTCDate(since.getUTCDate() - 7 * (WEEKS - 1));
  const sinceIso = since.toISOString();

  const [clicks, leads, subs] = await Promise.all([
    all<Click>("affiliate_clicks", "clicked_at,partner,page,product_slug", "clicked_at", sinceIso),
    all<Lead>("softener_leads", "created_at,status,postcode_district,forwarded_at", "created_at", "2000-01-01"),
    all<Sub>("subscribers", "created_at", "created_at", "2000-01-01"),
  ]);
  const { count: activeIncidents } = await supabase.from("incidents").select("*", { count: "exact", head: true }).eq("status", "active");
  const { count: pfasRows } = await supabase.from("pfas_detections").select("*", { count: "exact", head: true });

  // Week keys, oldest first, ending with the current (partial) week.
  const weekKeys: string[] = [];
  for (let i = WEEKS - 1; i >= 0; i--) {
    const d = new Date(thisMonday);
    d.setUTCDate(d.getUTCDate() - 7 * i);
    weekKeys.push(iso(d));
  }

  const clicksByWeek = new Map<string, { total: number; amazon: number; awin: number; osmio: number; other: number }>();
  const pageTotals = new Map<string, number>();
  const productTotals = new Map<string, number>();
  for (const c of clicks) {
    const w = weekOf(c.clicked_at);
    const cur = clicksByWeek.get(w) ?? { total: 0, amazon: 0, awin: 0, osmio: 0, other: 0 };
    cur.total++;
    if (c.partner === "amazon") cur.amazon++;
    else if (c.partner === "awin") cur.awin++;
    else if (c.partner === "osmio") cur.osmio++;
    else cur.other++;
    clicksByWeek.set(w, cur);
    if (w === weekKeys[WEEKS - 2]) {
      pageTotals.set(c.page, (pageTotals.get(c.page) ?? 0) + 1);
      productTotals.set(c.product_slug, (productTotals.get(c.product_slug) ?? 0) + 1);
    }
  }
  const leadsByWeek = new Map<string, number>();
  for (const l of leads) leadsByWeek.set(weekOf(l.created_at), (leadsByWeek.get(weekOf(l.created_at)) ?? 0) + 1);
  const subsByWeek = new Map<string, number>();
  for (const s of subs) subsByWeek.set(weekOf(s.created_at), (subsByWeek.get(weekOf(s.created_at)) ?? 0) + 1);

  let gsc: GscReport | null = null;
  let gscNote = "";
  if (process.env.GSC_SERVICE_ACCOUNT_JSON) {
    try {
      gsc = await pullGsc();
    } catch (err) {
      gscNote = `Search Console: ${err instanceof Error ? err.message : String(err)}`;
    }
  } else {
    gscNote = "Search Console: not connected (GSC_SERVICE_ACCOUNT_JSON unset).";
  }
  const gscByWeek = new Map(gsc?.weeks.map((w) => [w.week, w]) ?? []);

  const lastFull = weekKeys[WEEKS - 2];
  const waiting = leads.filter((l) => l.status === "new" && !l.forwarded_at).length;

  const lines: string[] = [];
  lines.push(`# Monday numbers, ${iso(now)}`);
  lines.push("");
  lines.push(`Last full week: w/c ${lastFull}. Current week is partial.`);
  lines.push("");
  lines.push("| week | GSC clicks | impressions | avg pos | affiliate clicks | amazon | awin | osmio | leads | subs |");
  lines.push("|---|---|---|---|---|---|---|---|---|---|");
  for (const w of weekKeys) {
    const c = clicksByWeek.get(w) ?? { total: 0, amazon: 0, awin: 0, osmio: 0, other: 0 };
    const g = gscByWeek.get(w);
    const partial = w === weekKeys[WEEKS - 1] ? " (partial)" : "";
    lines.push(
      `| ${w}${partial} | ${g ? g.clicks : "–"} | ${g ? g.impressions.toLocaleString("en-GB") : "–"} | ${g ? g.position : "–"} | ${c.total} | ${c.amazon} | ${c.awin} | ${c.osmio} | ${leadsByWeek.get(w) ?? 0} | ${subsByWeek.get(w) ?? 0} |`,
    );
  }
  lines.push("");
  lines.push(`Softener leads waiting (status new, never forwarded): **${waiting}** of ${leads.length} total.`);
  lines.push(`Subscribers: ${subs.length}. Active incidents: ${activeIncidents ?? "?"}. PFAS rows: ${pfasRows?.toLocaleString("en-GB") ?? "?"}.`);
  if (gscNote) lines.push(gscNote);
  lines.push("");
  lines.push(`## Where last week's clicks came from (w/c ${lastFull})`);
  lines.push("");
  const top = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  lines.push("| page | clicks |  | product | clicks |");
  lines.push("|---|---|---|---|---|");
  const tp = top(pageTotals);
  const tpr = top(productTotals);
  for (let i = 0; i < Math.max(tp.length, tpr.length); i++) {
    lines.push(`| ${tp[i]?.[0] ?? ""} | ${tp[i]?.[1] ?? ""} |  | ${tpr[i]?.[0] ?? ""} | ${tpr[i]?.[1] ?? ""} |`);
  }
  if (gsc) {
    lines.push("");
    lines.push("## Watch list, last 28 days (Search Console)");
    lines.push("");
    lines.push("| page | clicks | impressions | position |");
    lines.push("|---|---|---|---|");
    for (const p of gsc.watch) lines.push(`| ${p.page} | ${p.clicks} | ${p.impressions.toLocaleString("en-GB")} | ${p.position || "–"} |`);
  }

  const out = lines.join("\n") + "\n";
  mkdirSync("docs/numbers", { recursive: true });
  const file = `docs/numbers/week-${iso(thisMonday)}.md`;
  writeFileSync(file, out);
  console.log(out);
  console.log(`written ${file}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
