/**
 * Water company → Stream Water Data Portal ArcGIS service registry.
 *
 * Most companies publish to the shared Stream org (XxS6FebPX29TRGDJ).
 * Yorkshire Water uses its own org (1WqkK5cDKUbF0CkH).
 *
 * Field schemas vary between companies:
 * - Yorkshire Water: UPPER_CASE fields, epoch ms dates
 * - Most others: CamelCase fields, string dates ("1/2/2024 12:00:00 AM")
 */

export interface StreamService {
  year: number;
  serviceName: string;
}

export interface StreamSource {
  orgId: string;
  services: StreamService[];
  geoField: string;
  fieldCase: "upper" | "camel";
  dateFormat: "epoch" | "string";
}

const STREAM_ORG = "XxS6FebPX29TRGDJ";

const STREAM_SOURCES: Record<string, StreamSource> = {
  "yorkshire-water": {
    orgId: "1WqkK5cDKUbF0CkH",
    services: [
      { year: 2026, serviceName: "Yorkshire Water Drinking Water Quality 2026" },
      { year: 2025, serviceName: "Yorkshire Water Drinking Water Quality 2025" },
      { year: 2024, serviceName: "Yorkshire Water Drinking Water Quality 2024" },
    ],
    geoField: "LSOA",
    fieldCase: "upper",
    dateFormat: "epoch",
  },
  "severn-trent": {
    orgId: STREAM_ORG,
    services: [
      { year: 2024, serviceName: "Severn_Trent_Water_Domestic_Water_Quality_2024" },
      { year: 2023, serviceName: "Severn_Trent_Water_Domestic_Water_Quality_2023" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
  },
  "southern-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2025, serviceName: "Southern_Water_Domestic_Drinking_Water_Quality_2025" },
      { year: 2024, serviceName: "Southern_Water_Domestic_Drinking_Water_Quality_2024" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
  },
  "united-utilities": {
    orgId: STREAM_ORG,
    services: [
      { year: 2025, serviceName: "United_Utilities_Domestic_Water_Quality" },
      { year: 2023, serviceName: "United_Utilities_Domestic_Drinking_Water_Quality_2023" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
  },
  "anglian-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2025, serviceName: "Anglian_Water_Domestic_Water_Quality" },
      { year: 2024, serviceName: "Anglian_Water_Domestic_Water_Quality_2024" },
    ],
    geoField: "LSOA21CD",
    fieldCase: "camel",
    dateFormat: "epoch",
  },
  "south-west-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2024, serviceName: "South_West_Water_(SWB)_Drinking_Water_Quality_2024" },
      { year: 2023, serviceName: "South_West_Water_(SWB)_Drinking_Water_Quality_2023" },
    ],
    geoField: "LSOA_Name",
    fieldCase: "upper",
    dateFormat: "epoch",
  },
  "portsmouth-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2024, serviceName: "Portsmouth_Water_Drinking_Water_Quality_Data_2022_2023_2024" },
    ],
    geoField: "LSOA",
    fieldCase: "upper",
    dateFormat: "epoch",
  },
  "welsh-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2024, serviceName: "Dwr_Cymru_Welsh_Water_Drinking_Water_Quality_2024" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
  },
  "northumbrian-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2024, serviceName: "Northumbrian_Water_Domestic_Water_Quality" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
  },
  // ── Companies added from Stream portal discovery ──
  "affinity-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2024, serviceName: "Affinity_Water_Domestic_Water_Quality" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
  },
  // south-east-water: NOT on Stream portal. Do not confuse with SES Water.
  "ses-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2025, serviceName: "SES_Water_Water_Quality_250515" },
    ],
    geoField: "lsoa21cd",
    fieldCase: "camel",
    dateFormat: "epoch",
  },
  "south-staffs-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2024, serviceName: "South_Staffs_Domestic_Water_Quality" },
    ],
    geoField: "LSOA",
    fieldCase: "upper",
    dateFormat: "string",
  },
  "cambridge-water": {
    orgId: STREAM_ORG,
    services: [
      { year: 2024, serviceName: "CAM_DomesticWaterQuality" },
    ],
    geoField: "LSOA",
    fieldCase: "upper",
    dateFormat: "string",
  },
  "hafren-dyfrdwy": {
    orgId: STREAM_ORG,
    services: [
      { year: 2024, serviceName: "Hafren_Dyfrdwy_Domestic_Water_Quality_2024" },
      { year: 2023, serviceName: "Hafren_Dyfrdwy_Domestic_Water_Quality_2023" },
      { year: 2022, serviceName: "Hafren_Dyfrdwy_Domestic_Water_Quality" },
    ],
    geoField: "LSOA",
    fieldCase: "camel",
    dateFormat: "string",
  },
};

export function getStreamSource(supplierId: string): StreamSource | null {
  return STREAM_SOURCES[supplierId] ?? null;
}

export function getAllStreamSupplierIds(): string[] {
  return Object.keys(STREAM_SOURCES);
}
