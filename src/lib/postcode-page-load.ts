/**
 * Everything the postcode page needs, loaded once. All reads hit the process-level
 * caches in data.ts, pfas-data.ts and river-status-data.ts, so calling this from both
 * generateMetadata and the page costs one load.
 */

import {
  getHardness,
  getNationalAverageScore,
  getPostcodeData,
  getPostcodesByCity,
} from "./data";
import type { PostcodeData } from "./types";
import { CITIES } from "./cities";
import { districtHighlights, type Highlight } from "./district-highlights";
import { recommendFilters, HARD_WATER_THRESHOLD } from "./filters";
import { getPfasNearDistrict, type PfasNearbySummary } from "./pfas-data";
import { getNationalRivers, getRiverForDistrict, type DistrictRiver } from "./river-status-data";
import { describeRiverStatus, waterBodyNoun, type RiverStatusSummary } from "./river-status";
import { getActiveIncidentsForPostcode } from "./incidents";
import { buildTankPlan, type RecommendedProduct, type TankPlan } from "./tank-plan";

export interface PostcodeNeighbour {
  district: string;
  score: number;
  hardness: number | null;
}

export interface PostcodePageLoad {
  data: PostcodeData;
  hasData: boolean;
  city: { name: string; slug: string; hasPage: boolean };
  hardness: Awaited<ReturnType<typeof getHardness>>;
  nationalAverage: number;
  recommendations: RecommendedProduct[];
  plan: TankPlan;
  pfasNearby: PfasNearbySummary | null;
  river: DistrictRiver | null;
  england: RiverStatusSummary | null;
  neighbours: PostcodeNeighbour[];
  highlights: Highlight[];
  faqs: { question: string; answer: string }[];
  incidents: Awaited<ReturnType<typeof getActiveIncidentsForPostcode>>;
}

/** The city page this district belongs to, for breadcrumbs and city-wide comparisons. */
export function resolveCity(data: PostcodeData): { name: string; slug: string; hasPage: boolean } {
  const match = CITIES.find(
    (c) =>
      c.matches.some((m) => m.toLowerCase() === data.city.toLowerCase()) ||
      c.name.toLowerCase() === data.city.toLowerCase(),
  );
  return {
    name: match?.name ?? data.city,
    slug: match?.slug ?? data.city.toLowerCase().replace(/\s+/g, "-"),
    hasPage: match !== undefined,
  };
}

