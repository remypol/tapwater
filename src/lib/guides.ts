/**
 * Single source of truth for every published guide.
 *
 * RelatedGuides used to hardcode five links (three of them guides), so the
 * other nineteen guides received zero internal links from the ~2,850
 * programmatic postcode and city pages. Add new guides here and they become
 * linkable everywhere the registry is consumed.
 */

export interface GuideMeta {
  slug: string;
  title: string;
  description: string;
}

export const GUIDES_REGISTRY: Record<string, GuideMeta> = {
  "is-uk-tap-water-safe": {
    slug: "is-uk-tap-water-safe",
    title: "Is UK Tap Water Safe?",
    description: "Everything you need to know about tap water safety in the UK",
  },
  "pfas-uk-explained": {
    slug: "pfas-uk-explained",
    title: "PFAS Forever Chemicals",
    description: "What PFAS are and how to reduce your exposure at home",
  },
  "best-water-filter-pfas": {
    slug: "best-water-filter-pfas",
    title: "Best Filter for PFAS Removal",
    description: "The filters with independent certification to remove forever chemicals",
  },
  "lead-pipes-uk": {
    slug: "lead-pipes-uk",
    title: "Lead Pipes in the UK",
    description: "How to check for lead pipes and reduce exposure",
  },
  "water-hardness-map": {
    slug: "water-hardness-map",
    title: "UK Water Hardness Map",
    description: "Is your water hard or soft, and does it matter?",
  },
  "best-water-softener-uk": {
    slug: "best-water-softener-uk",
    title: "Best Water Softener UK",
    description: "Harvey, Kinetico, BWT, Monarch and Water2Buy compared, with real costs",
  },
  "do-i-need-a-water-softener": {
    slug: "do-i-need-a-water-softener",
    title: "Do I Need a Water Softener?",
    description: "The hardness bands, the symptoms, and a postcode check",
  },
  "water-softener-cost-uk": {
    slug: "water-softener-cost-uk",
    title: "Water Softener Cost UK",
    description: "Unit, installation and salt, and how the payback works",
  },
  "water-softener-installation-uk": {
    slug: "water-softener-installation-uk",
    title: "Water Softener Installation UK",
    description: "Where it goes, the bypass, the drain, DIY or plumber",
  },
  "harvey-vs-kinetico-water-softener": {
    slug: "harvey-vs-kinetico-water-softener",
    title: "Harvey vs Kinetico",
    description: "The two premium twin-cylinder softeners, side by side",
  },
  "water-softener-salt-guide": {
    slug: "water-softener-salt-guide",
    title: "Water Softener Salt Guide",
    description: "Tablet, block or granular, and how much you get through",
  },
  "salt-free-water-softener-uk": {
    slug: "salt-free-water-softener-uk",
    title: "Salt-Free Water Softeners UK",
    description: "Conditioners and electronic descalers, honestly assessed",
  },
  "best-water-filters-uk": {
    slug: "best-water-filters-uk",
    title: "Best Water Filters UK",
    description: "Every filter type compared on what it actually removes",
  },
  "best-water-filter-jug-uk": {
    slug: "best-water-filter-jug-uk",
    title: "Best Water Filter Jug UK",
    description: "BRITA vs ZeroWater vs the rest, tested against real data",
  },
  "best-reverse-osmosis-system-uk": {
    slug: "best-reverse-osmosis-system-uk",
    title: "Best Reverse Osmosis System UK",
    description: "The most thorough filtration for PFAS, fluoride, and metals",
  },
  "best-under-sink-water-filter-uk": {
    slug: "best-under-sink-water-filter-uk",
    title: "Best Under Sink Water Filter UK",
    description: "Certified filtration hidden in the kitchen cupboard",
  },
  "best-water-filter-tap-uk": {
    slug: "best-water-filter-tap-uk",
    title: "Best Water Filter Taps UK",
    description: "3-way triflow taps and tap-mounted filters, honestly separated",
  },
  "best-shower-filter-uk": {
    slug: "best-shower-filter-uk",
    title: "Best Shower Filter UK",
    description: "Filter shower heads and inline filters for chlorine, skin and hair",
  },
  "best-whole-house-water-filter-uk": {
    slug: "best-whole-house-water-filter-uk",
    title: "Best Whole House Filter UK",
    description: "Whole house filtration systems compared on real running costs",
  },
  "best-water-testing-kit-uk": {
    slug: "best-water-testing-kit-uk",
    title: "Best Water Testing Kit UK",
    description: "Test your tap water at home before buying any filter",
  },
  "how-to-test-your-water": {
    slug: "how-to-test-your-water",
    title: "How to Test Your Tap Water",
    description: "From DIY strips to professional lab analysis",
  },
  "microplastics-uk-water": {
    slug: "microplastics-uk-water",
    title: "Microplastics in UK Tap Water",
    description: "What the research says and how to reduce exposure",
  },
  "tap-water-vs-bottled-water": {
    slug: "tap-water-vs-bottled-water",
    title: "Tap Water vs Bottled Water",
    description: "Testing, contamination, cost, and environmental impact compared",
  },
  "understanding-your-water-supplier": {
    slug: "understanding-your-water-supplier",
    title: "Understanding Your Water Supplier",
    description: "How to read compliance reports and quality data",
  },
  "water-problems": {
    slug: "water-problems",
    title: "Common Water Problems",
    description: "Cloudy, smelly, or discoloured water: causes and fixes",
  },
  "water-quality-pregnancy": {
    slug: "water-quality-pregnancy",
    title: "Water Quality and Pregnancy",
    description: "What matters in tap water when you are expecting",
  },
  "water-and-eczema": {
    slug: "water-and-eczema",
    title: "Water and Eczema",
    description: "How hard and chlorinated water affects sensitive skin",
  },
  "moving-house-water-check": {
    slug: "moving-house-water-check",
    title: "Moving House Water Check",
    description: "Check the water quality of your next home before you commit",
  },
  "how-long-does-bottled-water-last": {
    slug: "how-long-does-bottled-water-last",
    title: "How Long Does Bottled Water Last?",
    description: "Best-before dates explained: quality marker, not safety deadline",
  },
  "can-you-drink-rainwater-uk": {
    slug: "can-you-drink-rainwater-uk",
    title: "Can You Drink Rainwater?",
    description: "What harvested rain contains and what boiling does not fix",
  },
  "what-is-smart-water": {
    slug: "what-is-smart-water",
    title: "What Is Smart Water, Actually?",
    description: "The chemistry behind the brand, compared with UK tap water",
  },
};

