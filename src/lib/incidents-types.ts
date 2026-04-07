export type IncidentType =
  | "boil_notice"
  | "supply_interruption"
  | "pollution"
  | "enforcement"
  | "pfas_discovery"
  | "general";

export type IncidentSeverity = "critical" | "warning" | "info";

export type IncidentStatus = "active" | "resolved";

export type IncidentSource =
  | "water_company"
  | "environment_agency"
  | "dwi"
  | "news";

export interface Incident {
  id: string;
  slug: string;
  source_hash: string;
  title: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  source: IncidentSource;
  source_url: string | null;
  supplier_id: string | null;
  affected_postcodes: string[];
  affected_cities: string[];
  households_affected: number | null;
  summary: string;
  action_required: string | null;
  article_markdown: string;
  detected_at: string;
  resolved_at: string | null;
  last_checked: string;
  source_data: Record<string, unknown> | null;
  created_at: string;
}

export interface RawIncident {
  source_hash: string;
  type: IncidentType;
  severity: IncidentSeverity;
  source: IncidentSource;
  source_url: string;
  supplier_id: string | null;
  affected_postcodes: string[];
  affected_cities: string[];
  households_affected: number | null;
  action_required: string | null;
  source_data: Record<string, unknown>;
  raw_description: string;
}

export interface GeneratedArticle {
  title: string;
  slug: string;
  summary: string;
  article_markdown: string;
}

export interface SourceCheck {
  source: string;
  source_name: string;
  status_code: number | null;
  items_found: number;
  error: string | null;
}

export type IncidentLogAction =
  | "detected"
  | "updated"
  | "resolved"
  | "enriched"
  | "stale_alert";

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  boil_notice: "Boil Notice",
  supply_interruption: "Supply Interruption",
  pollution: "Pollution Incident",
  enforcement: "Enforcement Action",
  pfas_discovery: "PFAS Discovery",
  general: "Water Incident",
};

export const SEVERITY_CONFIG: Record<
  IncidentSeverity,
  { label: string; color: string; bgClass: string; textClass: string }
> = {
  critical: {
    label: "Critical",
    color: "#dc2626",
    bgClass: "bg-red-600",
    textClass: "text-red-600",
  },
  warning: {
    label: "Warning",
    color: "#d97706",
    bgClass: "bg-amber-600",
    textClass: "text-amber-600",
  },
  info: {
    label: "Info",
    color: "#2563eb",
    bgClass: "bg-blue-600",
    textClass: "text-blue-600",
  },
};
