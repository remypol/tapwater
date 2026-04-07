export interface ContaminantReading {
  name: string;
  value: number;
  unit: string;
  ukLimit: number | null;
  whoGuideline: number | null;
  status: "pass" | "warning" | "fail";
  isPfas?: boolean;
  source?: "drinking" | "environmental";
  belowDetectionLimit?: boolean;
}

export interface PostcodeData {
  district: string;
  areaName: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  supplier: string;
  supplierId: string;
  supplyZone: string;
  safetyScore: number;
  scoreGrade: "excellent" | "good" | "fair" | "poor" | "very-poor" | "insufficient-data";
  contaminantsTested: number;
  contaminantsFlagged: number;
  pfasDetected: boolean;
  pfasLevel: number | null;
  pfasSource: "environmental" | "drinking" | null;
  lastUpdated: string;
  lastSampleDate: string;
  readings: ContaminantReading[];
  nearbyPostcodes: string[];
  dataSource: "stream" | "ea-only" | "mixed";
  drinkingWaterReadings: ContaminantReading[];
  environmentalReadings: ContaminantReading[];
  sampleCount: number;
  dateRange: { from: string; to: string } | null;
}

export type ProductCategory =
  | "jug"
  | "under_sink"
  | "reverse_osmosis"
  | "whole_house"
  | "shower"
  | "testing_kit"
  | "countertop"
  | "water_softener";

export type PriceTier = "budget" | "mid" | "premium";

export type AffiliateProgram = "amazon" | "impact" | "direct";

export interface FilterProduct {
  id: string;
  brand: string;
  model: string;
  slug: string;
  category: ProductCategory;
  removes: string[];
  certifications: string[];
  priceGbp: number;
  priceTier: PriceTier;
  affiliateUrl: string;
  affiliateProgram: AffiliateProgram;
  affiliateTag: string;
  imageUrl: string;
  rating: number;
  badge: "best-match" | "budget" | "premium" | "best-value";
  pros: string[];
  cons: string[];
  bestFor: string;
  flowRate?: string;
  filterLife?: string;
  annualCost?: number;
  availableInUk?: boolean; // undefined or true = available. false = not yet available in UK market.
}

export interface SupplierData {
  id: string;
  name: string;
  region: string;
  customersM: number;
  complianceRate: number;
  website: string;
  postcodeAreas: string[];
}

export type ScoreColor = "safe" | "warning" | "danger";

export function getScoreColor(score: number): ScoreColor {
  if (score >= 7) return "safe";
  if (score >= 4) return "warning";
  return "danger";
}

export function getScoreGrade(score: number): string {
  if (score >= 9) return "Excellent";
  if (score >= 7) return "Good";
  if (score >= 5) return "Fair";
  if (score >= 3) return "Poor";
  return "Very Poor";
}

export function getStatusColor(reading: ContaminantReading): ScoreColor {
  if (reading.status === "pass") return "safe";
  if (reading.status === "warning") return "warning";
  return "danger";
}

export function getPercentOfLimit(reading: ContaminantReading): number {
  const limit = reading.ukLimit ?? reading.whoGuideline;
  if (!limit || limit === 0) return 0;
  return Math.min((reading.value / limit) * 100, 100);
}

export type EmailSequenceStep = 0 | 3 | 7 | 14 | 30;

export interface SubscriberSequenceState {
  email: string;
  postcodeDistrict: string;
  waterDataSnapshot: {
    safetyScore: number;
    scoreGrade: string;
    contaminantsFlagged: number;
    topConcerns: string[];
    pfasDetected: boolean;
  };
  subscribedAt: string;
  lastEmailSent: EmailSequenceStep | null;
  lastEmailSentAt: string | null;
}