export async function loadPostcodePage(district: string): Promise<PostcodePageLoad | null> {
  const data = await getPostcodeData(district);
  if (!data) return null;
  const hasData = data.safetyScore >= 0;
  const city = resolveCity(data);

  const [hardness, nationalAverage, pfasNearby, localRiver, nationalRivers, incidents, nearby, cityPeers] = await Promise.all([
    getHardness(data.district),
    getNationalAverageScore(),
    hasData ? getPfasNearDistrict(data.district) : Promise.resolve(null),
    getRiverForDistrict(data.district),
    getNationalRivers(),
    getActiveIncidentsForPostcode(data.district),
    Promise.all(data.nearbyPostcodes.map((pc) => getPostcodeData(pc))),
    getPostcodesByCity(data.city),
  ]);

  const scoredNearby = nearby.filter((n): n is PostcodeData => n !== null && n.safetyScore >= 0);
  const neighbourHardness = await Promise.all(scoredNearby.map((n) => getHardness(n.district)));
  const neighbours: PostcodeNeighbour[] = scoredNearby.map((n, i) => ({
    district: n.district,
    score: n.safetyScore,
    hardness: neighbourHardness[i]?.value ?? null,
  }));

  const flaggedNames = data.readings.filter((r) => r.status !== "pass").map((r) => r.name);
  const hardnessValue = hardness?.value ?? null;
  const hardnessLabel = hardness?.label ?? null;
  const hardnessEstimated = hardness?.estimated ?? false;
  const hardnessArea = hardness?.estimatedFrom ?? null;

  // On this page hard water is answered by the softener quote, which leads whenever the
  // district is hard. The product slots beside it should answer drinking water, not scale:
  // with the hardness passed in, the recommender ranked two £500 reverse osmosis units next
  // to the quote, and 173 Osmio clicks in 60 days produced no orders. Hardness is only
  // passed when nothing is flagged AND the water is not hard enough for a softener, so a
  // moderately hard district still gets a filter that touches scale.
  const softenerLeads = (hardnessValue ?? 0) >= HARD_WATER_THRESHOLD;
  const recommendations = hasData
    ? recommendFilters(flaggedNames, 3, softenerLeads ? {} : { hardnessValue })
    : [];

  const scoredCount = data.readings.filter((r) => (r.ukLimit ?? r.whoGuideline) !== null).length;
  const plan = buildTankPlan({
    district: data.district,
    readings: data.readings,
    dataSource: data.dataSource,
    sampleCount: data.sampleCount,
    lastSampleDate: data.lastSampleDate,
    scoredCount,
    hardness: hardness ? { value: hardness.value, estimated: hardness.estimated ?? false, estimatedFrom: hardness.estimatedFrom } : null,
    recommendations,
  });

  const highlights = hasData
    ? districtHighlights({
        data,
        cityPeers,
        neighbours: neighbours.map((n) => ({ district: n.district, score: n.score })),
        nationalAverage,
        hardness,
        pfasNearby,
        cityName: city.name,
        citySlug: city.hasPage ? city.slug : null,
      })
    : [];

  const pfasOnPage = data.pfasDetected && data.pfasLevel != null;
  const pfasAnywhere = pfasOnPage || pfasNearby !== null;
  const pfasNearbySentence = pfasNearby
    ? `Environment Agency monitoring found PFAS in ${pfasNearby.detectionCount.toLocaleString("en-GB")} river and groundwater samples from ${pfasNearby.samplingPointCount} sites within ${pfasNearby.radiusKm} km of ${data.district}, the highest being ${pfasNearby.highest.compound} at ${pfasNearby.highest.value} µg/L about ${pfasNearby.highest.distanceKm} km away. These are environmental samples, not tests of tap water.`
    : "";
  const scoreLabel = data.safetyScore >= 7 ? "safe" : data.safetyScore >= 4 ? "mostly safe but has some issues" : "below average and may need attention";

  const faqs = hasData ? [
    {
      question: `Is ${data.district} tap water safe to drink?`,
      answer: `Based on the latest tests, ${data.district} (${data.areaName}) water scores ${data.safetyScore}/10, which is ${scoreLabel}. ${data.contaminantsFlagged} of ${data.contaminantsTested} tested contaminants exceeded recommended levels. Water is supplied by ${data.supplier}.`,
    },
    {
      question: `What contaminants are in ${data.district} water?`,
      answer: `We tested ${data.contaminantsTested} contaminants in ${data.district} water. ${data.contaminantsFlagged > 0 ? `${data.contaminantsFlagged} were flagged, including ${flaggedNames.slice(0, 3).join(", ")}.` : "None exceeded recommended safe levels."}${pfasOnPage ? ` PFAS (forever chemicals) were also detected at ${data.pfasLevel} µg/L in ${data.pfasSource === "drinking" ? "local drinking water tests" : "nearby environmental monitoring"}.` : pfasNearby ? ` PFAS (forever chemicals) were also measured in rivers and groundwater within ${pfasNearby.radiusKm} km, though not in the tap-water tests themselves.` : ""}`,
    },
    {
      question: `Who supplies water in ${data.district}?`,
      answer: `${data.district} (${data.areaName}) is supplied by ${data.supplier}. You can view their full profile and compliance data on our supplier page.`,
    },
    ...(hardnessValue != null ? [{
      question: `Is ${data.district} water hard or soft?`,
      answer: `${hardnessEstimated ? `No hardness reading has been published for ${data.district} itself. Across the ${hardnessArea} postcode area the typical value is ${hardnessValue} mg/L CaCO3, which is classified as ${hardnessLabel}` : `Water in ${data.district} (${data.areaName}) has a hardness of ${hardnessValue} mg/L CaCO3, which is classified as ${hardnessLabel}`}. ${hardnessValue >= 180 ? "Hard water can cause limescale buildup. A water softener or filter jug may help." : hardnessValue < 60 ? "Soft water is gentle on appliances and skin." : "This is a moderate hardness level."}`,
    }] : []),
    ...(hasData ? [{
      question: `Should I use a water filter in ${data.district}?`,
      answer: `${data.contaminantsFlagged > 0
        ? `With ${data.contaminantsFlagged} contaminant${data.contaminantsFlagged > 1 ? "s" : ""} above recommended levels in ${data.district}, a water filter could help. ${pfasAnywhere ? "A reverse osmosis or activated carbon filter is recommended for PFAS removal." : "A filter jug or under-sink filter can reduce most common contaminants."}`
        : `${data.district} water scored ${data.safetyScore}/10 with no contaminants above recommended levels. A filter is optional but can improve taste, especially if you notice a chlorine flavour.`
      } See our filter recommendations for your area.`,
    }] : []),
    ...(hasData ? [{
      question: `Are there PFAS forever chemicals in ${data.district} water?`,
      answer: pfasOnPage
        ? `Yes, PFAS (per- and polyfluoroalkyl substances) have been detected in ${data.district} at ${data.pfasLevel} µg/L from ${data.pfasSource} monitoring. The UK currently has no legal limit for PFAS in drinking water. Reverse osmosis and activated carbon filters can reduce PFAS levels.`
        : pfasNearby
          ? `The tap-water tests we hold for ${data.district} do not include a PFAS result. ${pfasNearbySentence} The UK currently has no legal limit for PFAS in drinking water; the Drinking Water Inspectorate uses a 0.1 µg/L guideline for individual compounds. Reverse osmosis filters can reduce PFAS levels.`
          : `No PFAS (forever chemicals) result is attached to the tap-water tests for ${data.district}, and the Environment Agency has no PFAS detections in rivers or groundwater within 10 km of it. That reflects where sampling has happened as much as the water itself.`,
    }] : []),
    ...(localRiver ? [{
      question: `How clean is the ${waterBodyNoun(localRiver.river.type)} near ${data.district}?`,
      answer: `${describeRiverStatus(localRiver.river)} This is a rating of the ${waterBodyNoun(localRiver.river.type)}, not of tap water in ${data.district}, which is treated before it reaches homes.`,
    }] : []),
  ] : [];

  return {
    data,
    hasData,
    city,
    hardness,
    nationalAverage,
    recommendations,
    plan,
    pfasNearby,
    river: localRiver,
    england: nationalRivers?.all ?? null,
    neighbours,
    highlights,
    faqs,
    incidents,
  };
}
