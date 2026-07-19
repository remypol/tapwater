import type { FilterProduct } from "./types";

interface RecommendationMessageInput {
  postcodeDistrict: string;
  contaminantsFlagged: number;
  matchedContaminants: string[];
}

export function getRecommendationMessage({
  postcodeDistrict,
  contaminantsFlagged,
  matchedContaminants,
}: RecommendationMessageInput): string {
  if (contaminantsFlagged === 0) {
    return `Your water in ${postcodeDistrict} is within recommended levels. A filter is optional for taste or convenience; check the removal list below before choosing one.`;
  }

  if (matchedContaminants.length === 0) {
    return `This product does not directly match the concerns flagged in ${postcodeDistrict}. Review the report details or test your water before buying.`;
  }

  const concerns = matchedContaminants.length === 1
    ? matchedContaminants[0]
    : `${matchedContaminants.slice(0, -1).join(", ")} and ${matchedContaminants.at(-1)}`;
  const unmatchedCount = Math.max(0, contaminantsFlagged - matchedContaminants.length);
  const coverageGap = unmatchedCount > 0
    ? ` It does not cover ${unmatchedCount} other flagged concern${unmatchedCount === 1 ? "" : "s"} in this report.`
    : "";

  return `${concerns} ${matchedContaminants.length === 1 ? "was" : "were"} flagged in ${postcodeDistrict}. This product lists reduction for ${concerns}.${coverageGap} Check the removal list below and its certification before relying on it for health concerns.`;
}

export function getTransparentLimitations(product: FilterProduct): string[] {
  const explicit = product.cons.filter((item) =>
    /^(does not|doesn't|won't|only removes|cannot|not certified)/i.test(item),
  );
  return explicit.slice(0, 2);
}
