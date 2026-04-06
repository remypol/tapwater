import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";

interface GuideEntry {
  href: string;
  title: string;
  description: string;
}

interface RelatedGuidesProps {
  pfasDetected: boolean;
  hasLeadFlagged: boolean;
  isHardWater: boolean;
  hasContaminantsFlagged: boolean;
}

export function RelatedGuides({
  pfasDetected,
  hasLeadFlagged,
  isHardWater,
  hasContaminantsFlagged,
}: RelatedGuidesProps) {
  const guides: GuideEntry[] = [
    {
      href: "/guides/is-uk-tap-water-safe/",
      title: "Is UK Tap Water Safe?",
      description: "Everything you need to know about tap water safety in the UK",
    },
  ];

  if (pfasDetected) {
    guides.push({
      href: "/guides/pfas-uk-explained/",
      title: "PFAS Forever Chemicals",
      description: "What PFAS are and how to reduce your exposure at home",
    });
  }
  if (hasLeadFlagged) {
    guides.push({
      href: "/guides/lead-pipes-uk/",
      title: "Lead Pipes in the UK",
      description: "How to check for lead pipes and reduce exposure",
    });
  }
  if (isHardWater) {
    guides.push({
      href: "/hardness/",
      title: "Water Hardness Checker",
      description: "Check your water hardness and what it means for your home",
    });
  }
  if (hasContaminantsFlagged) {
    guides.push({
      href: "/filters/",
      title: "Water Filter Recommendations",
      description: "Find the right filter for your water quality issues",
    });
  }

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2 mb-1">
        <BookOpen className="w-4 h-4 text-accent shrink-0" />
        <h2 className="font-display text-2xl text-ink italic">Related guides</h2>
      </div>
      <p className="text-sm text-muted mt-1 mb-5">
        Learn more about the water quality issues relevant to this area.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {guides.map((guide) => (
          <Link
            key={guide.href}
            href={guide.href}
            className="card p-4 flex items-start justify-between gap-3 group"
          >
            <div className="min-w-0">
              <p className="font-semibold text-ink text-sm group-hover:text-accent transition-colors">
                {guide.title}
              </p>
              <p className="text-sm text-muted mt-0.5 leading-snug">{guide.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-faint group-hover:text-accent transition-colors shrink-0 mt-0.5" />
          </Link>
        ))}
      </div>
    </section>
  );
}