export function getGuide(slug: string): GuideMeta {
  const guide = GUIDES_REGISTRY[slug];
  if (!guide) {
    throw new Error(`Unknown guide slug: ${slug}`);
  }
  return guide;
}

/* ── Related-guides selection ─────────────────────────────────────────── */

export interface RelatedGuideSignals {
  pfasDetected: boolean;
  hasLeadFlagged: boolean;
  isHardWater: boolean;
  hasContaminantsFlagged: boolean;
}

// Shown when few signals fire, so a card grid never renders half empty.
const DEFAULT_SLUGS = [
  "is-uk-tap-water-safe",
  "best-water-filters-uk",
  "how-to-test-your-water",
  "best-water-filter-jug-uk",
];

const MIN_GUIDES = 4;
const MAX_GUIDES = 6;

/**
 * Deterministic (these pages are statically generated): signal-driven picks
 * first, commercial guide before its explainer, then defaults fill up to
 * MIN_GUIDES. Never more than MAX_GUIDES.
 */
export function pickRelatedGuides(signals: RelatedGuideSignals): GuideMeta[] {
  const slugs: string[] = [];
  const add = (slug: string) => {
    if (!slugs.includes(slug)) slugs.push(slug);
  };

  if (signals.pfasDetected) {
    add("best-water-filter-pfas");
    add("pfas-uk-explained");
  }
  if (signals.hasLeadFlagged) {
    add("lead-pipes-uk");
  }
  if (signals.isHardWater) {
    add("best-water-softener-uk");
    add("do-i-need-a-water-softener");
    add("water-hardness-map");
  }
  if (signals.hasContaminantsFlagged) {
    add("best-water-filters-uk");
  }

  for (const slug of DEFAULT_SLUGS) {
    if (slugs.length >= MIN_GUIDES) break;
    add(slug);
  }

  return slugs.slice(0, MAX_GUIDES).map(getGuide);
}
