import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DataSourceBreakdown {
  source: string;
  count: number;
}

export interface SupplierCoverage {
  supplier_id: string;
  count: number;
}

export interface PipelineRunSummary {
  id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  processed_postcodes: number | null;
  total_postcodes: number;
  error_message: string | null;
  ageHours: number | null;
}

export interface SourceCheckSummary {
  source_name: string;
  last_checked_at: string | null;
  last_error: string | null;
  is_failing: boolean;
}

export interface HealthReport {
  generatedAt: string;
  pageData: {
    totalRows: number;
    byDataSource: DataSourceBreakdown[];
    insufficientDataCount: number;
    nullLastDataUpdateCount: number;
    staleCount: number; // last_data_update > 1 year old
  };
  pipeline: {
    latestRun: PipelineRunSummary | null;
  };
  incidentSources: {
    checks: SourceCheckSummary[];
    failingCount: number;
  };
  supplierCoverage: SupplierCoverage[];
  issues: string[];
}

// ── Health report ─────────────────────────────────────────────────────────────

export async function getHealthReport(): Promise<HealthReport> {
  const db = getSupabase();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearAgoIso = oneYearAgo.toISOString();

  const [
    allPageData,
    insufficientData,
    nullUpdateData,
    staleData,
    latestRunData,
    sourceChecksData,
    supplierData,
  ] = await Promise.all([
    // All page_data rows with data_source for breakdown
    db.from("page_data").select("data_source"),

    // safety_score = -1 (insufficient data)
    db
      .from("page_data")
      .select("postcode_district", { count: "exact", head: true })
      .eq("safety_score", -1),

    // null last_data_update
    db
      .from("page_data")
      .select("postcode_district", { count: "exact", head: true })
      .is("last_data_update", null),

    // last_data_update older than 1 year
    db
      .from("page_data")
      .select("postcode_district", { count: "exact", head: true })
      .lt("last_data_update", oneYearAgoIso),

    // Latest pipeline run
    db
      .from("pipeline_runs")
      .select("id, status, started_at, completed_at, processed_postcodes, total_postcodes, error_message")
      .order("started_at", { ascending: false })
      .limit(1),

    // Latest source_check per source_name
    db
      .from("source_checks")
      .select("source_name, error, checked_at")
      .order("checked_at", { ascending: false })
      .limit(100),

    // Supplier coverage from postcode_districts
    db
      .from("postcode_districts")
      .select("supplier_id"),
  ]);

  // Build data_source breakdown
  const sourceCounts: Record<string, number> = {};
  let totalRows = 0;
  for (const row of allPageData.data ?? []) {
    const src = row.data_source ?? "unknown";
    sourceCounts[src] = (sourceCounts[src] ?? 0) + 1;
    totalRows++;
  }
  const byDataSource: DataSourceBreakdown[] = Object.entries(sourceCounts).map(
    ([source, count]) => ({ source, count }),
  );

  // Build supplier coverage breakdown
  const supplierCounts: Record<string, number> = {};
  for (const row of supplierData.data ?? []) {
    const sid = row.supplier_id ?? "unknown";
    supplierCounts[sid] = (supplierCounts[sid] ?? 0) + 1;
  }
  const supplierCoverage: SupplierCoverage[] = Object.entries(supplierCounts).map(
    ([supplier_id, count]) => ({ supplier_id, count }),
  );

  // Build latest source_check per source_name (deduplicated)
  const seenSources = new Map<string, SourceCheckSummary>();
  for (const row of sourceChecksData.data ?? []) {
    if (!seenSources.has(row.source_name)) {
      seenSources.set(row.source_name, {
        source_name: row.source_name,
        last_checked_at: row.checked_at ?? null,
        last_error: row.error ?? null,
        is_failing: row.error != null,
      });
    }
  }
  const checks = Array.from(seenSources.values());
  const failingCount = checks.filter((c) => c.is_failing).length;

  // Build pipeline summary
  let latestRun: PipelineRunSummary | null = null;
  const runRow = latestRunData.data?.[0];
  if (runRow) {
    const ageHours = runRow.started_at
      ? (Date.now() - new Date(runRow.started_at).getTime()) / (1000 * 60 * 60)
      : null;
    latestRun = {
      id: runRow.id,
      status: runRow.status,
      started_at: runRow.started_at,
      completed_at: runRow.completed_at,
      processed_postcodes: runRow.processed_postcodes,
      total_postcodes: runRow.total_postcodes,
      error_message: runRow.error_message,
      ageHours: ageHours !== null ? Math.round(ageHours * 10) / 10 : null,
    };
  }

  // Collect issues
  const issues: string[] = [];

  if (latestRun) {
    if (latestRun.status === "failed") {
      issues.push(
        `Pipeline run ${latestRun.id} has status "failed"${latestRun.error_message ? `: ${latestRun.error_message}` : ""}`,
      );
    }
    if (latestRun.ageHours !== null && latestRun.ageHours > 96) {
      issues.push(
        `Pipeline last started ${latestRun.ageHours}h ago — may be stalled`,
      );
    }
  } else {
    issues.push("No pipeline runs found in database");
  }

  const staleCount = staleData.count ?? 0;
  if (staleCount > 50) {
    issues.push(`${staleCount} districts have data older than 1 year`);
  }

  const nullCount = nullUpdateData.count ?? 0;
  if (nullCount > 100) {
    issues.push(`${nullCount} districts have null last_data_update`);
  }

  if (failingCount > 5) {
    issues.push(`${failingCount} incident feed sources are failing`);
  }

  return {
    generatedAt: new Date().toISOString(),
    pageData: {
      totalRows,
      byDataSource,
      insufficientDataCount: insufficientData.count ?? 0,
      nullLastDataUpdateCount: nullCount,
      staleCount,
    },
    pipeline: { latestRun },
    incidentSources: { checks, failingCount },
    supplierCoverage,
    issues,
  };
}

