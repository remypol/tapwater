import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ChevronRight, AlertTriangle, Droplets, FlaskConical, Building2, TestTube, Microscope, Scale, ShieldCheck, Sparkles, Home, ShieldAlert, GlassWater } from "lucide-react";

export const metadata: Metadata = {
  title: "Guides — UK Water Quality Research",
  description:
    "In-depth guides on UK tap water quality: PFAS forever chemicals, lead pipes, water hardness, testing your water, and understanding your supplier.",
  openGraph: {
    title: "Water Quality Guides",
    description: "In-depth guides on UK tap water quality.",
    url: "https://www.tapwater.uk/guides",
  },
};

const GUIDES = [
  {
    slug: "best-water-filters-uk",
    title: "Best Water Filters UK",
    subtitle: "Tested against real contaminant data, not marketing claims",
    icon: ShieldCheck,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
  },
  {
    slug: "pfas-uk-explained",
    title: "PFAS in UK Drinking Water",
    subtitle: "Everything you need to know about forever chemicals",
    icon: AlertTriangle,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
  },
  {
    slug: "lead-pipes-uk",
    title: "The UK's Lead Pipe Problem",
    subtitle: "Which areas are most affected and what you can do",
    icon: Droplets,
    iconColor: "text-red-600",
    iconBg: "bg-red-50",
  },
  {
    slug: "water-hardness-map",
    title: "UK Water Hardness Map",
    subtitle: "Is your water hard or soft, and does it matter?",
    icon: FlaskConical,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
  },
  {
    slug: "understanding-your-water-supplier",
    title: "Understanding Your Water Supplier",
    subtitle: "How to read compliance reports and quality data",
    icon: Building2,
    iconColor: "text-slate-600",
    iconBg: "bg-slate-50",
  },
  {
    slug: "how-to-test-your-water",
    title: "How to Test Your Tap Water",
    subtitle: "From DIY strips to professional lab analysis",
    icon: TestTube,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  {
    slug: "microplastics-uk-water",
    title: "Microplastics in UK Tap Water",
    subtitle: "What the research says and how to reduce exposure",
    icon: Microscope,
    iconColor: "text-cyan-600",
    iconBg: "bg-cyan-50",
  },
  {
    slug: "tap-water-vs-bottled-water",
    title: "Tap Water vs Bottled Water",
    subtitle: "Testing, contamination, cost, and environmental impact compared",
    icon: Scale,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-50",
  },
  {
    slug: "best-reverse-osmosis-system-uk",
    title: "Best Reverse Osmosis System UK",
    subtitle: "For PFAS, fluoride, and heavy metals",
    icon: Droplets,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
  },
  {
    slug: "best-shower-filter-uk",
    title: "Best Shower Filter UK",
    subtitle: "Remove chlorine for better skin and hair",
    icon: Sparkles,
    iconColor: "text-cyan-600",
    iconBg: "bg-cyan-50",
  },
  {
    slug: "best-whole-house-water-filter-uk",
    title: "Best Whole House Filter UK",
    subtitle: "Filter every tap in your home",
    icon: Home,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  {
    slug: "best-water-testing-kit-uk",
    title: "Best Water Testing Kit UK",
    subtitle: "Test your tap water at home",
    icon: FlaskConical,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
  },
  {
    slug: "best-water-filter-pfas",
    title: "Best Filter for PFAS Removal",
    subtitle: "The only filters that remove forever chemicals",
    icon: ShieldAlert,
    iconColor: "text-red-600",
    iconBg: "bg-red-50",
  },
  {
    slug: "best-water-filter-jug-uk",
    title: "Best Water Filter Jug UK",
    subtitle: "BRITA vs ZeroWater vs the rest",
    icon: GlassWater,
    iconColor: "text-sky-600",
    iconBg: "bg-sky-50",
  },
];

export default function GuidesPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.15em] text-accent font-semibold flex items-center gap-1.5">
          <FileText className="w-3 h-3" />
          Research &amp; Guides
        </p>
        <h1 className="font-display text-3xl lg:text-4xl text-ink tracking-tight italic mt-2">
          Water quality guides
        </h1>
        <p className="text-lg text-muted mt-3 leading-relaxed">
          In-depth research on UK tap water quality, based on government data
          and scientific evidence. Written to help you make informed decisions
          about what you drink.
        </p>
      </div>

      <div className="mt-10 space-y-3">
        {GUIDES.map((guide) => {
          const Icon = guide.icon;
          return (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="card p-5 flex items-center gap-4 group block"
            >
              <div
                className={`w-10 h-10 rounded-xl ${guide.iconBg} flex items-center justify-center shrink-0`}
              >
                <Icon className={`w-5 h-5 ${guide.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink group-hover:text-accent transition-colors">
                  {guide.title}
                </p>
                <p className="text-sm text-muted mt-0.5">{guide.subtitle}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-faint group-hover:text-accent transition-colors shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
