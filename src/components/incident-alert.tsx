import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { Incident } from "@/lib/incidents-types";
import { INCIDENT_TYPE_LABELS, SEVERITY_CONFIG } from "@/lib/incidents-types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function IncidentAlert({ incident }: { incident: Incident }) {
  const config = SEVERITY_CONFIG[incident.severity];

  return (
    <div
      className="rounded-lg border p-4 mb-6"
      style={{
        backgroundColor: "color-mix(in srgb, var(--color-surface) 85%, #dc2626)",
        borderColor: "color-mix(in srgb, var(--color-rule) 60%, #dc2626)",
      }}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: config.color }}
        >
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold" style={{ color: config.color }}>
              Active {INCIDENT_TYPE_LABELS[incident.type]}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-white"
              style={{ backgroundColor: config.color }}
            >
              Live
            </span>
          </div>
          <p className="text-sm text-body mt-1 line-clamp-2">
            {incident.action_required ?? incident.summary}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Link
              href={`/news/${incident.slug}`}
              className="text-xs font-semibold text-accent hover:underline"
            >
              Full details &rarr;
            </Link>
            <span className="text-xs text-faint">
              Updated {timeAgo(incident.last_checked)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function IncidentAlerts({ incidents }: { incidents: Incident[] }) {
  if (incidents.length === 0) return null;
  return (
    <>
      {incidents.map((incident) => (
        <IncidentAlert key={incident.id} incident={incident} />
      ))}
    </>
  );
}