// ── Health alert ──────────────────────────────────────────────────────────────

export async function sendHealthAlert(report: HealthReport): Promise<void> {
  if (report.issues.length === 0) return;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[pipeline-health] RESEND_API_KEY not set — skipping alert email");
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? "remy@tapwater.uk";
  const resend = new Resend(apiKey);

  const issueList = report.issues.map((i) => `<li>${i}</li>`).join("\n");
  const html = `
<h2>TapWater Pipeline Health Alert</h2>
<p>The weekly health check found ${report.issues.length} issue(s) at ${report.generatedAt}:</p>
<ul>
${issueList}
</ul>
<hr>
<h3>Summary</h3>
<p><strong>Page data:</strong> ${report.pageData.totalRows} total rows,
  ${report.pageData.insufficientDataCount} with insufficient data,
  ${report.pageData.staleCount} stale (&gt;1 year old),
  ${report.pageData.nullLastDataUpdateCount} missing last_data_update.</p>
<p><strong>Pipeline:</strong> ${
    report.pipeline.latestRun
      ? `Last run status: ${report.pipeline.latestRun.status}, started ${report.pipeline.latestRun.ageHours}h ago`
      : "No pipeline runs found"
  }</p>
<p><strong>Incident feeds:</strong> ${report.incidentSources.failingCount} failing out of ${report.incidentSources.checks.length} sources.</p>
`.trim();

  try {
    await resend.emails.send({
      from: "TapWater Pipeline <alerts@tapwater.uk>",
      to: adminEmail,
      subject: `[TapWater] Pipeline health: ${report.issues.length} issue(s) detected`,
      html,
    });
    console.log(`[pipeline-health] Alert sent to ${adminEmail}`);
  } catch (err) {
    console.error("[pipeline-health] Failed to send health alert email:", err);
  }
}
