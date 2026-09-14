/**
 * Pull Search Console numbers for the Monday report.
 *
 * Two ways to authenticate, no Google SDK either way:
 *
 *   GSC_OAUTH_JSON            base64 of a gcloud application-default credentials
 *                             file (client_id, client_secret, refresh_token). Made
 *                             with `gcloud auth application-default login
 *                             --scopes=.../webmasters.readonly`. Reads Search
 *                             Console as that person. Used because the
 *                             cc-community.com organisation forbids service
 *                             account keys.
 *   GSC_SERVICE_ACCOUNT_JSON  base64 of a service-account key file, for a Google
 *                             account without that restriction. The account must
 *                             be added to the property as a Restricted user.
 *
 *   GSC_SITE_URL              "sc-domain:tapwater.uk" (or "https://www.tapwater.uk/")
 *
 * Usage:
 *   npx tsx scripts/gsc-weekly.ts            # prints, and writes docs/numbers/gsc-<date>.json
 */
import { createSign } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const SITE = process.env.GSC_SITE_URL ?? "sc-domain:tapwater.uk";

/** Pages whose position we track weekly. Add to this list, never reorder. */
export const WATCH_PAGES = [
  "/",
  "/compare",
  "/hardness",
  "/guides/water-hardness-map",
  "/guides/best-shower-filter-uk",
  "/guides/best-water-filter-jug-uk",
  "/guides/best-under-sink-water-filter-uk",
  "/guides/best-whole-house-water-filter-uk",
  "/guides/best-water-softener-uk",
  "/guides/water-softener-cost-uk",
  "/guides/best-water-filter-pfas",
  "/guides/best-water-testing-kit-uk",
  "/pfas",
];

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

interface OAuthCredentials {
  client_id: string;
  client_secret: string;
  refresh_token: string;
  /** gcloud writes this; personal credentials must name a project to bill quota to. */
  quota_project_id?: string;
}

/** Sent as x-goog-user-project; required with personal credentials, harmless otherwise. */
let quotaProject: string | undefined = process.env.GSC_QUOTA_PROJECT;

function decodeJson<T>(raw: string): T {
  const json = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  return JSON.parse(json) as T;
}

/** True when either credential is configured. Lets the Monday report skip cleanly. */
export function gscConfigured(): boolean {
  return Boolean(process.env.GSC_OAUTH_JSON || process.env.GSC_SERVICE_ACCOUNT_JSON);
}

async function refreshTokenAccess(creds: OAuthCredentials): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      refresh_token: creds.refresh_token,
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { access_token: string };
  return body.access_token;
}

async function getAccessToken(): Promise<string> {
  if (process.env.GSC_OAUTH_JSON) {
    const creds = decodeJson<OAuthCredentials>(process.env.GSC_OAUTH_JSON);
    quotaProject ??= creds.quota_project_id;
    return refreshTokenAccess(creds);
  }
  if (process.env.GSC_SERVICE_ACCOUNT_JSON) {
    return accessToken(decodeJson<ServiceAccount>(process.env.GSC_SERVICE_ACCOUNT_JSON));
  }
  throw new Error("Neither GSC_OAUTH_JSON nor GSC_SERVICE_ACCOUNT_JSON is set. See docs/business/phase-0-checklist.md.");
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function accessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: sa.token_uri ?? "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = base64url(signer.sign(sa.private_key));
  const assertion = `${header}.${claims}.${signature}`;

  const res = await fetch(sa.token_uri ?? "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { access_token: string };
  return body.access_token;
}

interface Row {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

async function query(
  token: string,
  body: Record<string, unknown>,
): Promise<Row[]> {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(quotaProject ? { "x-goog-user-project": quotaProject } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Search Console query failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { rows?: Row[] };
  return json.rows ?? [];
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Monday of the ISO week containing `d`, as YYYY-MM-DD. */
function weekOf(dateStr: string): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return iso(d);
}

export interface WeekRow {
  week: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface PageRow {
  page: string;
  clicks: number;
  impressions: number;
  position: number;
}

export interface GscReport {
  site: string;
  pulledAt: string;
  /** Last 12 full weeks, oldest first. Search Console lags 2-3 days. */
  weeks: WeekRow[];
  /** Watch-list pages over the last 28 days. */
  watch: PageRow[];
  /** Top 20 pages by clicks over the last 28 days. */
  topPages: PageRow[];
}

export async function pullGsc(): Promise<GscReport> {
  const token = await getAccessToken();

  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 3); // GSC data lags
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 12 * 7);

  const daily = await query(token, {
    startDate: iso(start),
    endDate: iso(end),
    dimensions: ["date"],
    rowLimit: 200,
  });
  const byWeek = new Map<string, WeekRow & { posSum: number; n: number }>();
  for (const r of daily) {
    const w = weekOf(r.keys[0]);
    const cur = byWeek.get(w) ?? { week: w, clicks: 0, impressions: 0, ctr: 0, position: 0, posSum: 0, n: 0 };
    cur.clicks += r.clicks;
    cur.impressions += r.impressions;
    cur.posSum += r.position * r.impressions;
    cur.n += r.impressions;
    byWeek.set(w, cur);
  }
  const weeks = [...byWeek.values()]
    .sort((a, b) => a.week.localeCompare(b.week))
    .map((w) => ({
      week: w.week,
      clicks: w.clicks,
      impressions: w.impressions,
      ctr: w.impressions ? Math.round((w.clicks / w.impressions) * 1000) / 10 : 0,
      position: w.n ? Math.round((w.posSum / w.n) * 10) / 10 : 0,
    }));

  const start28 = new Date(end);
  start28.setUTCDate(start28.getUTCDate() - 27);
  const pages = await query(token, {
    startDate: iso(start28),
    endDate: iso(end),
    dimensions: ["page"],
    // Sorted by clicks; a watch page with impressions but no clicks sits far
    // down the list, so pull enough rows to reach it.
    rowLimit: 5000,
  });
  const toPage = (r: Row): PageRow => ({
    page: r.keys[0].replace(/^https?:\/\/(www\.)?tapwater\.uk/, "") || "/",
    clicks: r.clicks,
    impressions: r.impressions,
    position: Math.round(r.position * 10) / 10,
  });
  const all = pages.map(toPage);
  const watch = WATCH_PAGES.map(
    (p) => all.find((r) => r.page === p) ?? { page: p, clicks: 0, impressions: 0, position: 0 },
  );
  const topPages = [...all].sort((a, b) => b.clicks - a.clicks).slice(0, 20);

  return { site: SITE, pulledAt: new Date().toISOString(), weeks, watch, topPages };
}

async function main() {
  const report = await pullGsc();
  mkdirSync("docs/numbers", { recursive: true });
  const file = `docs/numbers/gsc-${iso(new Date())}.json`;
  writeFileSync(file, JSON.stringify(report, null, 2));

  console.log(`Search Console for ${report.site}\n`);
  console.log("week        clicks  impressions  ctr%  position");
  for (const w of report.weeks) {
    console.log(
      `${w.week}  ${String(w.clicks).padStart(6)}  ${String(w.impressions).padStart(11)}  ${String(w.ctr).padStart(4)}  ${String(w.position).padStart(8)}`,
    );
  }
  console.log("\nwatch list, last 28 days");
  for (const p of report.watch) {
    console.log(`${p.page.padEnd(44)} ${String(p.clicks).padStart(5)} clicks  ${String(p.impressions).padStart(7)} impr  pos ${p.position}`);
  }
  console.log(`\nwritten ${file}`);
}

if (process.argv[1]?.endsWith("gsc-weekly.ts")) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
