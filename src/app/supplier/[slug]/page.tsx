import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { MOCK_SUPPLIERS } from "@/lib/mock-data";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return MOCK_SUPPLIERS.map((s) => ({ slug: s.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supplier = MOCK_SUPPLIERS.find((s) => s.id === slug);

  if (!supplier) {
    return { title: "Not Found" };
  }

  const description = `${supplier.name} serves ${supplier.customersM} million customers across ${supplier.region}. View compliance rates, supply zones, and postcode areas served.`;

  return {
    title: `${supplier.name} Water Quality Report`,
    description,
    openGraph: {
      title: `${supplier.name} Water Quality Report`,
      description,
      url: `https://tapwater.uk/supplier/${supplier.id}/`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${supplier.name} Water Quality Report`,
      description,
    },
  };
}

export default async function SupplierPage({ params }: Props) {
  const { slug } = await params;
  const supplier = MOCK_SUPPLIERS.find((s) => s.id === slug);

  if (!supplier) {
    notFound();
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 1. Breadcrumb */}
      <nav className="text-sm text-slate-500 mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-slate-700 transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/supplier" className="hover:text-slate-700 transition-colors">
              Suppliers
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-slate-700" aria-current="page">
            {supplier.name}
          </li>
        </ol>
      </nav>

      {/* 2. H1 */}
      <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-6">
        {supplier.name} Water Quality Report
      </h1>

      {/* 3. Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4 text-center data-card">
          <p className="text-2xl font-bold font-data text-slate-900">
            {supplier.customersM}M
          </p>
          <p className="text-sm text-slate-500 mt-1">Customers Served</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 text-center data-card">
          <p className="text-2xl font-bold font-data text-slate-900 truncate">
            {supplier.region}
          </p>
          <p className="text-sm text-slate-500 mt-1">Service Area</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 text-center data-card">
          <p className="text-2xl font-bold font-data text-safe">
            {supplier.complianceRate}%
          </p>
          <p className="text-sm text-slate-500 mt-1">Compliance Rate</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 text-center data-card">
          <a
            href={supplier.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Visit Site
          </a>
          <p className="text-sm text-slate-500 mt-1">Official Site</p>
        </div>
      </div>

      {/* 4. Supply Zone Map */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          Supply Zone Map
        </h2>
        <div className="bg-slate-50 rounded-xl border border-slate-200 h-64 flex items-center justify-center">
          <span className="text-slate-400">Map coming soon</span>
        </div>
      </section>

      {/* 5. Postcode Areas Served */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          Postcode Areas Served
        </h2>
        <div className="flex flex-wrap gap-2">
          {supplier.postcodeAreas.map((area) => (
            <Link
              key={area}
              href={`/postcode/${area}/`}
              className="bg-white border border-slate-200 rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
            >
              {area}
            </Link>
          ))}
        </div>
      </section>

      {/* 6. About */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          About {supplier.name}
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          {supplier.name} is one of the UK&apos;s regulated water companies, serving
          approximately {supplier.customersM} million customers across{" "}
          {supplier.region}. As a licensed water and wastewater provider, the
          company is responsible for treating, testing, and delivering safe
          drinking water to homes and businesses throughout its supply area. All
          water quality data is monitored against standards set by the Drinking
          Water Inspectorate (DWI) and the Environment Agency.
        </p>
      </section>
    </div>
  );
}
