export interface ContaminantReading {
  name: string;
  value: number;
  unit: string;
  ukLimit: number | null;
  whoGuideline: number | null;
  status: "pass" | "warning" | "fail";
  isPfas?: boolean;
}

export interface PostcodeData {
  district: string;
  areaName: string;
  city: string;
  region: string;
  supplier: string;
  supplierId: string;
  supplyZone: string;
  safetyScore: number;
  scoreGrade: "excellent" | "good" | "fair" | "poor" | "very-poor";
  contaminantsTested: number;
  contaminantsFlagged: number;
  pfasDetected: boolean;
  pfasLevel: number | null;
  pfasSource: "environmental" | "drinking" | null;
  lastUpdated: string;
  lastSampleDate: string;
  readings: ContaminantReading[];
  nearbyPostcodes: string[];
  historicalScores: { year: number; score: number }[];
}

export interface FilterProduct {
  id: string;
  brand: string;
  model: string;
  category: "jug" | "under_sink" | "whole_house" | "countertop";
  removes: string[];
  certifications: string[];
  priceGbp: number;
  affiliateUrl: string;
  imageUrl: string;
  rating: number;
  badge: "best-match" | "budget" | "whole-house";
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
