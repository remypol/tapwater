import { HardWaterFixes } from "@/components/hard-water-fixes";
import type { SoftenerLeadSource } from "@/lib/softener-lead-source";

interface SoftenerLeadFormProps {
  postcode?: string;
  hardnessValue: number;
  hardnessLabel: string;
  source: SoftenerLeadSource;
}

/**
 * Where the softener quote form used to be. Since 26 November 2026 nobody buys the
 * requests, so this renders the hard-water products instead (see HardWaterFixes).
 * The name stays so the twenty-odd pages that place it keep their position.
 */
export function SoftenerLeadForm({ postcode, hardnessValue, source }: SoftenerLeadFormProps) {
  return <HardWaterFixes hardness={hardnessValue} place={postcode} pageType={source} placement="hard-water-fixes" postcodeArea={postcode} />;
}
