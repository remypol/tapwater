import { Fragment } from "react";
import Link from "next/link";
import { PostcodeSearch } from "@/components/postcode-search";
import { MOST_CHECKED, MOCK_SUPPLIERS } from "@/lib/mock-data";
import {
  MapPin,
  Activity,
  ChevronRight,
  Building2,
} from "lucide-react";

const TRUST_METRICS = [
  { value: "2,979", label: "Postcode areas" },
  { value: "58M+", label: "Measurements" },
  { value: "50+", label: "PFAS compounds" },
  { value: "Daily", label: "Updates" },
];

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">

      {/* Hero */}
      <section className="bg-hero noise-overlay pt-20 pb-16 lg:pt-28 lg:pb-20 -mx-5 sm:-mx-6 lg:-mx-8 px-5 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="animate-fade-up delay-1 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-accent font-semibold">
            <Activity className="w-3.5 h-3.5" />
            UK Water Quality Data
          </p>

          <h1 className="animate-fade-up delay-2 font-display text-4xl sm:text-5xl lg:text-6xl text-ink tracking-tight italic mt-4">
            What&apos;s in your tap water?
          </h1>

          <p className="animate-fade-up delay-3 text-lg text-muted mt-4 max-w-lg mx-auto leading-relaxed">
            Independent reports for every UK postcode, based on government monitoring data.
          </p>

          <div className="animate-fade-up delay-4 max-w-xl mx-auto mt-8">
            <PostcodeSearch size="lg" />
          </div>
        </div>
      </section>

      {/* Trust metrics */}
      <div className="mt-16 max-w-3xl mx-auto">
        <div className="flex flex-wrap justify-center items-center gap-y-4">
          {TRUST_METRICS.map(({ value, label }, i) => (
            <Fragment key={label}>
              {i > 0 && (
                <div className="hidden lg:block h-10 w-px bg-rule" />
              )}
              <div
                className={`animate-fade-up delay-${i + 1} flex flex-col items-center px-6 lg:px-10`}
              >
                <span className="font-data text-2xl lg:text-3xl font-bold text-ink">
                  {value}
                </span>
                <span className="text-xs text-faint uppercase tracking-wider mt-1">
                  {label}
                </span>
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      {/* Map */}
      <section className="mt-20">
        <h2 className="font-display text-2xl text-ink italic">
          Water Quality Across the UK
        </h2>
        <p className="text-sm text-muted mt-1">
          Explore water quality data by region. Click any area for a detailed report.
        </p>

        <div className="card-elevated mt-4 aspect-[16/9] overflow-hidden rounded-xl">
          <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center">
            <MapPin className="w-8 h-8 text-faint/40" />
            <p className="text-sm text-faint mt-2">Interactive map in development</p>
            <p className="text-xs text-faint/60 mt-1">Powered by Environment Agency data</p>
          </div>
        </div>
      </section>

      {/* Most checked postcodes */}
      <section className="mt-16">
        <h2 className="font-display text-xl text-ink italic">
          Most checked areas
        </h2>

        <div className="flex flex-wrap gap-2 mt-4">
          {MOST_CHECKED.map((district) => (
            <Link
              key={district}
              href={`/postcode/${district}/`}
              className="pill"
            >
              <MapPin className="w-3 h-3 text-faint mr-1" />
              {district}
            </Link>
          ))}
        </div>
      </section>

      {/* Water suppliers */}
      <section className="mt-16 mb-20">
        <h2 className="font-display text-xl text-ink italic">
          Water suppliers
        </h2>
        <p className="text-sm text-muted mt-1">
          We track data from all major UK water companies
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {MOCK_SUPPLIERS.map((supplier) => (
            <Link
              key={supplier.id}
              href={`/supplier/${supplier.id}/`}
              className="card p-4 group block"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-faint shrink-0" />
                <span className="font-medium text-ink group-hover:text-accent transition">
                  {supplier.name}
                </span>
              </div>
              <p className="text-sm text-muted mt-1">{supplier.region}</p>
              <div className="flex items-center mt-2">
                <span className="text-xs text-faint">{supplier.customersM}M customers</span>
                <ChevronRight className="w-4 h-4 text-faint group-hover:text-accent transition ml-auto" />
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
